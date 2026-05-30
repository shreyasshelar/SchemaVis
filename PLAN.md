# SchemaVis — Architecture & Design Reference

> Current state of the system. Read this before making architectural changes.

---

## What It Is

An AI-powered database schema designer. Users chat in plain English (or paste DDL), the AI asks clarifying questions, and a live interactive ER diagram builds in real time. Full SaaS: auth, persistent sessions, project history, production k8s deployment.

---

## Stack Decisions

### Backend — Java 21 + Spring Boot 3.2

| Technology | Why |
|---|---|
| **Java 21** | Virtual threads (Project Loom) — hundreds of concurrent AI calls without thread-pool tuning |
| **Spring Boot 3.2** | Industry standard, Actuator health probes for k8s, Flyway auto-migration, strong ecosystem |
| **Spring Security + JWT** | Stateless, HMAC-SHA256, 30-day tokens. BCrypt for passwords. No session state. |
| **PostgreSQL 16** | Users, sessions, messages persist across restarts. JPA with Flyway migrations. |
| **Flyway** | V1__init.sql (sessions/messages), V2__auth.sql (users). Same DDL in dev and prod. |
| **Bucket4j** | Token-bucket rate limiting per IP. Currently in-process HashMap; swap to Redis for multi-replica. |
| **Springdoc OpenAPI** | Auto-generated Swagger UI at `/swagger-ui.html`. Zero maintenance. |

### AI Layer — Fallback Chain

```
Request → FallbackAiService
            ├─ @Order(1) GeminiService       → Gemini 2.5 Flash (REST, different payload format)
            ├─ @Order(2) GroqProvider         → Groq Llama 3.3-70b (OpenAI-compatible)
            └─ @Order(3) OpenRouterProvider   → OpenRouter Llama free (OpenAI-compatible)
```

- `AiProvider` interface: `getName()` + `generateReply(List<Message>)`
- `OpenAiCompatProvider`: abstract base for Groq + OpenRouter (same `/chat/completions` format)
- `SystemPrompt.TEXT`: single source of truth for the schema design system prompt
- `FallbackAiService`: iterates `List<AiProvider>` (Spring auto-collects by `@Order`), catches any `RuntimeException`, tries next. Throws `AppException.aiUnavailable()` only if all fail.
- All API keys injected from env vars / k8s secrets. Empty string defaults mean provider is skipped gracefully if key missing.

### Frontend — React 19 + TypeScript + Vite 8

| Technology | Why |
|---|---|
| **React 19 + TypeScript** | Component model, compile-time API contract validation |
| **Vite 8** | Sub-second HMR, tree-shaken production builds, proxy for dev |
| **Tailwind CSS v3** | Design tokens in `tailwind.config.ts`. Consistent dark theme. |
| **Framer Motion v12** | Spring-physics animations. `whileInView` for scroll-triggered reveals. |
| **React Flow v12** | ER diagram canvas — zoom, pan, minimap, custom ERNode/EREdge |
| **Dagre** | Auto-layout for ER nodes on every diagram update |
| **TanStack Query v5** | Server state caching. `useSessionDetail` rehydrates on project switch. |
| **Zustand v5** | `authStore` (localStorage), `appStore` (sessionStorage). No Provider boilerplate. |
| **Three.js (R3F)** | Lazy-loaded 3D ambient background with Bloom. Zero blocking impact. |

### CORS

Two-part fix required by Spring Security + Spring MVC:
1. `WebMvcConfig.corsConfigurationSource()` — `@Bean` with allowed origins including `https://schemavis.shreyasshelar.uk`
2. `SecurityConfig`: `.cors(Customizer.withDefaults())` — delegates Spring Security's CORS filter to the bean above, also auto-permits OPTIONS preflight before auth checks

### Infrastructure

```
GCP e2-medium VM (asia-south1)
└── k3s
    ├── namespace: argocd
    │   ├── ArgoCD             (GitOps controller, UI at argocd.shreyasshelar.uk)
    │   └── ArgoCD Image Updater (polls ghcr.io, commits sha-* tags to git)
    └── namespace: schema-vis
        ├── schema-vis-frontend    (nginx + React SPA, HPA 1–3)
        ├── schema-vis-backend     (Spring Boot, HPA 1–5)
        ├── schema-vis-postgres    (PostgreSQL 16, single pod, 5 GiB PVC)
        └── schema-vis-cloudflared (×2 pods, outbound tunnel to Cloudflare)
```

Key decisions:
- **Cloudflare Tunnel**: outbound-only, no open ports on VM, free TLS, DDoS protection
- **`createSecrets: false`**: Helm never creates/touches k8s Secrets. Pre-created manually with `kubectl create secret`. This prevents ArgoCD from ever seeing secret values.
- **`helm.sh/resource-policy: keep`** on PostgreSQL PVC: survive Helm upgrades without data loss
- **HPA**: `autoscaling/v2` with scale-up stabilization 30s and scale-down 300s (backend) / 180s (frontend)
- **Private ghcr.io**: `imagePullSecrets: [ghcr-credentials]` in both `schema-vis` and `argocd` namespaces

