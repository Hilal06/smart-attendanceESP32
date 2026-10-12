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
Once the containers are running, generate the app key, link storage, and initialize the database:

1. **Generate App Key**
   ```bash
   docker compose -f docker-compose.prod.yml exec app php artisan key:generate
   ```

2. **Run Migrations**
   ```bash
   docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
   ```

3. **Initialize Database Data (Roles, Permissions & Samples)**
   Run the main seeder to create roles and initial project data:
   ```bash
   docker compose -f docker-compose.prod.yml exec app php artisan db:seed --force
   ```

4. **Create Storage Link**
   Required for profile pictures and face data:
   ```bash
   docker compose -f docker-compose.prod.yml exec app php artisan storage:link
   ```

## 3. Default Credentials
The `db:seed` command creates several default accounts for testing purposes:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@smart.com` | `password123` |
| **Teacher** | `teacher1@smartattend.com` | `password123` |
| **Student** | `student1@smartattend.com` | `password123` |

*Note: You can use `teacher1` through `teacher6` and `student1` through `student20`.*

## 4. Architecture Note
- **App Container**: PHP-FPM, runs the Laravel backend.
- **Webserver Container**: Nginx, serves the built React frontend assets and proxies Laravel/Python service requests. The Python service is secured behind Nginx (port 80/443) rather than exposing port 5000 directly.
- **Python Service Container**: Runs the `face_recognition` models and coordinates images from ESP32. It operates at high speeds using in-memory image processing and `.pkl` encoding caching.
- **DB Container**: MariaDB/MySQL server.
- **Logging**: All Docker containers use JSON-file logging with automatic log rotation (`max-size: 10m`, `max-file: 3`) to prevent disk exhaustion.
- **Hardware Integration**: The associated ESP32-CAM script uses a hardware trigger mechanism to prevent network flooding and a disabled brownout detector for power stability.

## 5. Updates
To update the application code later:
```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
```

## 6. Future Improvements (Roadmap)
The following deployment and architecture upgrades are planned for future iterations to ensure enterprise-grade stability:
- **Automated SSL/TLS (HTTPS)**: Integrate Let's Encrypt (Certbot) directly into the Docker Compose setup for automatic certificate generation and renewal.
- **Automated Database Backups**: Add a cron-based container (e.g., `spack/mysql-backup`) to daily dump the MariaDB database to the `./storage/backups` directory.
