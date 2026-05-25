# SchemaVis — developer commands
# Run `make help` to see all targets.

.PHONY: help dev-db dev-backend dev-frontend dev stop clean build test

BACKEND_DIR  := backend
FRONTEND_DIR := frontend

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Local development ────────────────────────────────────────────
dev-db: ## Start local PostgreSQL via Docker
	docker compose -f docker-compose.dev.yml up -d
	@echo "PostgreSQL ready on localhost:5432 (db=schemavis user=schemavis pass=schemavis)"

dev-backend: ## Run Spring Boot backend (requires dev-db)
	cd $(BACKEND_DIR) && \
	  SPRING_PROFILES_ACTIVE=dev \
	  GEMINI_API_KEY=$${GEMINI_API_KEY} \
	  mvn spring-boot:run

dev-frontend: ## Run Vite dev server
	cd $(FRONTEND_DIR) && npm run dev

dev: dev-db ## Start everything for local development (opens 3 panes in tmux)
	@command -v tmux >/dev/null 2>&1 || (echo "Install tmux or run dev-backend + dev-frontend manually"; exit 1)
	tmux new-session -d -s schemavis -n backend \
	  "$(MAKE) dev-backend; read" \; \
	  split-window -h "$(MAKE) dev-frontend; read" \; \
	  attach

# ── Testing ──────────────────────────────────────────────────────
test-backend: ## Run backend unit tests
	cd $(BACKEND_DIR) && mvn -B test

test-frontend: ## Type-check + build frontend
	cd $(FRONTEND_DIR) && npx tsc -p tsconfig.app.json --noEmit && npm run build

test: test-backend test-frontend ## Run all tests

# ── Production build ─────────────────────────────────────────────
build: ## Build production Docker images
	docker compose build

up: ## Start full production stack
	docker compose up --build -d

stop: ## Stop all Docker services
	docker compose down
	docker compose -f docker-compose.dev.yml down

# ── Cleanup ──────────────────────────────────────────────────────
clean: ## Remove build artefacts
	cd $(BACKEND_DIR) && mvn clean
	rm -rf $(FRONTEND_DIR)/dist $(FRONTEND_DIR)/.vite
