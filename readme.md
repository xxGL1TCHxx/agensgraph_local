Below is an end‑to‑end, **all‑local** blueprint that swaps in the stack you specified while still giving you AgensGraph, a label/edge designer, query viz, and an API that speaks both REST and WebSocket.

---

## 1. Runtime layer (Docker‑Compose)

```yaml
# docker-compose.yml
version: "3.9"
services:
  db:
    image: bitnine/agensgraph:2.15          # PostgreSQL 15 + AGE/Cypher
    environment:
      POSTGRES_PASSWORD: agenspw
    ports: ["5432:5432"]

  browser:                                  # Drag‑n‑drop label & query UI
    image: bitnine/agensbrowser:v2.1.1
    environment:
      AG_DB_HOST: db
      AG_DB_PORT: 5432
      AG_DB_USER: postgres
      AG_DB_PASS: agenspw
    ports: ["3001:3001"]
    depends_on: [db]

  api:
    build: ./api                            # Express + TS
    environment:
      DB_HOST: db
      DB_PASS: agenspw
    ports: ["4000:4000"]
    depends_on: [db]

  web:
    build: ./web                            # React 18 + Vite
    ports: ["5173:5173"]
    environment:
      VITE_API_ORIGIN: http://localhost:4000
    depends_on: [api]
```

*Bring‑up:* `docker compose up -d`.

---

## 2. Backend (Express + TypeScript)

### 2.1 Project quick scaffold

```bash
mkdir api && cd api
pnpm init
pnpm add express pg socket.io
pnpm add -D typescript ts-node nodemon @types/{express,node,pg}
npx tsc --init
```

### 2.2 Core files

<details><summary><code>src/server.ts</code></summary>

```ts
import "dotenv/config";
import { createServer } from "http";
import express, { Request, Response } from "express";
import { Pool } from "pg";
import { Server as IOServer } from "socket.io";

// ───── 1. DB pool ───────────────────────────
const pool = new Pool({
  host: process.env.DB_HOST,
  user: "postgres",
  password: process.env.DB_PASS,
  port: 5432,
});

// Helper to run Cypher inside AgensGraph
export async function cypher(graph: string, query: string, params: any[] = []) {
  const sql = `SELECT * FROM cypher($1, $$ ${query} $$) AS (r agtype)`;
  const { rows } = await pool.query(sql, [graph, ...params]);
  return rows.map((r) => JSON.parse(r.r));
}

// ───── 2. REST API routes ───────────────────
const app = express();
app.use(express.json());

// Health check
app.get("/health", (_: Request, res: Response) => res.send("ok"));

// People endpoint
app.get("/api/people", async (req: Request, res: Response) => {
  try {
    const { filter } = req.query;
    // Simple filtering - you can extend this based on your needs
    let query = "MATCH (p:Person) RETURN p";
    if (filter) {
      query = `MATCH (p:Person) WHERE p.name CONTAINS '${filter}' RETURN p`;
    }
    const data = await cypher("company", query);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch people" });
  }
});

// Generic graph query endpoint
app.post("/api/graph/query", async (req: Request, res: Response) => {
  try {
    const { graph, query, params } = req.body;
    const data = await cypher(graph, query, params || []);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: "Failed to execute graph query" });
  }
});

// ───── 3. Socket.IO ─────────────────────────
const http = createServer(app);
const io = new IOServer(http, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("ws connected", socket.id);
  socket.on("graph:query", async ({ graph, q }) => {
    socket.emit("graph:data", await cypher(graph, q));
  });
});

http.listen(4000, () => console.log("API up on :4000"));
```

</details>

*Highlights*

* **REST API** with Express routes for `/api/people`, `/api/graph/query`, etc.
* **Socket.IO v4**—TypeScript types on both sides.  ([socket.io][1], [neu-se.github.io][2])
* **`cypher()` helper** keeps SQL‑only libraries blissfully unaware of graph syntax.

---

## 3. Frontend (React 18 + Vite)

### 3.1 Scaffold

```bash
mkdir web && cd web
pnpm create vite@latest my-app --template react-ts
cd my-app
pnpm add wouter @tanstack/react-query axios socket.io-client react-force-graph-2d recharts
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3.2 Wiring TanStack Query + Wouter

<details><summary><code>src/main.tsx</code></summary>

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Router, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { io } from "socket.io-client";
import App from "./routes/App";
import "./index.css";

export const socket = io(import.meta.env.VITE_API_ORIGIN);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Router>
    <QueryClientProvider client={new QueryClient()}>
      <nav className="p-4 shadow">
        <Link href="/">Home</Link>{" "}
        <Link href="/graph">Graph</Link>{" "}
        <Link href="/charts">Charts</Link>
      </nav>
      <App />
    </QueryClientProvider>
  </Router>,
);
```

