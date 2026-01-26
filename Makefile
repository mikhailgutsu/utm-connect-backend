.PHONY: help install dev build docker-up docker-down docker-logs docker-db-shell prisma-migrate prisma-push prisma-seed lint format clean

# 📝 Variables
DOCKER_COMPOSE := docker-compose
NODE := npm
DB_HOST := localhost
DB_PORT := 5432
DB_USER := postgres
DB_NAME := utm_connect

# 🎯 Default target
help:
	@echo "🚀 UTM Connect Backend - Available Commands"
	@echo ""
	@echo "📦 Setup:"
	@echo "  make install           Install dependencies"
	@echo "  make env              Copy .env.example to .env"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  make docker-up        Start Docker containers (PostgreSQL + PgAdmin)"
	@echo "  make docker-down      Stop Docker containers"
	@echo "  make docker-restart   Restart Docker containers"
	@echo "  make docker-logs      View Docker logs"
	@echo "  make docker-clean     Remove containers and volumes (WARNING: loses data)"
	@echo ""
	@echo "💾 Database:"
	@echo "  make db-migrate       Create and apply migrations"
	@echo "  make db-push          Push schema to database"
	@echo "  make db-seed          Seed database with test data"
	@echo "  make db-shell         Open PostgreSQL shell"
	@echo "  make db-reset         Reset database (WARNING: deletes all data)"
	@echo ""
	@echo "💻 Development:"
	@echo "  make dev              Start development server"
	@echo "  make build            Build production bundle"
	@echo "  make start            Start production server"
	@echo ""
	@echo "🧹 Code Quality:"
	@echo "  make lint             Run ESLint"
	@echo "  make format           Format code with Prettier"
	@echo "  make clean            Clean build artifacts"
	@echo ""
	@echo "🔄 Full Setup (for new developers):"
	@echo "  make setup            Install deps + Docker + migrate + seed"
	@echo ""

# ============================================
# 📦 SETUP TARGETS
# ============================================

install:
	@echo "📦 Installing dependencies..."
	$(NODE) install
	@echo "✅ Dependencies installed"

env:
	@echo "📝 Creating .env file..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ .env file created"; \
	else \
		echo "⚠️  .env file already exists"; \
	fi

setup: install env docker-up db-migrate db-seed
	@echo ""
	@echo "🎉 Setup complete!"
	@echo ""
	@echo "📍 Services available:"
	@echo "   PostgreSQL: $(DB_HOST):$(DB_PORT)"
	@echo "   PgAdmin:    http://localhost:5050 (admin@example.com / admin)"
	@echo "   API:        http://localhost:3000"
	@echo ""
	@echo "Next: npm run dev"
	@echo ""

# ============================================
# 🐳 DOCKER TARGETS
# ============================================

docker-up:
	@echo "🐳 Starting Docker containers..."
	$(DOCKER_COMPOSE) up -d
	@echo "⏳ Waiting for PostgreSQL to be ready..."
	@sleep 5
	@echo "✅ Docker containers started"
	@echo ""
	@echo "📍 Services available:"
	@echo "   PostgreSQL: $(DB_HOST):$(DB_PORT)"
	@echo "   PgAdmin:    http://localhost:5050"
	@echo ""

docker-down:
	@echo "🛑 Stopping Docker containers..."
	$(DOCKER_COMPOSE) down
	@echo "✅ Docker containers stopped"

docker-restart: docker-down docker-up
	@echo "🔄 Docker containers restarted"

docker-logs:
	@echo "📋 Docker logs (press Ctrl+C to exit):"
	$(DOCKER_COMPOSE) logs -f

docker-logs-db:
	@echo "📋 PostgreSQL logs:"
	$(DOCKER_COMPOSE) logs -f postgres

docker-logs-pgadmin:
	@echo "📋 PgAdmin logs:"
	$(DOCKER_COMPOSE) logs -f pgadmin

docker-ps:
	@echo "🐳 Running containers:"
	$(DOCKER_COMPOSE) ps

docker-clean:
	@echo "⚠️  WARNING: This will delete all data!"
	@echo "Are you sure? Press Ctrl+C to cancel or wait 5 seconds..."
	@sleep 5
	$(DOCKER_COMPOSE) down -v
	@echo "✅ Docker cleaned"

