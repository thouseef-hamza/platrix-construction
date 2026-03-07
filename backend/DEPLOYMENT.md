# Backend Deployment Guide – DigitalOcean Droplet

Step-by-step guide to deploy the Django backend on a DigitalOcean droplet using Docker Compose.

---

## Quick Start (You've Already Cloned)

If you've cloned the repo and are on the droplet:

1. **Install Docker** (Step 1.3 below) if not already installed.
2. **Create `.env.prod`** from `.env.prod.example` and fill in all values (Step 3).
3. **Update `nginx/default.conf`** – set `server_name` to your domain or `_` for IP-only (Step 4).
4. **Run:** `docker compose -f docker-compose.prod.yml up -d --build` (Step 5).
5. **Create superuser:** `docker compose -f docker-compose.prod.yml exec app uv run python manage.py createsuperuser` (Step 6).

---

## Prerequisites

- A DigitalOcean droplet (Ubuntu 22.04 LTS recommended)
- SSH access to the droplet
- A domain name pointed to your droplet’s IP (optional but recommended for SSL)

---

## Step 1: Initial Droplet Setup

### 1.1 Connect via SSH

```bash
ssh root@YOUR_DROPLET_IP
```

### 1.2 Create a non-root user (recommended)

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### 1.3 Update system and install Docker

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
# Log out and back in for group to take effect
```

### 1.4 Install Git (if not present)

```bash
sudo apt install -y git
```

---

## Step 2: Clone the Repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/bf-software-django.git
cd bf-software-django/backend
```

Replace `YOUR_USERNAME` with your actual GitHub username or use your repo URL.

---

## Step 3: Configure Production Environment

### 3.1 Create `.env.prod`

```bash
cp .env.example .env.prod
nano .env.prod
```

### 3.2 Fill in all required variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Strong random key | `openssl rand -base64 48` |
| `DEBUG` | Must be `false` in production | `false` |
| `ALLOWED_HOSTS` | Comma-separated hostnames | `api.yourdomain.com,yourdomain.com,YOUR_DROPLET_IP` |
| `DB_NAME` | PostgreSQL database name | `bfsoftware` |
| `DB_USER` | PostgreSQL user | `bfuser` |
| `DB_PASSWORD` | Strong database password | (generate a strong password) |
| `DB_HOST` | Use `db` (Docker service name) | `db` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | Same as `DB_NAME` | `bfsoftware` |
| `POSTGRES_USER` | Same as `DB_USER` | `bfuser` |
| `POSTGRES_PASSWORD` | Same as `DB_PASSWORD` | (same as above) |
| `CORS_ALLOWED_ORIGINS` | Frontend URLs (comma-separated) | `https://yourdomain.com,https://app.yourdomain.com` |
| `CSRF_TRUSTED_ORIGINS` | **Required for Django 4+** – API + frontend URLs (comma-separated) | `https://api.yourdomain.com,https://yourdomain.com` or `http://YOUR_IP` for IP-only |

**Generate SECRET_KEY:**

```bash
openssl rand -base64 48
```

**Example `.env.prod`:**

```env
# Django
SECRET_KEY=your-generated-secret-key-here
DEBUG=false
ALLOWED_HOSTS=api.yourdomain.com,yourdomain.com,123.45.67.89

# PostgreSQL (DB_HOST=db when using Docker)
DB_NAME=bfsoftware
DB_USER=bfuser
DB_PASSWORD=your-strong-db-password
DB_HOST=db
DB_PORT=5432

# PostgreSQL container (same values as DB_*)
POSTGRES_DB=bfsoftware
POSTGRES_USER=bfuser
POSTGRES_PASSWORD=your-strong-db-password

# CORS (comma-separated frontend origins)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# CSRF (required for Django 4+ – include API URL and any frontend that POSTs to API)
CSRF_TRUSTED_ORIGINS=https://api.yourdomain.com,https://yourdomain.com
```

---

## Step 4: Update Nginx Configuration

Edit `nginx/default.conf` and set your domain(s):

```bash
nano nginx/default.conf
```

Replace `yourdomain.com` with your actual domain or droplet IP:

```nginx
server_name api.yourdomain.com yourdomain.com;
```

If using only an IP for testing:

```nginx
server_name _;
```

---

## Step 5: Build and Run

```bash
cd ~/bf-software-django/backend
docker compose -f docker-compose.prod.yml up -d --build
```

### 5.1 Verify containers are running

```bash
docker compose -f docker-compose.prod.yml ps
```

