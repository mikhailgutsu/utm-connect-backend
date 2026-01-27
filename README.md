# UTM Connect Backend

## Requirements

- Node.js 18+
- Docker & Docker Compose
- Make

## Quick Start

```bash
# Full setup (install deps + Docker + migrate + seed)
make setup

# Start development server
make dev
```

## Setup Commands

```bash
# Install dependencies
make install

# Create .env file
make env

# Start Docker containers
make docker-up

# Run database migrations
make db-migrate

# Seed database with test data
make db-seed
```

## Development

```bash
# Start dev server
make dev

# Build TypeScript
make build

# Run production build
make start
```

## Docker Commands

```bash
# Start containers (detached)
make docker-up

# Stop containers
make docker-down

# Restart containers
make docker-restart

# View logs
make docker-logs

# View PostgreSQL logs only
make docker-logs-db

# Check running containers
make docker-ps

# Remove containers and volumes (⚠️ deletes data)
make docker-clean
```

## Database Commands

```bash
# Create and apply migrations
make db-migrate

# Push schema to database
make db-push

# Generate Prisma Client
make db-generate

# Seed with test data
make db-seed

# Open PostgreSQL shell
make db-shell

# Create backup
make db-backup

# Reset database (⚠️ deletes all data)
make db-reset
```

## Code Quality

```bash
# Run ESLint
make lint

# Fix ESLint issues
make lint-fix

# Format code with Prettier
make format

# Check code format
make format-check
```

## Utility Commands

```bash
# Show all available commands
make help

# Show project info
make info

# Check service status
make status

# Clean build artifacts
make clean
```
