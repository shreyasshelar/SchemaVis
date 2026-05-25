# SchemaVis — Production Architecture Plan

> Read this before touching any code. Every technology here was chosen for a specific reason. If you want to change the stack, change this document first.

---

## What We Are Building

An AI-powered database schema visualiser. A user pastes DDL or describes their database in plain English. The AI asks clarifying questions until it has the complete picture, then renders a live, interactive ER diagram. Built SaaS-ready from day one: persistent sessions, clean API boundaries, and a frontend that can grow to support auth, teams, and billing without rewrites.

---

## Stack Decisions

### Backend — Spring Boot 3.2 + Java 21

| Technology | Why |
|---|---|
| **Spring Boot 3.2** | Industry standard for Java REST APIs. First-class Docker, Actuator, and cloud-native support out of the box. |
| **Java 21** | Virtual threads (Project Loom) — handles hundreds of concurrent AI calls without thread-pool tuning. |
| **Spring Data JPA** | Persistent sessions survive restarts. When we add users and billing, the data is already in a real DB. In-memory maps are prototypes. |
| **H2 (dev) / PostgreSQL (prod)** | H2 for zero-setup local dev; swap one property for prod. Nothing changes in code. |
| **Flyway** | Every schema change is a versioned migration file. The DB and the code evolve together; no manual `ALTER TABLE` surprises. |
| **Spring Actuator** | `/actuator/health` and `/actuator/metrics` are required by every cloud platform and load balancer. Add them once, benefit forever. |
| **Springdoc OpenAPI** | Auto-generates `/swagger-ui.html` and `/v3/api-docs` from annotations. Free API documentation that stays in sync. |
| **Bucket4j** | Token-bucket rate limiting per IP and per session. Prevents a single user from hammering the Gemini API. Essential before any public launch. |
| **Gemini 2.0 Flash** | Free tier: 15 RPM / 1M tokens per day. Structured output capability. Swap to paid model with one property change. |

### Frontend — React 18 + TypeScript + Vite

