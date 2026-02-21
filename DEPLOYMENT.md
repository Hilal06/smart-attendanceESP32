# Smart Attendance System - Deployment Guide

This guide details how to deploy the entire Smart Attendance System (Laravel, React, Python Service, Database, Webserver) on an Ubuntu server using Docker.

## Prerequisites
- **Ubuntu Server** (20.04 or later recommended)
- **RAM**: Minimum 2GB (4GB recommended)
- **Docker** & **Docker Compose plugin** installed
- **Git**

## 1. Initial Setup

### Clone the Repository
```bash
cd /var/www
git clone https://github.com/your-repo/smart-attendance.git
cd smart-attendance
```

### Configure Main Environment (Laravel)
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
**Important**: Set `DB_HOST=db` (this matches the Docker service name).

### Configure Python Service Environment
The Python service needs the same API key to communicate with the backend.
```bash
cd python_service
nano .env
```
Add the following content:
```env
LARAVEL_API_URL=http://webserver/api/attendance
API_KEY=your_secure_random_api_key_here
```
Note: In Docker production, the Python container communicates via the internal network to the `webserver` host.

## 2. Docker Deployment

Build and start the containers from the main project root:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### First-Time Setup
Once the containers are running, generate the key, link storage, and run migrations:
```bash
# Generate App Key
docker compose -f docker-compose.prod.yml exec app php artisan key:generate

# Run Migrations
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force

# Create public storage link (for Face pictures/avatars)
docker compose -f docker-compose.prod.yml exec app php artisan storage:link
```

## 3. Architecture Note
- **App Container**: PHP-FPM, runs the Laravel backend.
- **Webserver Container**: Nginx, serves the built React frontend assets and proxies Laravel requests.
- **Python Service Container**: Runs the `face_recognition` models and coordinates images from ESP32.
- **DB Container**: MariaDB/MySQL server.

## 4. Updates
To update the application code later:
```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
```
