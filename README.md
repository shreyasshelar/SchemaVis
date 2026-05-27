# SchemaVis — AI-powered ER Diagram Builder

> Chat with AI to design your database schema. Describe your domain in plain English (or paste DDL) and watch a live entity-relationship diagram build itself in real time.

[![CI](https://img.shields.io/github/actions/workflow/status/shreyasshelar/schema-vis/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/shreyasshelar/schema-vis/actions/workflows/ci.yml)
[![Java](https://img.shields.io/badge/Java-21-007396?style=flat-square&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

---

## How it works

1. **Start a conversation** — describe your domain, paste DDL, or pick a suggestion.
2. **Chat iteratively** — the AI asks clarifying questions about tables, columns, and relationships.
3. **Watch the diagram appear** — every time the schema evolves, the React Flow ER diagram updates live in the right panel.
4. **Schema complete** — when the AI is satisfied it marks the schema complete and the diagram locks.

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Backend | Java 21 + Spring Boot 3.2 | Virtual threads, mature ecosystem, strong type safety |
| AI | Gemini 2.5 Flash (REST) | Free tier, fast, excellent instruction-following |
| Database | PostgreSQL 16 | Persistent, production-grade, full SQL dialect |
| Migrations | Flyway | Versioned, auditable, same SQL in dev and prod |
| Rate limiting | Bucket4j | In-process token-bucket per IP, Redis-upgradeable |
| Frontend | React 18 + TypeScript + Vite 8 | Type safety, instant HMR, optimised production bundles |
| Styling | Tailwind CSS v3 | Utility-first, single design-token source of truth |
| Animation | Framer Motion v11 | Spring-physics for smooth, Apple-quality feel |
| Diagram | @xyflow/react v12 + Dagre | Interactive canvas with automatic layout |
| 3D background | @react-three/fiber + Bloom | Ambient depth, lazy-loaded, zero blocking impact |
| State | Zustand v4 | Minimal global state, session-persisted |
| Data fetching | TanStack Query v5 | Caching, optimistic updates, error boundaries |

---

## Quick start

### Prerequisites

- **Java 21+** and **Maven 3.9+**
- **Node.js 22+** (Vite 8 requires it)
- **Docker** (for local PostgreSQL)
- A free [Gemini API key](https://aistudio.google.com)

### 1 — Start the database

```bash
docker compose -f docker-compose.dev.yml up -d
# PostgreSQL running on localhost:5432
```

### 2 — Run the backend

```bash
cd backend
export GEMINI_API_KEY=your_key_here
mvn spring-boot:run
# API ready at http://localhost:8080
# Swagger UI at http://localhost:8080/swagger-ui/index.html
```

### 3 — Run the frontend

```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5173
```

The Vite dev server proxies `/api/*` → `http://localhost:8080` automatically — no CORS setup needed.

### Or use `make`

```bash
make dev-db        # start PostgreSQL
make dev-backend   # run Spring Boot
make dev-frontend  # run Vite
```

---

## Docker (full production stack)

```bash
cp .env.example .env
# Edit .env — set GEMINI_API_KEY at minimum

docker compose up --build
# Frontend: http://localhost
# Backend:  http://localhost:8080
```

---

## Project structure

```
schema_visualiser/
├── .github/workflows/ci.yml   # GitHub Actions CI
├── backend/
│   ├── src/main/java/com/schemavis/
│   │   ├── controller/        # REST endpoints (Session, Chat)
│   │   ├── service/           # GeminiService, ChatService, DiagramParserService
│   │   ├── domain/            # JPA entities — Session, Message
│   │   ├── dto/               # API request/response records
│   │   ├── repository/        # Spring Data JPA
│   │   ├── config/            # CORS, rate-limit, OpenAPI, RestTemplate
│   │   └── exception/         # GlobalExceptionHandler + AppException
│   └── src/main/resources/
│       ├── db/migration/      # Flyway SQL migrations (V1__init.sql …)
│       ├── application.yml
│       ├── application-dev.yml
│       └── application-prod.yml
├── frontend/src/
│   ├── api/                   # Axios client + typed endpoint wrappers
│   ├── components/
│   │   ├── chat/              # WelcomeScreen, MessageBubble, ChatInput, DdlInput
│   │   ├── diagram/           # DiagramPanel, ERNode, EREdge (React Flow)
│   │   ├── layout/            # Header, SplitPane (draggable)
│   │   ├── three/             # BackgroundScene + FloatingGraph (R3F + Bloom)
│   │   └── ui/                # Spinner, Tooltip, IconButton
│   ├── hooks/                 # useChat, useSession (TanStack Query)
│   ├── lib/                   # mermaidParser, diagramLayout (Dagre)
│   ├── store/                 # appStore (Zustand, session-persisted)
│   ├── styles/                # globals.css (Tailwind + design tokens)
│   └── types/                 # api.ts, diagram.ts
├── docker-compose.yml         # Production: frontend + backend + postgres
├── docker-compose.dev.yml     # Development: postgres only
├── Makefile                   # Developer shortcuts
└── .env.example               # Environment variable template
```

---

## API reference

Full interactive docs at `/swagger-ui/index.html` when the backend is running.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/sessions` | Create a session (optionally with DDL body) |
| `GET` | `/api/sessions/{id}` | Fetch session + full message history |
| `POST` | `/api/sessions/{id}/messages` | Send a chat message, get AI reply + diagram |
| `DELETE` | `/api/sessions/{id}` | Delete a session |
| `GET` | `/actuator/health` | Health check |

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | — | Gemini API key from [aistudio.google.com](https://aistudio.google.com) |
| `DATABASE_URL` | Prod only | localhost:5432 | JDBC URL for PostgreSQL |
| `DB_USER` | Prod only | `schemavis` | Database username |
| `DB_PASSWORD` | Prod only | `changeme` | Database password |
| `RATE_LIMIT` | No | `20` | Max AI requests per IP per minute |

---

## Scaling notes

- **Rate limiting** — swap `RateLimitConfig`'s `ConcurrentHashMap` for a Redis-backed Bucket4j `ProxyManager` to support multiple backend instances.
- **AI provider** — `GeminiService` is self-contained. Swap the REST call for any OpenAI-compatible endpoint by changing the URL and payload format.
- **Database** — Flyway manages all DDL. Point `DATABASE_URL` at any JDBC-compatible PostgreSQL instance (RDS, Cloud SQL, Supabase, Railway, Neon…).

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Run `make test` to verify everything passes
4. Open a pull request against `main`