### GitOps Deploy Flow

```
git push main
  → ci.yml:     Maven build + test + tsc --noEmit + npm run build
  → deploy.yml: Docker multi-stage build (backend + frontend)
                Push sha-XXXXXXX + latest → ghcr.io (private)
  → Image Updater: polls every 2 min, sees sha-* tag
                   commits "chore: update backend to sha-abc1234" to main
  → ArgoCD:     detects commit, diffs cluster, rolling update
  → k3s:        RollingUpdate — readiness probe must pass before traffic shifts
  Total: ~4–6 min first deploy, ~2–3 min warm cache
  Rollback: revert Image Updater commit → ArgoCD self-heals in <30s
```

---

## Current File Map

```
schema_visualiser/
├── .github/workflows/
│   ├── ci.yml                    triggers: push to main only
│   └── deploy.yml                build + push to ghcr.io (no SSH, no kubectl)
├── backend/src/main/java/com/schemavis/
│   ├── controller/
│   │   ├── AuthController.java   POST /api/auth/register, /login
│   │   ├── SessionController.java POST/GET/DELETE /api/sessions
│   │   └── ChatController.java   POST /api/sessions/{id}/messages
│   ├── service/
│   │   ├── ai/
│   │   │   ├── AiProvider.java           interface
│   │   │   ├── SystemPrompt.java         single source of truth for prompt
│   │   │   ├── GeminiService.java        @Order(1), different REST format
│   │   │   ├── OpenAiCompatProvider.java abstract base (Groq + OpenRouter)
│   │   │   ├── GroqProvider.java         @Order(2)
│   │   │   ├── OpenRouterProvider.java   @Order(3)
│   │   │   └── FallbackAiService.java    iterates providers, catches errors
│   │   ├── ChatService.java              injects FallbackAiService
│   │   └── AuthService.java
│   ├── domain/      User, Session, Message
│   ├── security/    SecurityConfig (.cors + .csrf.disable + JWT filter)
│   │                JwtAuthFilter, JwtTokenProvider
│   └── config/      WebMvcConfig (CORS bean + addCorsMappings)
│                    AppConfig (RestTemplate, ObjectMapper beans)
├── backend/src/main/resources/
│   ├── application.yml      ai.gemini/groq/openrouter keys + models
│   └── db/migration/        V1__init.sql, V2__auth.sql
├── frontend/src/
│   ├── pages/DocsPage.tsx         public /docs route (no auth)
│   ├── App.tsx                    routes: /login, /register, /docs, / (protected)
│   ├── components/layout/Header.tsx  Docs link added
│   ├── hooks/useSession.ts        useSessionDetail — restoredForRef prevents double-restore
│   └── public/docs/               static HTML artifacts at /docs/*.html
├── helm/schema-vis/
│   ├── values.yaml                createSecrets:false, HPA, image repos, cloudflared.hostname
│   └── templates/
│       ├── backend-deployment.yaml   envFrom: schema-vis-backend-secret
│       ├── backend-hpa.yaml          autoscaling/v2, CPU+memory metrics
│       ├── backend-secret.yaml       {{- if .Values.createSecrets }}
│       ├── frontend-deployment.yaml  imagePullSecrets from values
│       ├── frontend-hpa.yaml
│       ├── postgres-secret.yaml      {{- if .Values.createSecrets }}
│       ├── cloudflared-deployment.yaml  reads TUNNEL_TOKEN from secret
│       └── cloudflared-secret.yaml   {{- if .Values.cloudflared.enabled }}
└── k8s/argocd-app.yaml            ArgoCD Application + Image Updater annotations
```

---

## Resolved Issues

| Issue | Root cause | Fix |
|---|---|---|
| CORS 403 on live app | `WebMvcConfig` only allowed localhost origins; no `.cors()` in SecurityConfig | Added `https://schemavis.shreyasshelar.uk` + `CorsConfigurationSource` bean + `.cors(Customizer.withDefaults())` |
| Project switch blank state | `useSessionDetail` hook existed but was never called anywhere | Called it in `ChatPanel.tsx` before early returns; `restoredForRef` prevents double-restore |
| CI failure (`EBADPLATFORM`) | `@rolldown/binding-darwin-arm64` added as hard dependency | Removed from `package.json` (now optional transitive dep) |
| TypeScript error `TS6133` | Unused `Spinner` import in `Header.tsx` | Removed import |
| k8s liveness probe 404 | Spring Security was blocking `/actuator/health/**` | Added `permitAll()` for `/actuator/health/**` |

---

## What Is NOT Done (Future Work)

- **Teams / orgs**: `Organisation` entity → `Session.orgId`. Multi-tenancy by FK.
- **Billing**: Sessions already have `createdAt`. Usage = `COUNT(messages) WHERE userId = ?`.
- **Redis cache**: `spring.cache.type=redis` → multi-instance rate limiting support.
- **AI streaming**: Server-Sent Events for token-by-token diagram updates.
- **Diagram export**: PNG/SVG export from React Flow canvas.
- **OAuth / SSO**: Social login (Google, GitHub) via Spring Security OAuth2.
