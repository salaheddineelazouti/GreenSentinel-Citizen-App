# GreenSentinel Makefile for Docker Compose
# Profiles: dev, prod

DEV_FILE=docker-compose.dev.yml
PROD_FILE=docker-compose.yml

# Default development environment
.PHONY: dev
dev:
	@echo "Starting development environment..."
	docker compose -f $(PROD_FILE) -f $(DEV_FILE) --profile dev up --build

# Production environment
.PHONY: prod
prod:
	@echo "Starting production environment..."
	docker compose -f $(PROD_FILE) --profile prod up -d --build

# Stop and clean containers
.PHONY: down
down:
	@echo "Stopping containers and cleaning up..."
	docker compose -f $(PROD_FILE) -f $(DEV_FILE) down -v --remove-orphans

# Clean all generated images
.PHONY: clean
clean:
	@echo "Removing all greensentinel images..."
	docker rmi $$(docker images 'greensentinel/*' -q) 2>/dev/null || true

# Seed demo data
.PHONY: seed
seed:
	@echo "Seeding demo data..."
	docker compose exec backend python scripts/seed_demo.py

# Generate documentation PDFs
.PHONY: docs
docs:
	@echo "Generating documentation PDFs..."
	bash docs/build_docs.sh

# Help command
.PHONY: help
help:
	@echo "GreenSentinel Docker Compose Commands:"
	@echo "make dev        - Start development environment with hot-reload"
	@echo "make prod       - Start production environment with HTTPS"
	@echo "make down       - Stop and clean containers"
	@echo "make seed       - Seed demo data (requires running backend)"
	@echo "make docs       - Generate documentation PDFs (requires pandoc)"
	@echo "make clean      - Remove all greensentinel images"
	@echo "make help       - Show this help"
