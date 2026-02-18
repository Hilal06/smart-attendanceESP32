# SmartAttend - AI-Powered Attendance Management System

SmartAttend is a sophisticated, enterprise-ready attendance management platform designed for modern organizations. It combines a robust **Laravel** backend with a dynamic **React (Inertia.js)** frontend and **AI-driven analytics** to streamline HR operations and employee engagement.

Designed effectively for **ESP32-CAM** integration, allowing for future expansion into facial recognition-based attendance.

---

## 🌟 Key Features

### 1. Workforce Lifecycle Management
- **Employee Directory**: Complete CRUD operations for employee records.
- **Smart IDs**: Automatically generates **random 6-digit Employee IDs** for new hires.
- **Default Avatars**: Automatically assigns **Initials Avatars** (via ui-avatars.com) if no profile picture is uploaded.
- **Status Tracking**: Monitor `Active`, `On Leave`, and `Terminated` statuses.

### 2. Intelligent Reporting & Analytics
- **Gemini AI Insights**: Automated analysis of attendance data to identify trends, lateness patterns, and provide actionable HR advice.
- **Visual Dashboards**: Interactive charts for weekly/monthly attendance trends and status distribution.
- **Exportable Reports**: Generate attendance reports for payroll and compliance.

### 3. Real-Time Operations
- **Live Dashboard**: Instant view of who is Present, Late, Absent, or On Leave today.
- **Announcements**: Priority-based (`Urgent`, `High`, `Normal`) communication channel.
- **Requests Portal**: Employees can submit requests (e.g., profile updates), which admins can review and resolve.

### 4. Customization & Localization
- **Settings Management**: Configure company name, logo, late thresholds, and weekly schedules.
- **Bilingual Interface**: Full support for **English** and **Indonesian (Bahasa Indonesia)**.

---

## 🛠️ Technology Stack

This project leverages a modern, performance-oriented stack:

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend** | **Laravel** | `^10.x` | Core application logic, routing, and eloquent ORM. |
| **Database** | **MySQL** | `8.0` | Relational data storage for employees, attendance, etc. |
| **Frontend** | **React** | `^19.x` | Component-based UI architecture. |
| **Bridge** | **Inertia.js** | `^2.x` | Seamless server-side routing for React. |
| **Styling** | **Tailwind CSS** | `v4.0` | Utility-first CSS framework (configured with `@import`). |
| **AI** | **Google Gemini** | `1.5` | AI analysis via `@google/genai` SDK. |

---

## 🚀 Installation & Setup

### Prerequisites
- PHP >= 8.1
- Composer
- Node.js & NPM
- MySQL Server

### Step-by-Step Guide

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/smart-attendanceESP32.git
    cd smart-attendanceESP32
    ```

2.  **Install Backend Dependencies**
    ```bash
    composer install
    ```

3.  **Install Frontend Dependencies**
    ```bash
    npm install
    ```

4.  **Environment Configuration**
    Copy the example environment file and configure your database and API keys.
    ```bash
    cp .env.example .env
    ```
    Update `.env` with your DB credentials and Gemini API key:
    ```env
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=smart_attendance
    DB_USERNAME=root
    DB_PASSWORD=

    GEMINI_API_KEY=your_api_key_here
    APP_URL=http://localhost:8000
    ```

5.  **Generate Application Key**
    ```bash
    php artisan key:generate
    ```

6.  **Database Migration & Seeding**
    Create the tables and seed initial data (including migrating from legacy `db.json` if available).
    ```bash
    php artisan migrate --seed
    ```

7.  **Run Development Servers**
    Open two terminal windows:
    
    *Terminal 1 (Backend):*
    ```bash
    php artisan serve
    ```
    
    *Terminal 2 (Frontend):*
    ```bash
    npm run dev
    ```

8.  **Access the Application**
    Visit [http://localhost:8000](http://localhost:8000)

---

## 📂 Project Structure

- `app/Http/Controllers/AttendanceController.php`: Main logic for handling data and views.
- `app/Models/`: Eloquent models (`Employee`, `Attendance`, `Setting`, etc.).
- `resources/js/`: React frontend application.
  - `Pages/`: Inertia page components.
  - `Components/`: Reusable UI components.
  - `types.ts`: TypeScript interfaces for data consistency.
- `routes/web.php`: Application routes.
- `database/migrations/`: Database schema definitions.

---

## 🔮 Future Roadmap (ESP32 Integration)

- **API Endpoint**: Create `POST /api/attendance` to receive face recognition data from ESP32-CAM.
- **Hardware Integration**: Connect ESP32-CAM module to trigger attendance logs via WiFi.
- **Real-Time Websockets**: Use Laravel Reverb or Pusher to update the dashboard instantly when an employee scans in.

---

*SmartAttend: Engineering organizational efficiency through intelligent design.*