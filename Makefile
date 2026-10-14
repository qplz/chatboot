# AI Chatbot MVP — Makefile shortcuts
# Usage: make <target>

.PHONY: up down logs ps migrate shell-api shell-db build clean

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

build:
	docker compose build

migrate:
	docker compose run --rm api alembic upgrade head

shell-api:
	docker compose exec api bash

shell-db:
	docker compose exec postgres psql -U ai_chatbot_app -d ai_chatbot

# Start only core services (db + api)
up-core:
	docker compose up -d postgres api

# Start with n8n
up-n8n:
	docker compose --profile automation up -d

clean:
	docker compose down
	docker system prune -f

# First time setup
setup:
	cp .env.example .env || true
	docker compose up -d postgres
	@echo "Waiting for postgres..."
	@sleep 10
	docker compose run --rm api alembic upgrade head
	docker compose up -d
	@echo "Setup complete! Visit http://localhost:3000"
