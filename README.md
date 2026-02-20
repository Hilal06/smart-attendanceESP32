# SmartAttend - Enterprise Attendance System

SmartAttend is a sophisticated, enterprise-ready attendance management platform designed for modern organizations. It combines a robust **Laravel 12** backend with a dynamic **React (Inertia.js)** frontend, **Dockerized deployment**, and an integrated **Python Face Recognition Service** to streamline HR operations.

Designed for seamless integration with **ESP32-CAM** devices for contactless, facial recognition-based attendance.

---

## 🌟 Key Features

### 1. Advanced Biometric Attendance
- **Face Recognition**: Automated attendance via ESP32-CAM and a Python-based recognition engine (Dlib).
- **Auto-Enrollment**: Uploading an employee avatar automatically enrolls them in the recognition system.
- **Real-time Sync**: Hot-reload capability ensures new faces are recognized instantly without server restarts.

### 2. Security & Authentication
- **Role-Based Access**: Secure Admin and Employee login portals.
- **API Key Protection**: Dedicated `X-API-KEY` middleware for securing device endpoints.
- **Session Management**: Robust session handling via standard Laravel Auth.

### 3. Workforce Management
- **Smart Employee Directory**: CRUD operations with automatic **Random ID Generation**.
- **Avatar Management**: Local storage for employee photos, mapped to Employee IDs for recognition.
- **Attendance Tracking**: Real-time status monitoring (`Present`, `Late`, `Absent`, `On Leave`).

### 4. Intelligent Analytics
- **Performance Dashboards**: Interactive charts for weekly/monthly trends.
- **Optimized Queries**: Dashboard efficiently processes data using optimized eloquent queries and date filtering.

### 5. Customization
- **Bilingual Support**: Toggle between **English** and **Indonesian (Bahasa Indonesia)**.
- **Company Settings**: Configure late thresholds, work schedules, and branding.

---

## 🛠️ Technology Stack

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend** | **Laravel** | `12.x` | Core framework, Auth, API, ORM. |
| **Frontend** | **React** | `19.x` | Component-based UI. |
| **Bridge** | **Inertia.js** | `2.x` | Modern monolith architecture. |
| **Database** | **MySQL** | `8.0` | Relational data persistence. |
| **Recognition** | **Python (Flask)** | `3.10` | Face recognition microservice using Dlib. |
| **Container** | **Docker** | `27.x` | Containerization and orchestration. |
| **Server** | **Nginx** | `1.25` | Web server & Reverse Proxy. |

---

## 🚀 Installation & Setup

### Option 1: Docker (Production / Recommended)

1.  **Clone & Setup Environment**
    ```bash
    git clone https://github.com/hilal06/smart-attendanceESP32.git
    cd smart-attendanceESP32
    cp .env.example .env
    ```

2.  **Configure .env**
    Open `.env` and set `APP_ENV=production`, `DB_HOST=db`, and your passwords.

3.  **Run Containers**
    This starts Nginx, PHP-FPM, MySQL, and the Python Face Recognition service.
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

4.  **Initialize App**
    ```bash
    docker compose -f docker-compose.prod.yml exec app php artisan key:generate
    docker compose -f docker-compose.prod.yml exec app php artisan storage:link
    docker compose -f docker-compose.prod.yml exec app php artisan migrate:fresh --seed
    ```

    Visit `http://localhost`.

### Option 2: Manual Setup (Local Development)

**Prerequisites**: PHP 8.2+, Node.js, MySQL, Python 3.10+ (with Visual C++ Build Tools).

1.  **Install PHP & Node Dependencies**
    ```bash
    composer install
    npm install
    ```

2.  **Configure Database**
    Update `.env` with your local MySQL credentials.

3.  **Run Migrations & Seed**
    ```bash
    php artisan migrate --seed
    php artisan storage:link
    ```

4.  **Start Web Server**
    ```bash
    php artisan serve
    npm run dev
    ```

5.  **Start Face Recognition Service**
    Navigate to `python_service/` and run:
    ```bash
    pip install -r requirements.txt
    python app.py
    ```

---

## 📷 Face Recognition Guide

The system uses a dedicated Python microservice for face recognition.

1.  **Enrollment**: Simply upload a photo when creating or editing an employee in the dashboard.
2.  **Recognition**: The ESP32-CAM captures an image and sends it to the Python service.
3.  **Matching**: The service compares the captured face with the uploaded avatars.
4.  **Attendance**: If a match is found (e.g., ID `123456`), an attendance record is created via the Laravel API.

**Manual Reload**:
If you add photos manually to the folder, trigger a reload at:
`http://localhost:5000/reload`

---

## 📡 API Documentation

### ESP32 Capture Endpoint (Python Service)

**Endpoint**: `POST /recognize` (on Port 5000)
**Body**: Raw image data (binary).

### Internal Attendance Endpoint (Laravel)

**Endpoint**: `POST /api/attendance`
**Headers**:
- `Content-Type: application/json`
- `X-API-KEY: <your_secret_key>`

**Body**:
```json
{
  "employee_id": "123456"
}
```

---

## 📂 Project Structure

```
smart-attendance/
├── app/                  # Laravel Core Code
├── docker/               # Docker Configs
├── python_service/       # Face Recognition Microservice
│   ├── app.py            # Flask App
│   ├── known_faces/      # (Shared) Employee Avatars
│   └── uploads/          # Temporary Captures
├── resources/js/         # React Frontend
│   ├── Pages/            # Application Screens
│   └── Components/       # Reusable UI Elements
├── storage/app/public/   # Shared Storage (Avatars)
└── docker-compose.prod.yml
```

---

## 📝 License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).