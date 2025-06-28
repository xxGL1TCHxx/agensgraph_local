# AgensGraph Full-Stack Application

A modern full-stack graph database application built with AgensGraph, Express.js, React, and real-time WebSocket capabilities.

## 🏗️ Architecture

- **Backend**: Express.js with TypeScript, AgensGraph integration
- **Frontend**: React 18 with Vite, graph visualization, charts
- **Database**: AgensGraph (PostgreSQL + AGE extension)
- **Real-time**: Socket.IO for live updates
- **Infrastructure**: Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- pnpm package manager

### Development Setup

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd agensgraph-app
   ```

2. **Start the infrastructure**:
   ```bash
   docker compose up -d db browser
   ```

3. **Access services**:
   - **AgensGraph Database**: `localhost:5432`
   - **AgensBrowser UI**: http://localhost:3001
   - **API**: http://localhost:4000 (after setup)
   - **Web App**: http://localhost:5173 (after setup)

## 📁 Project Structure

```
.
├── api/                    # Express.js backend
│   ├── src/
│   │   ├── server.ts      # Main server file
│   │   └── ...
│   ├── package.json
│   └── Dockerfile
├── web/                    # React frontend
│   ├── src/
│   │   ├── main.tsx       # Entry point
│   │   ├── routes/        # Page components
│   │   └── ...
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # Multi-service orchestration
└── dev-plan.md            # Detailed development plan
```

## 🎯 Features (Planned)

### Backend API
- [x] AgensGraph database connectivity
- [x] REST API endpoints (/health, /api/people, /api/graph/query)
- [x] WebSocket real-time updates
- [x] Cypher query execution helper

### Frontend
- [x] React 18 with TypeScript
- [x] Graph visualization with react-force-graph-2d
- [x] Charts and analytics with Recharts
- [x] Routing with Wouter
- [x] State management with TanStack Query
- [x] Real-time updates via Socket.IO

### Infrastructure
- [x] Docker Compose setup
- [x] AgensGraph 2.15 database
- [x] AgensBrowser UI for graph design
- [x] Development environment configuration

## 🛠️ Development Workflow

### Backend Development

```bash
cd api
pnpm install
pnpm dev  # Hot reload with nodemon
```

### Frontend Development

```bash
cd web
pnpm install
pnpm dev  # Vite dev server with HMR
```

### Database Management

```bash
# Connect to AgensGraph
psql -h localhost -U postgres -d postgres

# Load sample data
psql -h localhost -U postgres -f seed.cypher
```

## 📊 Development Progress

- [x] **Phase 1**: Environment Setup & Infrastructure
- [ ] **Phase 2**: Backend Development
- [ ] **Phase 3**: Frontend Development
- [ ] **Phase 4**: Data Integration & Testing
- [ ] **Phase 5**: Polish & Production Readiness
- [ ] **Phase 6**: Deployment & Documentation

See `dev-plan.md` for detailed task breakdown and timeline.

## 🔧 Configuration

### Environment Variables

**API (.env)**:
```
DB_HOST=localhost
DB_USER=postgres
DB_PASS=agenspw
DB_PORT=5432
```

**Web (.env)**:
```
VITE_API_ORIGIN=http://localhost:4000
```

## 🧪 Testing

```bash
# Backend tests
cd api
pnpm test

# Frontend tests
cd web
pnpm test

# E2E tests
pnpm test:e2e
```

## 📈 Performance Targets

- API response times < 200ms
- WebSocket latency < 100ms
- Graph rendering < 2s for 1000 nodes
- Bundle size < 2MB

## 🤝 Contributing

1. Follow the development plan in `dev-plan.md`
2. Use the coordination system in `.cursor/scratchpad.md`
3. Write tests before implementation (TDD)
4. Ensure all checks pass before committing

## 📚 Resources

- [AgensGraph Documentation](https://bitnine.net/documentation/)
- [AgensBrowser Guide](https://hub.docker.com/r/bitnine/agensbrowser)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/current/)

## 📄 License

MIT License - see LICENSE file for details.