</details>

### 3.3 Graph canvas (react‑force‑graph)

<details><summary><code>src/routes/Graph.tsx</code></summary>

```tsx
import { useEffect, useState } from "react";
import ForceGraph2D, { GraphData } from "react-force-graph-2d";
import { socket } from "../main";

export default function GraphView() {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });

  useEffect(() => {
    socket.emit("graph:query", { graph: "company", q: "MATCH p=()-[r]->() RETURN p LIMIT 300" });
    socket.on("graph:data", (rows) => {
      // Convert rows → {nodes, links}
      const nodes = new Map<string, any>();
      const links: any[] = [];
      rows.forEach(({ start, relationship, end }: any) => {
        nodes.set(start.id, { id: start.id, label: start.properties.name });
        nodes.set(end.id, { id: end.id, label: end.properties.name });
        links.push({ source: start.id, target: end.id, type: relationship.label });
      });
      setData({ nodes: [...nodes.values()], links });
    });
    return () => socket.off("graph:data");
  }, []);

  return <ForceGraph2D graphData={data} nodeLabel="label" />;
}
```

</details>
`react-force-graph` gives you zoom, pan, drag, and hover out‑of‑the‑box.

### 3.4 Recharts example

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function PeopleHistogram() {
  const { data } = useQuery(["people"], async () =>
    axios.get("/api/people").then((r) => r.data.data),
  );
  return (
    <BarChart width={400} height={300} data={data || []}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="count" />
    </BarChart>
  );
}
```

---

## 4. Development workflow

| Task                | Command                                                                      |
| ------------------- | ---------------------------------------------------------------------------- |
| Hot reload API      | `pnpm nodemon --watch src --exec ts-node src/server.ts`                      |
| Hot reload frontend | `pnpm dev` inside `web`                                                      |
| Graph design        | `http://localhost:3001` (AgensBrowser UI) ([hub.docker.com][3], [dev.to][4]) |
| Seed data           | `psql -h localhost -U postgres -f seed.cypher`                               |

---

## 5. Next steps / production hardening

1. **Swap in persistent storage** – change Express pool to point at AgensGraph instead of the in‑memory structures originally planned.
2. **Auth** – protect REST & WS with JWT (e.g., `express-jwt` plus React context).
3. **Migrations** – keep Cypher DDL in `/db/migrations` and run via `npm run migrate`.
4. **Monitoring** – pgAdmin or Timescale for metrics; or simply ship logs to Loki/Promtail.
5. **CI** – GitHub Actions job: lint → unit test → Docker build → push to local registry.

---

### Timeline (realistic)

| Day | Deliverable                                                          |
| --- | -------------------------------------------------------------------- |
| 0‑1 | Docker stack up; React+Vite hello‑world; Express API health endpoint |
| 2‑3 | REST controllers returning live Cypher data                          |
| 4   | Socket.IO real‑time feed + React force graph view                    |
| 5   | Recharts dashboards; Tailwind + shadcn/ui polish                     |
| 6   | Auth, env‑driven configs; first migration scripts                    |
| 7+  | Performance passes, CI, deployment scripts                           |

With this you keep **every byte** on‑prem, yet enjoy the same UX you'd expect from a hosted graph platform—custom labels, live sub‑graph exploration, REST API, and real‑time push updates, all built on the stack you prefer. Happy coding!

[1]: https://socket.io/docs/v4/typescript/?utm_source=chatgpt.com "TypeScript - Socket.IO"
[2]: https://neu-se.github.io/CS4530-Spring-2025/tutorials/week5-socketio-basics?utm_source=chatgpt.com "Socket.IO Tutorial | CS4530, Spring 2025 - GitHub Pages"
[3]: https://hub.docker.com/r/bitnine/agensbrowser?utm_source=chatgpt.com "bitnine/agensbrowser - Docker Image"
[4]: https://dev.to/chidera/step-by-step-guide-on-installing-agensbrowser-using-a-docker-image-1f53?utm_source=chatgpt.com "Step-by-step guide on installing AgensBrowser using a Docker image."
