# Local Setup Guide

This guide will help you set up and run the Smart Attendance System on your local machine for development.

## 1. Prerequisites
- **Node.js** (v20+ recommended)
- **PHP** (v8.2+ recommended) & **Composer**
- **Python** (v3.9+ recommended) & **Visual Studio C++ Build Tools** (for the `dlib` library on Windows)
- **MySQL/MariaDB** database

## 2. Backend Setup (Laravel)
1. Open a terminal in the project root.
2. Install PHP dependencies:
   ```bash
   composer install
   ```
3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
4. Generate the application key:
   ```bash
   php artisan key:generate
   ```
5. Create a local MySQL database named `smart_attendance` and update your `.env` with the database credentials and set a secure `API_KEY` (e.g., `API_KEY=secret_esp32_key`).
6. Run migrations:
   ```bash
   php artisan migrate
   ```
7. Start the Laravel development server:
   ```bash
   php artisan serve
   ```
   *(Defaults to `http://127.0.0.1:8000`)*

## 3. Frontend Setup (React/Inertia.js)
1. Open a new terminal in the project root.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## 4. Python Face Recognition Service
1. Open a new terminal and navigate to the `python_service` directory:
   ```bash
   cd python_service
   ```
2. Create a `.env` file in the `python_service` directory and add the same API key and your Laravel API URL:
   ```env
   LARAVEL_API_URL=http://127.0.0.1:8000/api/attendance
   API_KEY=secret_esp32_key
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: If `face_recognition` fails, ensure Visual Studio C++ Build Tools and `cmake` are installed to compile `dlib`.*
4. Start the face recognition microservice:
   ```bash
   python app.py
   ```
   *(Defaults to `http://0.0.0.0:5000`)*
5. **Add Known Faces**: Create a `python_service/known_faces/` folder if it doesn't exist, and put `.jpg` images named after the Employee ID (e.g., `EMP0001.jpg`). Or, upload them directly via the Laravel Web UI!

## 5. Next Steps
Once your local servers are running, proceed to the **[ESP32 Setup Guide](SETUP_ESP32.md)** to connect the camera.