# ============================================
# 💾 DATABASE TARGETS
# ============================================

db-migrate:
	@echo "🔄 Running Prisma migrations..."
	@echo "Enter migration name (or press Enter to auto-generate):"
	$(NODE) run prisma:migrate
	@echo "✅ Migrations applied"

db-push:
	@echo "🔄 Pushing schema to database..."
	$(NODE) run prisma:push
	@echo "✅ Schema pushed"

db-generate:
	@echo "📝 Generating Prisma Client..."
	$(NODE) run prisma:generate
	@echo "✅ Prisma Client generated"

db-seed:
	@echo "🌱 Seeding database with test data..."
	$(NODE) run seed
	@echo "✅ Database seeded"

db-shell:
	@echo "🐘 Opening PostgreSQL shell..."
	@echo "Commands: \\dt (tables), \\d \"TableName\" (schema), SELECT * FROM \"User\"; (query), \\q (exit)"
	@echo ""
	$(DOCKER_COMPOSE) exec postgres psql -U $(DB_USER) -d $(DB_NAME)

db-backup:
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	$(DOCKER_COMPOSE) exec -T postgres pg_dump -U $(DB_USER) $(DB_NAME) > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created: backups/backup_$$(date +%Y%m%d_%H%M%S).sql"

db-reset:
	@echo "⚠️  WARNING: This will DELETE all data!"
	@echo "Are you sure? Press Ctrl+C to cancel or wait 5 seconds..."
	@sleep 5
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) up -d
	@sleep 5
	$(NODE) run prisma:migrate -- --skip-generate
	$(NODE) run seed
	@echo "✅ Database reset and seeded"

# ============================================
# 💻 DEVELOPMENT TARGETS
# ============================================

dev:
	@echo "🚀 Starting development server..."
	@echo "📍 Server: http://localhost:3000"
	@echo "📍 Health: http://localhost:3000/health"
	$(NODE) run dev

build:
	@echo "🔨 Building production bundle..."
	$(NODE) run build
	@echo "✅ Build complete: dist/"

start:
	@echo "🚀 Starting production server..."
	$(NODE) start

watch:
	@echo "👀 Watching for changes..."
	$(NODE) run dev

# ============================================
# 🧹 CODE QUALITY TARGETS
# ============================================

lint:
	@echo "🔍 Running ESLint..."
	$(NODE) run lint

lint-fix:
	@echo "🔧 Fixing ESLint issues..."
	$(NODE) run lint -- --fix

format:
	@echo "✨ Formatting code..."
	$(NODE) run format

format-check:
	@echo "✨ Checking code format..."
	npx prettier --check "src/**/*.ts"

# ============================================
# 🧹 CLEAN TARGETS
# ============================================

clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf dist
	@rm -rf node_modules
	@rm -rf .next
	@echo "✅ Cleaned"

clean-dist:
	@echo "🧹 Cleaning dist folder..."
	@rm -rf dist
	@echo "✅ dist/ removed"

# ============================================
# 📋 UTILITY TARGETS
# ============================================

info:
	@echo "🔍 Project Information"
	@echo ""
	@echo "Node version:"
	@node --version
	@echo "npm version:"
	@npm --version
	@echo "Docker version:"
	@docker --version
	@echo "Docker Compose version:"
	@docker-compose --version
	@echo ""
	@echo "📦 Project name: UTM Connect Backend"
	@echo "🗂️  Database: PostgreSQL"
	@echo "🚀 Server: Express.js"
	@echo "📝 ORM: Prisma"
	@echo ""

status:
	@echo "📊 Current Status"
	@echo ""
	@echo "Docker containers:"
	@$(DOCKER_COMPOSE) ps 2>/dev/null || echo "⚠️  Docker not running"
	@echo ""
	@echo "Port checks:"
	@echo -n "3000 (App): "
	@nc -z localhost 3000 > /dev/null 2>&1 && echo "✅ Open" || echo "❌ Closed"
	@echo -n "5432 (PostgreSQL): "
	@nc -z localhost 5432 > /dev/null 2>&1 && echo "✅ Open" || echo "❌ Closed"
	@echo -n "5050 (PgAdmin): "
	@nc -z localhost 5050 > /dev/null 2>&1 && echo "✅ Open" || echo "❌ Closed"

.DEFAULT_GOAL := help
