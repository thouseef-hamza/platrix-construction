# ==================================
# Django + uv Production Makefile
# ==================================

UV=uv
PYTHON=$(UV) run python
MANAGE=$(PYTHON) manage.py

APP_NAME=myproject
DOCKER_IMAGE=$(APP_NAME):latest

# Load env: .env if present, then .env.dev (so .env.dev is used when .env is missing)
-include .env
-include .env.dev
export

# -------------------------------
# ENVIRONMENT
# -------------------------------

install:
	$(UV) sync

freeze:
	$(UV) lock

update:
	$(UV) sync

# -------------------------------
# DATABASE
# -------------------------------

db-create:
	@echo "Creating database if not exists..."
	@PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -U $(DB_USER) -p $(DB_PORT) -tc "SELECT 1 FROM pg_database WHERE datname='$(DB_NAME)'" | grep -q 1 || \
	PGPASSWORD=$(DB_PASSWORD) createdb -h $(DB_HOST) -U $(DB_USER) -p $(DB_PORT) $(DB_NAME)

db-drop:
	@echo "Dropping database..."
	@PGPASSWORD=$(DB_PASSWORD) dropdb -h $(DB_HOST) -U $(DB_USER) -p $(DB_PORT) --if-exists $(DB_NAME)

db-reset: db-drop db-create migrate

db-shell:
	@PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -U $(DB_USER) -p $(DB_PORT) $(DB_NAME)

backup:
	@mkdir -p backups
	@TIMESTAMP=$$(date +"%Y%m%d_%H%M%S"); \
	PGPASSWORD=$(DB_PASSWORD) pg_dump -h $(DB_HOST) -U $(DB_USER) -p $(DB_PORT) $(DB_NAME) > backups/db_$$TIMESTAMP.sql; \
	echo "Backup created."

restore:
	@echo "Usage: make restore FILE=backups/file.sql"
	@PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -U $(DB_USER) -p $(DB_PORT) $(DB_NAME) < $(FILE)

# -------------------------------
# DJANGO
# -------------------------------

migrate:
	$(MANAGE) migrate

makemigrations:
	$(MANAGE) makemigrations

collectstatic:
	$(MANAGE) collectstatic --noinput

createsuperuser:
	$(MANAGE) createsuperuser

flush:
	$(MANAGE) flush --noinput

shell:
	$(MANAGE) shell

check:
	$(MANAGE) check

test:
	$(MANAGE) test

# -------------------------------
# RUN
# -------------------------------

run:
	$(MANAGE) runserver

prod-run:
	$(UV) run gunicorn config.wsgi:application \
	--workers 3 \
	--bind 0.0.0.0:8000 \
	--log-file logs/gunicorn.log

# -------------------------------
# CODE QUALITY
# -------------------------------

lint:
	$(UV) run ruff check .
	$(UV) run black --check .

format:
	$(UV) run ruff check . --fix
	$(UV) run black .

type-check:
	$(UV) run mypy .

# -------------------------------
# HEALTH CHECK
# -------------------------------

health:
	curl -f http://localhost:8000/health/ || exit 1

# -------------------------------
# DOCKER
# -------------------------------

docker-build:
	docker build -t $(DOCKER_IMAGE) .

docker-run:
	docker run -p 8000:8000 $(DOCKER_IMAGE)

docker-stop:
	docker ps -q --filter ancestor=$(DOCKER_IMAGE) | xargs -r docker stop

# -------------------------------
# DEPLOY (Simple VM Deploy Example)
# -------------------------------

deploy:
	git pull origin production
	$(UV) sync --frozen
	$(MANAGE) migrate
	$(MANAGE) collectstatic --noinput
	sudo systemctl restart gunicorn