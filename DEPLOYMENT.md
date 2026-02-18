# Smart Attendance System - Deployment Guide

This guide details how to deploy the Smart Attendance System on an Ubuntu server using Docker.

## Prerequisites
- **Ubuntu Server** (20.04 or later recommended)
- **Docker** & **Docker Compose** installed
- **Git**
- A domain name pointing to your server IP (optional, for SSL)

## 1. Initial Setup

### Clone the Repository
```bash
cd /var/www
git clone https://github.com/your-repo/smart-attendance.git
cd smart-attendance
```

### Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and set the following **Production** values:
```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=smart_attendance
DB_USERNAME=smart_user
DB_PASSWORD=secure_password

API_KEY=your_secure_random_api_key_here
```

**Important**: 
- Set `DB_HOST=db` (this matches the service name in `docker-compose.yml`).
- Use a strong `DB_PASSWORD` and `API_KEY`.

## 2. Running with Docker

Build and start the containers:
```bash
docker compose up -d --build
```

### First-Time Setup
Once the containers are running, generate the application key and run migrations:

```bash
# Generate App Key
docker compose exec app php artisan key:generate

# Run Migrations & Seeders
docker compose exec app php artisan migrate:fresh --seed
```

Your application should now be accessible at `http://your-server-ip`.

## 3. SSL Configuration (HTTPS)

To enable HTTPS with Let's Encrypt:

1.  **Edit `docker-compose.yml`**: Ensure port 80 and 443 are open.
2.  **Edit `docker/nginx/conf.d/app.conf`**:
    - Uncomment the SSL sections.
    - Update `yourdomain.com` with your actual domain.
3.  **Obtain Certificate**:
    ```bash
    docker compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot -d yourdomain.com
    ```
4.  **Restart Nginx**:
    ```bash
    docker compose restart webserver
    ```

## 4. Troubleshooting

**Check Logs**:
```bash
docker compose logs -f app
docker compose logs -f webserver
```

**Permission Issues**:
If you encounter permission errors with storage:
```bash
docker compose exec app chown -R www-data:www-data /var/www/storage
```