You should see `db`, `app`, and `nginx` running.

### 5.2 Check logs if needed

```bash
docker compose -f docker-compose.prod.yml logs -f
```

---

## Step 6: Create Superuser

```bash
docker compose -f docker-compose.prod.yml exec app uv run python manage.py createsuperuser
```

Enter username, email, and password when prompted.

---

## Step 7: Verify Deployment

- **Health check:** `http://YOUR_IP/health/`
- **Admin:** `http://YOUR_IP/admin/`
- **API root:** `http://YOUR_IP/api/`

---

## Step 8: SSL/HTTPS (Recommended)

### Option A: Using Caddy (simple)

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Caddy will proxy to Nginx; configure Caddyfile
sudo nano /etc/caddy/Caddyfile
```

Example Caddyfile (Caddy handles SSL automatically):

```
api.yourdomain.com {
    reverse_proxy localhost:80
}
```

```bash
sudo systemctl reload caddy
```

### Option B: Using Certbot + Nginx

1. Install Certbot: `sudo apt install certbot python3-certbot-nginx`
2. Temporarily stop the Docker nginx or configure Certbot for the host nginx
3. Run: `sudo certbot --nginx -d api.yourdomain.com`
4. Update `nginx/default.conf` to listen on 443 with SSL certificates
5. Restart containers

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `docker compose -f docker-compose.prod.yml logs -f` | Follow logs |
| `docker compose -f docker-compose.prod.yml down` | Stop all services |
| `docker compose -f docker-compose.prod.yml down -v` | Stop and remove volumes (destroys DB) |
| `docker compose -f docker-compose.prod.yml exec app uv run python manage.py migrate` | Run migrations |
| `docker compose -f docker-compose.prod.yml exec app uv run python manage.py collectstatic --noinput` | Re-collect static files |
| `docker compose -f docker-compose.prod.yml exec app uv run python manage.py createsuperuser` | Create admin user |

---

## Updating the Deployment

```bash
cd ~/bf-software-django
git pull origin main  # or your branch name
cd backend
docker compose -f docker-compose.prod.yml up -d --build
```

Migrations run automatically on startup. If you add new migrations, they will be applied.

---

## Troubleshooting

### Database connection refused

- Ensure `DB_HOST=db` in `.env.prod`
- Wait 10–15 seconds after `up` for PostgreSQL to start
- Check: `docker compose -f docker-compose.prod.yml logs db`

### 502 Bad Gateway

- App container may not be ready: `docker compose -f docker-compose.prod.yml logs app`
- Check migrations and collectstatic completed successfully

### Static/Media files not loading

- Ensure volumes are correctly configured in `docker-compose.prod.yml`
- Restart: `docker compose -f docker-compose.prod.yml restart app nginx`

### CORS errors from frontend

- Add your frontend URL(s) to `CORS_ALLOWED_ORIGINS` in `.env.prod`
- Restart app: `docker compose -f docker-compose.prod.yml restart app`

### CSRF verification failed / 403 Forbidden

- Add `CSRF_TRUSTED_ORIGINS` to `.env.prod` with your actual URLs (comma-separated)
- **HTTPS:** `CSRF_TRUSTED_ORIGINS=https://api.yourdomain.com,https://yourdomain.com`
- **IP-only (HTTP):** `CSRF_TRUSTED_ORIGINS=http://YOUR_DROPLET_IP`
- Restart app: `docker compose -f docker-compose.prod.yml restart app`

---

## Changes Made for Deployment

The following files were added or updated to support production deployment:

| File | Change |
|------|--------|
| `docker-compose.prod.yml` | Added volumes `app_static` and `app_media` so Nginx can serve static and uploaded files |
| `nginx/default.conf` | Added `/media/` location for user uploads (documents) |
| `.env.prod.example` | Template with all required variables and comments |
| `.dockerignore` | Excludes `.venv`, `.env*`, logs, etc. from the Docker build |
| `DEPLOYMENT.md` | This guide |

---

## Security Checklist

- [ ] `DEBUG=false` in `.env.prod`
- [ ] Strong `SECRET_KEY` (never commit to git)
- [ ] Strong `DB_PASSWORD` and `POSTGRES_PASSWORD`
- [ ] `.env.prod` is in `.gitignore` (do not commit)
- [ ] `ALLOWED_HOSTS` includes only your domain(s)/IP
- [ ] `CORS_ALLOWED_ORIGINS` includes only your frontend URL(s)
- [ ] SSL/HTTPS enabled for production
- [ ] Firewall: `sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable`
