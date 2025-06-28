import "dotenv/config";
import { createServer } from "http";
import { Pool } from "pg";
import { Server as IOServer } from "socket.io";

const express = require("express");
import type { Request, Response, NextFunction } from "express";

// ───── 1. DB pool ───────────────────────────
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "agenspw",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "postgres",
});

// Helper to run Cypher inside AgensGraph
export async function cypher(graph: string, query: string, params: any[] = []) {
  try {
    const sql = `SELECT * FROM cypher($1, $$ ${query} $$) AS (r agtype)`;
    const { rows } = await pool.query(sql, [graph, ...params]);
    return rows.map((r) => JSON.parse(r.r));
  } catch (error) {
    console.error("Cypher query error:", error);
    throw error;
  }
}

// ───── 2. REST API routes ───────────────────
const app = express();
app.use(express.json());

// CORS middleware for development
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check
app.get("/health", (_: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Database health check
app.get("/health/db", async (_: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT 1 as test");
    res.json({ 
      status: "ok", 
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
  }
});

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
    res.json({ 
      data,
      count: data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching people:", error);
    res.status(500).json({ 
      error: "Failed to fetch people",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
  }
});

// Generic graph query endpoint
app.post("/api/graph/query", async (req: Request, res: Response): Promise<void> => {
  try {
    const { graph, query, params } = req.body;
    
    if (!graph || !query) {
      res.status(400).json({
        error: "Missing required fields",
        message: "Both 'graph' and 'query' are required",
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const data = await cypher(graph, query, params || []);
    res.json({ 
      data,
      count: data.length,
      graph,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error executing graph query:", error);
    res.status(500).json({ 
      error: "Failed to execute graph query",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
  }
});

// ───── 3. Socket.IO ─────────────────────────
const http = createServer(app);
const io = new IOServer(http, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  } 
});

io.on("connection", (socket) => {
  console.log("WebSocket connected:", socket.id);
  
  socket.on("graph:query", async ({ graph, q }) => {
    try {
      console.log(`Executing query on graph '${graph}':`, q);
      const data = await cypher(graph, q);
      socket.emit("graph:data", {
        data,
        graph,
        query: q,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("WebSocket query error:", error);
      socket.emit("graph:error", {
        error: "Query execution failed",
        message: error instanceof Error ? error.message : "Unknown error",
        graph,
        query: q,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("WebSocket disconnected:", socket.id);
  });
});

// ───── 4. Server startup ───────────────────
const PORT = process.env.PORT || 4000;

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await pool.end();
  process.exit(0);
});

http.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Database check: http://localhost:${PORT}/health/db`);
  console.log(`⚡ WebSocket server ready`);
});