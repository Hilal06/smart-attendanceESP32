# Deployment Guide (Docker on Ubuntu)

This guide assumes you have a server with **Ubuntu** and **Docker** installed.

## 1. Prerequisites

### Install Docker & Docker Compose
If you haven't already:
```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install Docker packages:
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 2. Setup Application

1.  **Clone the Repository**:
    ```bash
    git clone <YOUR_REPO_URL> smart-attendanceESP32
    cd smart-attendanceESP32
    ```

2.  **Configure Environment**:
    ```bash
    cp .env.example .env
    nano .env
    ```
    > **Why copy `.env.example`?**
    > The `.env` file contains sensitive secrets (passwords, API keys) and is **never** committed to Git for security. `.env.example` is a safe template committed to the repository. You copy it to create your actual configuration file (`.env`), which you then customize for this server.

    **Critical Settings to Change in `.env`**:
    - `APP_ENV=production`
    - `APP_DEBUG=false`
    - `APP_URL=https://your-domain.com`
    - `DB_CONNECTION=mysql` (Already set in updated example)
    - `DB_HOST=db` (Points to the database container service name)
    - `DB_DATABASE=smart_attendance`
    - `DB_USERNAME=smart_attendance`
    - `DB_PASSWORD=secret_password` (**Change this to a strong password!**)

3.  **Start Services**:
    This will build the images (installing all dependencies and building assets inside the container) and start them.
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

    > **Note: Which Docker Compose file to use?**
    > *   **`docker-compose.prod.yml` (Production - Use this on Server)**: Optimized for stability and performance. It builds self-contained images and has automatic restart policies. Use this for deployment.
    > *   **`docker-compose.yml` (Development)**: Designed for local coding. It mounts your code folders so changes happen instantly. Do not use this on the production server.

## 3. Post-Deployment Setup

Run these commands *once* after the containers are up:

1.  **Generate App Key**:
    ```bash
    docker compose -f docker-compose.prod.yml exec app php artisan key:generate
    ```

2.  **Run Migrations**:
    ```bash
    docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
    ```

3.  **Set Permissions (Optional but Recommended)**:
    ```bash
    docker compose -f docker-compose.prod.yml exec app chown -R www-data:www-data storage
    ```

## 4. Updates

To update the application code later:

```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
```

---

## Architecture Note
- **App Container**: PHP-FPM, contains all backend code + built frontend assets in `/var/www/public/build`.
- **Webserver Container**: Nginx, builds its own image to serve static files efficiently.
- **DB Container**: MariaDB.