| Technology | Why |
|---|---|
| **React 18 + TypeScript** | Component model gives us reusable `<ChatPanel>`, `<DiagramPanel>`, `<ERNode>`. TypeScript catches API contract mismatches at compile time, not at 2am in prod. |
| **Vite** | 10–50× faster dev server than CRA/Webpack. HMR is instant. Production builds are tree-shaken and split by route. No configuration ceremony. |
| **Tailwind CSS v3** | Utility-first. Zero class naming overhead. The `purge` step means CSS bundle stays tiny even with thousands of utility classes. Design tokens live in `tailwind.config.ts`, not scattered across files. |
| **Framer Motion v11** | Spring-physics animations. This is why Apple's interfaces feel alive — not CSS tweens but physical springs. `layoutId` gives us shared element transitions (diagram card ↔ full view). `AnimatePresence` handles message enter/exit. |
| **React Flow v12 (@xyflow/react)** | Purpose-built for node-edge diagrams. Zoom, pan, minimap, custom nodes, custom edges — all production-grade. Used by Stripe, Datadog, and GitHub Copilot's graph UI. We render the ER diagram here, not with Mermaid SVG. |
| **Dagre layout** | Automatic node placement. Without this, all ER nodes stack at (0,0). Dagre runs a topological sort and places nodes sensibly. Called each time the diagram updates. |
| **TanStack Query v5** | Server state: caching, background refetch, loading/error states, optimistic updates. Prevents us from writing `useEffect` + `useState` + manual error handling 15 times. |
| **Zustand v4** | Minimal global state (current session ID, sidebar open/closed). No Provider wrapper. No boilerplate. 1KB. When we add auth, the user store lives here too. |
| **@react-three/fiber + drei** | Three.js as a React renderer. Used *only* for the animated 3D background: a floating graph of glowing nodes and edges. This is the Apple homepage moment — the visual hook that makes the product feel premium. Lazy-loaded so it doesn't block the main UI. |
| **@react-three/postprocessing** | Bloom effect on the 3D nodes. Gives them the glow of live data. One import, zero hand-written GLSL. |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     React Frontend (port 5173)               │
│                                                              │
│   ┌──────────────────┐       ┌──────────────────────────┐   │
│   │   Chat Panel      │       │     Diagram Panel         │   │
│   │  Framer Motion    │       │      React Flow           │   │
│   │  TanStack Query   │       │      Dagre layout         │   │
│   └────────┬─────────┘       └──────────────────────────┘   │
│            │                                                 │
│   ┌────────▼──────────────────────────────────────────────┐  │
│   │              Three.js Background Scene                 │  │
│   │         (lazy, floating ER node graph, bloom)          │  │
│   └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │  REST (JSON) — /api/**
                           │  Vite proxy in dev
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                Spring Boot Backend (port 8080)               │
│                                                              │
│  ChatController → ChatService → GeminiService                │
│                         ↓                                    │
│               SessionRepository (JPA)                        │
│               MessageRepository (JPA)                        │
│                         ↓                                    │
│            H2 (dev) / PostgreSQL (prod)                      │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  Gemini API    │
                  │  (free tier)   │
                  └────────────────┘
```

---

## Project Structure

```
schema-visualiser/
│
├── PLAN.md                        ← this file
├── README.md
├── docker-compose.yml             ← backend + postgres
├── .env.example
│
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/schemavis/
│       │   ├── SchemaVisualiserApplication.java
│       │   ├── config/
│       │   │   ├── AppConfig.java          (RestTemplate, ObjectMapper beans)
│       │   │   ├── OpenApiConfig.java       (Springdoc metadata)
│       │   │   ├── RateLimitConfig.java     (Bucket4j setup)
│       │   │   └── WebMvcConfig.java        (CORS)
│       │   ├── controller/
│       │   │   ├── SessionController.java   (POST/GET/DELETE /api/sessions)
│       │   │   └── ChatController.java      (POST /api/sessions/{id}/messages)
│       │   ├── service/
│       │   │   ├── ChatService.java         (orchestration)
│       │   │   ├── GeminiService.java       (AI API calls)
│       │   │   └── DiagramParserService.java (Mermaid → structured data)
│       │   ├── domain/
│       │   │   ├── Session.java             (JPA entity)
│       │   │   └── Message.java             (JPA entity)
│       │   ├── repository/
│       │   │   ├── SessionRepository.java
│       │   │   └── MessageRepository.java
│       │   ├── dto/
│       │   │   ├── NewSessionRequest.java
│       │   │   ├── NewSessionResponse.java
│       │   │   ├── SendMessageRequest.java
│       │   │   ├── SendMessageResponse.java
│       │   │   └── SessionDetailResponse.java
│       │   └── exception/
│       │       ├── AppException.java
│       │       └── GlobalExceptionHandler.java
│       └── resources/
│           ├── application.yml
│           ├── application-dev.yml
│           ├── application-prod.yml
│           └── db/migration/
│               └── V1__init.sql
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/
        │   ├── client.ts              (axios instance, interceptors)
        │   ├── sessions.ts            (session API calls)
        │   └── messages.ts            (message API calls)
        ├── store/
        │   └── appStore.ts            (Zustand — session, ui state)
        ├── hooks/
        │   ├── useSession.ts          (TanStack Query wrappers)
        │   ├── useChat.ts
        │   └── useHotkeys.ts
        ├── types/
        │   ├── api.ts                 (DTO types matching backend)
        │   └── diagram.ts             (ERNode, EREdge, Column types)
        ├── lib/
        │   ├── mermaidParser.ts       (Mermaid string → nodes/edges)
        │   └── diagramLayout.ts       (Dagre auto-layout)
        ├── components/
        │   ├── layout/
        │   │   ├── AppShell.tsx
        │   │   ├── Header.tsx
        │   │   └── SplitPane.tsx
        │   ├── chat/
        │   │   ├── ChatPanel.tsx
        │   │   ├── MessageList.tsx
        │   │   ├── MessageBubble.tsx
        │   │   ├── TypingIndicator.tsx
        │   │   ├── DdlInput.tsx
        │   │   ├── ChatInput.tsx
        │   │   └── SchemaBadge.tsx
        │   ├── diagram/
        │   │   ├── DiagramPanel.tsx
        │   │   ├── ERNode.tsx          (React Flow custom node)
        │   │   ├── EREdge.tsx          (React Flow custom edge)
        │   │   ├── DiagramToolbar.tsx
        │   │   └── EmptyDiagram.tsx
        │   └── three/
        │       ├── BackgroundScene.tsx  (R3F Canvas, lazy)
        │       ├── FloatingGraph.tsx    (animated nodes + edges)
        │       └── GlowNode.tsx         (single glowing node mesh)
        └── styles/
            └── globals.css            (Tailwind base + custom vars)
```

---

## API Contract

All endpoints return `application/json`. All error responses use `{ "error": "string", "code": "string" }`.

### Sessions

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/sessions` | Create session, optionally seed with DDL |
| `GET` | `/api/sessions/{id}` | Get full session (messages + diagram) |
| `DELETE` | `/api/sessions/{id}` | Delete session |

**POST /api/sessions**
```json
// Request
{ "ddl": "CREATE TABLE users (...)" }

// Response 201
{
  "sessionId": "uuid",
  "message": "I can see 3 tables...",
  "diagram": "erDiagram\n    USERS {...}",
  "complete": false
}
```

### Messages

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/sessions/{id}/messages` | Send message, get AI reply |

**POST /api/sessions/{id}/messages**
```json
// Request
{ "content": "The users table has a one-to-many with orders" }

// Response 200
{
  "messageId": "uuid",
  "content": "Got it! How about the orders → line_items relationship?",
  "diagram": "erDiagram\n    USERS ||--o{ ORDERS : ...",
  "complete": false
}
```

### System

| Method | Path | Description |
|---|---|---|
| `GET` | `/actuator/health` | Health check |
| `GET` | `/v3/api-docs` | OpenAPI spec |
| `GET` | `/swagger-ui.html` | Swagger UI |

---

## Implementation Phases

### ✅ Phase 0 — Wipe & Scaffold
- [ ] Delete old prototype files
- [ ] Create `backend/` and `frontend/` directories
- [ ] Initialise Vite + React + TypeScript in `frontend/`
- [ ] New `pom.xml` with all production dependencies

### 🔲 Phase 1 — Backend: Data Layer
- [ ] JPA entities: `Session`, `Message`
- [ ] Flyway migration `V1__init.sql`
- [ ] `SessionRepository`, `MessageRepository`
- [ ] `application.yml`, `application-dev.yml`, `application-prod.yml`

### 🔲 Phase 2 — Backend: Service & AI Layer
- [ ] `GeminiService` — Gemini 2.0 Flash REST integration
- [ ] `DiagramParserService` — extract `[DIAGRAM]` blocks
- [ ] `ChatService` — orchestrate session + AI + diagram
- [ ] Rate limiting with Bucket4j

### 🔲 Phase 3 — Backend: API Layer
- [ ] `SessionController` — POST/GET/DELETE
- [ ] `ChatController` — POST messages
- [ ] `GlobalExceptionHandler` — consistent error shape
- [ ] `OpenApiConfig` — Swagger metadata
- [ ] CORS config for `localhost:5173`

### 🔲 Phase 4 — Frontend: Foundation
- [ ] Vite config with `/api` proxy
- [ ] Tailwind config + design tokens (CSS vars)
- [ ] Zustand store (session ID, loading, sidebar)
- [ ] Axios client with interceptors
- [ ] TanStack Query provider + hooks

### 🔲 Phase 5 — Frontend: Chat UI
- [ ] `AppShell` + `Header` + `SplitPane`
- [ ] `DdlInput` with collapsible Framer Motion panel
- [ ] `MessageList` + `MessageBubble` with Framer Motion enter/exit
- [ ] `TypingIndicator` (animated dots)
- [ ] `ChatInput` with auto-resize + hotkeys
- [ ] `SchemaBadge` (complete state)

### 🔲 Phase 6 — Frontend: ER Diagram
- [ ] `mermaidParser.ts` — parse Mermaid string → `{nodes, edges}`
- [ ] `diagramLayout.ts` — Dagre auto-placement
- [ ] `ERNode` custom React Flow node (table card with columns)
- [ ] `EREdge` custom React Flow edge (cardinality labels)
- [ ] `DiagramPanel` with zoom/pan/minimap
- [ ] Animated diagram update (nodes fade-in on change)

### 🔲 Phase 7 — Frontend: 3D Background
- [ ] `BackgroundScene` — R3F Canvas, full-screen, pointer-events none
- [ ] `FloatingGraph` — 15–20 glowing node meshes, slow drift
- [ ] Bloom post-processing (UnrealBloomPass)
- [ ] Lazy-load so it doesn't block chat interactions
- [ ] Respects `prefers-reduced-motion`

### 🔲 Phase 8 — Production Hardening
- [ ] `Dockerfile` for backend (multi-stage: build + JRE)
- [ ] `Dockerfile` for frontend (Vite build + nginx)
- [ ] `docker-compose.yml` (backend + postgres + frontend)
- [ ] `.env.example`
- [ ] `README.md` with setup instructions

---

## SaaS Future Considerations

These are NOT implemented now but the architecture supports them without rewrites:

- **Auth**: `User` entity → `Session.userId` FK. Spring Security + JWT on backend. Protected routes on frontend.
- **Teams/Orgs**: `Organisation` entity → `Session.orgId`. Multi-tenancy by FK, not by schema.
- **Billing**: Sessions table already has `createdAt`. Usage = `COUNT(messages) WHERE session.userId = ?`.
- **Redis cache**: `spring.cache.type=redis` replaces in-memory JPA query caching.
- **Webhook exports**: `DiagramParserService` already returns structured data. POST it anywhere.
- **AI model swap**: `gemini.model` property. One-line change to switch to GPT-4o, Claude, etc.
