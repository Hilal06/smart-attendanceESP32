# SmartAttend - Enterprise Attendance System

SmartAttend is a sophisticated, enterprise-ready attendance management platform designed for modern organizations. It combines a robust **Laravel 12** backend with a dynamic **React (Inertia.js)** frontend, **Dockerized deployment**, and **AI-driven analytics** to streamline HR operations.

Designed for seamless integration with **ESP32-CAM** devices for facial recognition-based attendance.

---

## 🌟 Key Features

### 1. Security & Authentication
- **Role-Based Access**: Secure Admin and Employee login portals.
- **API Key Protection**: Dedicated `X-API-KEY` middleware for securing ESP32-CAM endpoints.
- **Session Management**: Robust session handling via standard Laravel Auth.

### 2. DevOps & Deployment
- **Dockerized**: Fully containerized application with `docker-compose`.
- **Nginx Reverse Proxy**: Production-ready Nginx config with Gzip compression over SSL.
- **Scalable Architecture**: Database and App services isolated in a custom Docker network.

### 3. Workforce Management
- **Smart Employee Directory**: CRUD operations with automatic **Random ID Generation**.
- **Default Avatars**: Intelligent fallback to initials (ui-avatars.com) for users without photos.
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
| **Container** | **Docker** | `27.x` | Containerization and orchestration. |
| **Server** | **Nginx** | `1.25` | Web server & Reverse Proxy. |
| **AI** | **Google Gemini** | `1.5` | Usage for future analytical insights. |

---

## 🚀 Installation & Setup

### Option 1: Docker (Recommended)

1.  **Clone & Setup Environment**
    ```bash
    git clone https://github.com/yourusername/smart-attendance.git
    cd smart-attendance
    cp .env.example .env
    ```

2.  **Configure .env**
    Set `DB_HOST=db` and a strong `API_KEY`.

3.  **Run Containers**
    ```bash
    docker compose up -d --build
    ```

4.  **Initialize App**
    ```bash
    docker compose exec app php artisan key:generate
    docker compose exec app php artisan migrate:fresh --seed
    ```

    Visit `http://localhost`.

### Option 2: Manual Setup

1.  **Install Dependencies**
    ```bash
    composer install
    npm install
    ```

2.  **Configure Database**
    Update `.env` with your local MySQL credentials.

3.  **Run Migrations & Seed**
    ```bash
    php artisan migrate --seed
    ```

4.  **Start Servers**
    ```bash
    php artisan serve
    npm run dev
    ```

---

## 📡 API Documentation

### ESP32 Attendance Endpoint

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

**Response**:
```json
{
  "status": "success",
  "type": "check_in",
  "message": "Welcome! Checked in at 08:30",
  "data": { ... }
}
```

---

## 📂 Project Structure

```
smart-attendance/
├── app/                  # Laravel Core Code (Controllers, Models, Middleware)
├── docker/               # Docker Configs (Nginx, Entrypoint, Dockerfile)
├── resources/js/         # React Frontend
│   ├── Pages/            # Application Screens
│   ├── Components/       # Reusable UI Elements
│   └── constants.ts      # Global Constants & Translations
├── routes/               # Web & API Routes
└── docker-compose.yml    # Service Orchestration
```

---

## 📝 License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).