# BF Software

A full-stack business and finance management application with a Django REST API backend and a Next.js frontend. It supports multi-account workflows, purchases, expenses, accounting, inventory, projects, employees, and companies.

## Tech Stack

| Layer    | Stack |
| -------- | ----- |
| Backend  | Django 6, Django REST Framework, Simple JWT, PostgreSQL, Gunicorn |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, TanStack Query, Axios |

## Project Structure

```
bf-software-django/
├── backend/          # Django API
│   ├── apps/         # Core, users, accounts, companies, projects, purchase, expenses, employees, inventory, accounting, invoices, reports
│   ├── config/       # Settings, URLs, middleware
│   ├── manage.py
│   ├── pyproject.toml
│   ├── Makefile
│   └── docker-compose*.yml
├── frontend/         # Next.js app
│   ├── src/
│   │   ├── components/
│   │   ├── lib/      # API client, auth
│   │   └── ...
│   ├── package.json
│   └── next.config.ts
└── README.md
```

## Prerequisites

- **Python** 3.12+
- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **uv** (recommended for Python) – [install](https://docs.astral.sh/uv/getting-started/installation/)

## Backend Setup

1. **Go to the backend directory**
   ```bash
   cd backend
   ```

2. **Environment**
   - Copy `.env.example` to `.env` (or `.env.dev`) and set:
     - `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
     - `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`

3. **Install dependencies**
   ```bash
   uv sync
   ```
   Or without uv: `pip install -e .` (from backend).

4. **Database**
   ```bash
   make db-create   # create DB if needed
   make migrate
   make createsuperuser   # optional
   ```

5. **Run the API**
   ```bash
   make run
   ```
   API base: **http://localhost:8000**

   - Health: http://localhost:8000/health/
   - Admin: http://localhost:8000/admin/
   - API root: http://localhost:8000/api/

### Backend Makefile (summary)

| Command        | Description              |
| -------------- | ------------------------ |
| `make install` | Install deps (`uv sync`)  |
| `make migrate` | Run migrations           |
| `make run`     | Dev server (runserver)   |
| `make test`    | Run tests                |
| `make lint`    | Ruff + Black check      |
| `make format`  | Ruff fix + Black format  |
| `make db-create` | Create PostgreSQL DB   |
| `make db-reset`  | Drop, create, migrate   |

## Frontend Setup

1. **Go to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Environment**
   - Optional: set `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000/api`).

3. **Install and run**
   ```bash
   npm install
   npm run dev
   ```
   App: **http://localhost:3000**

### Frontend scripts

| Command         | Description        |
| --------------- | ------------------ |
| `npm run dev`   | Dev server         |
| `npm run build` | Production build   |
| `npm run start` | Run production     |
| `npm run lint`  | ESLint             |

## API Overview

- **Auth:** `POST /api/auth/...` (login, refresh, etc.) – no account header.
- **All other API routes** require:
  - **Authentication:** Bearer JWT.
  - **Header:** `x-account-id: <account_id>` (integer). Requests without a valid `x-account-id` for non-auth paths receive `400`.

Main API namespaces under `/api/`:

- `auth/` – authentication
- `accounting/` – chart of accounts, ledger entries
- `companies/` – companies
- `inventory/` – materials
- `projects/` – projects
- `purchases/` – purchases and payments
- `expenses/` – expenses
- `employees/` – employees

## Docker

### Development

From `backend/` use `docker-compose.dev.yml` for local Docker-based development (see that file for details).

### Production with Docker

The backend can be run in production using Docker Compose: **PostgreSQL**, **Django (Gunicorn)**, and **Nginx** as a reverse proxy.

1. **Go to the backend directory**
   ```bash
   cd backend
   ```

2. **Configure production environment**
   - Copy `.env.example` to `.env.prod` (or create `.env.prod`).
   - Set **required** variables:

   | Variable | Description |
   | -------- | ------------ |
   | `SECRET_KEY` | Strong random key (e.g. `openssl rand -base64 48`). |
   | `DEBUG` | Set to `false`. |
   | `ALLOWED_HOSTS` | Comma-separated hostnames, e.g. `yourdomain.com,www.yourdomain.com`. |
   | `DB_NAME` | PostgreSQL database name. |
   | `DB_USER` | PostgreSQL user. |
   | `DB_PASSWORD` | PostgreSQL password. |
   | `DB_HOST` | Leave as `db` (Docker service name). |
   | `POSTGRES_DB` | Same as `DB_NAME` (used by the Postgres container). |
   | `POSTGRES_USER` | Same as `DB_USER`. |
   | `POSTGRES_PASSWORD` | Same as `DB_PASSWORD`. |
   | `CORS_ALLOWED_ORIGINS` | Comma-separated frontend URLs, e.g. `https://yourdomain.com,https://app.yourdomain.com`. |

3. **Configure Nginx (optional but recommended)**
   - Edit `nginx/default.conf` and set `server_name` to your domain(s).
   - Ensure `ALLOWED_HOSTS` in `.env.prod` matches those hostnames.

4. **Build and run**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
   - **PostgreSQL** stores data in a named volume `postgres_data`.
   - **App** runs migrations, collects static files, then starts Gunicorn (3 workers) on port 8000 inside the network.
   - **Nginx** listens on host port **80** and proxies to the app; static files are served from the app’s `/static/` (alias to `staticfiles`).

5. **Useful commands**
   ```bash
   # View logs
   docker-compose -f docker-compose.prod.yml logs -f

   # Stop
   docker-compose -f docker-compose.prod.yml down

   # Stop and remove volumes (destroys DB data)
   docker-compose -f docker-compose.prod.yml down -v
   ```

6. **First run**
   - Create a superuser after the stack is up:
     ```bash
     docker-compose -f docker-compose.prod.yml exec app uv run python manage.py createsuperuser
     ```
   - Point your frontend’s `NEXT_PUBLIC_API_URL` (or equivalent) to your backend URL (e.g. `https://api.yourdomain.com` if you put TLS in front of Nginx).

7. **SSL / HTTPS**
   - The Compose setup exposes port 80 only. For HTTPS, use a reverse proxy in front of Nginx (e.g. Traefik, Caddy) or configure Nginx with SSL certificates (e.g. Let’s Encrypt) and expose 443.

## License

Proprietary – see your organization’s terms.
