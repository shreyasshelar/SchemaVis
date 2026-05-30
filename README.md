# SchemaVis — AI-powered ER Diagram Builder

> Chat with AI to design your database schema. Describe your domain in plain English (or paste DDL) and watch a live entity-relationship diagram build itself in real time.

[![CI](https://img.shields.io/github/actions/workflow/status/shreyasshelar/SchemaVis/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/shreyasshelar/SchemaVis/actions/workflows/ci.yml)
[![Java](https://img.shields.io/badge/Java-21-007396?style=flat-square&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![k3s](https://img.shields.io/badge/k3s-GitOps-FFC61C?style=flat-square&logo=kubernetes)](https://k3s.io/)

**Live:** [schemavis.shreyasshelar.uk](https://schemavis.shreyasshelar.uk) · **Docs:** [/docs](https://schemavis.shreyasshelar.uk/docs)

---

## How it works

1. **Register / sign in** — JWT auth, BCrypt passwords, 30-day tokens.
2. **Start a conversation** — describe your domain, paste DDL, or pick a suggestion.
3. **Chat iteratively** — the AI asks clarifying questions about tables, columns, and relationships.
4. **Watch the diagram appear** — every AI response updates the React Flow ER diagram live.
5. **Schema complete** — the AI marks it done, the diagram locks. Switch projects in the sidebar to restore any previous session.

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Backend | Java 21 + Spring Boot 3.2 | Virtual threads, Actuator health probes, mature ecosystem |
| Auth | Spring Security + JWT (HMAC-SHA256) | Stateless, 30-day tokens, BCrypt password hashing |
| AI — primary | Gemini 2.5 Flash (REST) | Fast, free tier (15 RPM / 1M tokens/day) |
| AI — fallback 1 | Groq — Llama 3.3-70b | Ultra-fast inference, OpenAI-compatible API |
| AI — fallback 2 | OpenRouter — Llama free | Last resort; free tier, OpenAI-compatible |
| AI resilience | `FallbackAiService` + `@Order` | Auto-retries next provider on any error, transparent to callers |
| Database | PostgreSQL 16 | Persistent users, sessions, messages |
| Migrations | Flyway | Versioned, auditable, same SQL in dev and prod |
| Rate limiting | Bucket4j | Token-bucket per IP, Redis-upgradeable |
| Frontend | React 19 + TypeScript + Vite 8 | Type safety, instant HMR, optimised bundles |
| Styling | Tailwind CSS v3 | Utility-first, single design-token source of truth |
| Animation | Framer Motion v12 | Spring-physics animations |
| Diagram | @xyflow/react v12 + Dagre | Interactive canvas with automatic layout |
| 3D background | @react-three/fiber + Bloom | Ambient depth, lazy-loaded |
| State | Zustand v5 | Auth in localStorage, session in sessionStorage |
| Data fetching | TanStack Query v5 | Caching, optimistic updates, background refetch |
| Kubernetes | k3s | Lightweight K8s on GCP e2-medium (asia-south1) |
| GitOps | ArgoCD + Image Updater | Auto-syncs cluster from git, commits image tags for audit trail |
| Packaging | Helm 3 | Parametrised Kubernetes manifests, HPA, secrets management |
| Ingress | Cloudflare Zero Trust Tunnel | No open inbound ports, free TLS, DDoS protection |
| CI | GitHub Actions | Build, type-check, test on every push to main |
| Registry | ghcr.io (private) | Docker images tagged `sha-XXXXXXX` + `latest` |

---

## Quick start (local dev)

### Prerequisites

- **Java 21+** and **Maven 3.9+**
- **Node.js 22+**
- **Docker** (for local PostgreSQL)
- A [Gemini API key](https://aistudio.google.com) (free)
- Optional: [Groq API key](https://console.groq.com), [OpenRouter API key](https://openrouter.ai/keys) for fallback testing

### 1 — Start the database

```bash
docker compose -f docker-compose.dev.yml up -d
# PostgreSQL on localhost:5433
```

### 2 — Run the backend

```bash
cd backend
export GEMINI_API_KEY=your_key_here
# Optional fallback keys:
# export GROQ_API_KEY=gsk_...
# export OPENROUTER_API_KEY=sk-or-...
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home mvn spring-boot:run
# API at http://localhost:8080
# Swagger UI at http://localhost:8080/swagger-ui.html
```

### 3 — Run the frontend

```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5173
```

The Vite dev server proxies `/api/*` → `http://localhost:8080` automatically.

### Or use `make`

```bash
make dev-db        # start PostgreSQL
make dev-backend   # run Spring Boot (Java 21)
make dev-frontend  # run Vite
```

---

## Project structure

```
schema_visualiser/
├── .github/workflows/
│   ├── ci.yml              # CI: Maven build + test + TypeScript check (main branch only)
│   └── deploy.yml          # Build + push Docker images to ghcr.io
├── backend/
│   └── src/main/java/com/schemavis/
│       ├── controller/     # AuthController, SessionController, ChatController
│       ├── service/
│       │   ├── ai/         # AiProvider interface, GeminiService, GroqProvider,
│       │   │               # OpenRouterProvider, OpenAiCompatProvider, FallbackAiService,
│       │   │               # SystemPrompt
│       │   ├── ChatService.java
│       │   └── AuthService.java
│       ├── domain/         # User, Session, Message JPA entities
│       ├── dto/            # Request/response records
│       ├── repository/     # Spring Data JPA repos
│       ├── config/         # CORS (WebMvcConfig + CorsConfigurationSource), AppConfig
│       ├── security/       # SecurityConfig, JwtAuthFilter, JwtTokenProvider
│       └── exception/      # GlobalExceptionHandler, AppException
│   └── src/main/resources/
│       ├── db/migration/   # V1__init.sql (schema), V2__auth.sql (users table)
│       └── application.yml # ai.gemini/groq/openrouter config, JWT, rate-limit
├── frontend/src/
│   ├── pages/              # DocsPage.tsx (public /docs route)
│   ├── components/
│   │   ├── auth/           # LoginPage, RegisterPage
│   │   ├── chat/           # WelcomeScreen, MessageBubble, ChatInput, DdlInput
│   │   ├── diagram/        # DiagramPanel, ERNode, EREdge (React Flow)
│   │   ├── layout/         # Header (with Docs link), SplitPane, ProtectedRoute
│   │   ├── projects/       # ProjectsSidebar
│   │   └── three/          # BackgroundScene, FloatingGraph (R3F + Bloom)
│   ├── hooks/              # useAuth, useSession (useSessionDetail), useChat, useProjects
│   ├── store/              # authStore (localStorage), appStore (sessionStorage)
│   └── public/docs/        # Static HTML artifacts served at /docs/*.html
├── helm/schema-vis/        # Helm chart
│   ├── values.yaml         # createSecrets:false, HPA config, image repos
│   └── templates/          # Deployments, Services, HPAs, Secrets (guarded), PVC, cloudflared
├── k8s/
│   └── argocd-app.yaml     # ArgoCD Application + Image Updater annotations
├── docs/                   # Standalone HTML artifacts (mirrored to frontend/public/docs/)
└── docker-compose.dev.yml  # Dev: PostgreSQL only
```

---

## API reference

Full interactive docs at `/swagger-ui.html` when the backend is running, or at [/docs/api-reference.html](/docs/api-reference.html) in production.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Create account |
| `POST` | `/api/auth/login` | — | Sign in, get JWT |
| `POST` | `/api/sessions` | JWT | Start new schema session (optional DDL seed) |
| `GET` | `/api/sessions` | JWT | List all user sessions |
| `GET` | `/api/sessions/{id}` | JWT | Full session — messages + diagram |
| `DELETE` | `/api/sessions/{id}` | JWT | Delete session |
| `POST` | `/api/sessions/{id}/messages` | JWT | Send chat message, get AI reply + diagram |
| `GET` | `/actuator/health/**` | — | k8s liveness + readiness probes |

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes (primary AI) | From [aistudio.google.com](https://aistudio.google.com) |
| `GROQ_API_KEY` | Optional (fallback 1) | From [console.groq.com](https://console.groq.com) |
| `OPENROUTER_API_KEY` | Optional (fallback 2) | From [openrouter.ai/keys](https://openrouter.ai/keys) |
| `SPRING_DATASOURCE_PASSWORD` | Prod | PostgreSQL password |
| `JWT_SECRET` | Prod | 64+ char random string for HMAC-SHA256 signing |
| `RATE_LIMIT` | No (default: 20) | Max AI requests per IP per minute |

In production all variables are injected from k8s Secrets pre-created manually — never stored in git.

---

## Production deployment

The full deployment uses GitOps with ArgoCD:

```
git push main
  → GitHub Actions: CI + build Docker images → push to ghcr.io (sha-XXXXXXX)
  → ArgoCD Image Updater: detects new tag → commits updated values.yaml to git
  → ArgoCD: detects git commit → diffs cluster → rolling update (zero downtime)
  → Cloudflare Tunnel: routes traffic to new pods (tunnel never restarts)
Total: ~4–6 min first deploy, ~2–3 min warm cache
```

See the [interactive deployment flow](/docs/deployment-flow.html) and [architecture diagram](/docs/architecture.html) for details.

### Key infrastructure choices

- **No open inbound ports** — Cloudflare Zero Trust Tunnel is outbound-only from the VM
- **Secrets never in git** — `createSecrets: false` in Helm; secrets pre-created with `kubectl create secret`
- **HPA** — backend 1–5 replicas (CPU 70% + memory 80%), frontend 1–3 replicas (CPU 70%)
- **PVC preserved** — `helm.sh/resource-policy: keep` on PostgreSQL PVC prevents data loss on Helm upgrades
- **CORS** — `CorsConfigurationSource` bean + `.cors(Customizer.withDefaults())` in Spring Security handles both preflight OPTIONS and production origin `https://schemavis.shreyasshelar.uk`

---

## Interactive documentation

All docs are served at `/docs/` (static HTML, no login required):

| Doc | URL | What it covers |
|---|---|---|
| Landing page | `/docs/index.html` | Overview, quick start |
| Architecture | `/docs/architecture.html` | Interactive SVG with hover tooltips |
| Deployment flow | `/docs/deployment-flow.html` | Animated GitOps pipeline |
| API reference | `/docs/api-reference.html` | All endpoints with request/response |
| Setup guide | `/docs/setup-guide.html` | Interactive checklist, 6 phases |

In-app docs page (no login): [schemavis.shreyasshelar.uk/docs](https://schemavis.shreyasshelar.uk/docs)
