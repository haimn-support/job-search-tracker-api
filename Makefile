.PHONY: certs up down restart logs-api logs-nginx ps verify

COMPOSE=docker compose --env-file ./.env.prod -f ./docker-compose.yml -f ./docker-compose.prod.yml

certs:
	./scripts/generate-dev-certs.sh

up:
	$(COMPOSE) up -d --build

restart:
	$(COMPOSE) restart api nginx

logs-api:
	$(COMPOSE) logs -f api

logs-nginx:
	$(COMPOSE) logs -f nginx

ps:
	$(COMPOSE) ps

verify:
	curl -skI https://localhost/health
	curl -skI https://localhost/docs

down:
	$(COMPOSE) down
