# Kyntrix Build & Deployment Makefile

.PHONY: help dev prod build clean migrate logs shell

# Default target
help:
	@echo "Kyntrix Build Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-build    - Rebuild and start development"
	@echo "  make dev-down     - Stop development environment"
	@echo "  make logs         - Tail all container logs"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Rebuild and start production"
	@echo "  make prod-down    - Stop production environment"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run database migrations"
	@echo "  make migrate-prod - Run production migrations"
	@echo "  make db-reset     - Reset development database"
	@echo ""
	@echo "Build:"
	@echo "  make build-agents - Build agents Docker image"
	@echo "  make build-web    - Build web Docker image"
	@echo "  make build-daemon - Build C++ runtime daemon"
	@echo "  make build-all    - Build all images"
	@echo ""
	@echo "Utilities:"
	@echo "  make shell-agents - Shell into agents container"
	@echo "  make shell-db     - Connect to PostgreSQL"
	@echo "  make clean        - Remove all containers and volumes"

# Development
dev:
	cd infra/compose && docker compose -f docker-compose.dev.yml up -d

dev-build:
	cd infra/compose && docker compose -f docker-compose.dev.yml up -d --build

dev-down:
	cd infra/compose && docker compose -f docker-compose.dev.yml down

logs:
	cd infra/compose && docker compose -f docker-compose.dev.yml logs -f

# Production
prod:
	cd infra/compose && docker compose -f docker-compose.prod.yml up -d

prod-build:
	cd infra/compose && docker compose -f docker-compose.prod.yml up -d --build

prod-down:
	cd infra/compose && docker compose -f docker-compose.prod.yml down

# Database migrations
migrate:
	cd database && npx prisma migrate dev

migrate-prod:
	cd database && npx prisma migrate deploy

db-reset:
	cd database && npx prisma migrate reset --force

db-generate:
	cd database && npx prisma generate

# Individual builds
build-agents:
	docker build -f servers/agents/Dockerfile -t kyntrix/agents:latest .

build-web:
	docker build -f main/Dockerfile -t kyntrix/web:latest main/

build-daemon:
	mkdir -p build && cd build && cmake .. && make -j$$(nproc)

build-all: build-agents build-web

# Utilities
shell-agents:
	cd infra/compose && docker compose -f docker-compose.dev.yml exec agents sh

shell-db:
	cd infra/compose && docker compose -f docker-compose.dev.yml exec postgres psql -U kyntrix -d kyntrix

clean:
	cd infra/compose && docker compose -f docker-compose.dev.yml down -v --remove-orphans
	cd infra/compose && docker compose -f docker-compose.prod.yml down -v --remove-orphans 2>/dev/null || true
	docker system prune -f

# Install dependencies locally
install:
	npm install
	cd servers/agents && npm install
	cd main && npm install
	cd packages/cli && npm install
	cd database && npm install

# Run agents server locally (for development without Docker)
run-agents:
	cd servers/agents && npm run dev

# Run web locally
run-web:
	cd main && npm run dev
