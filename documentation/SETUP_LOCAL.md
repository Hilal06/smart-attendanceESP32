# Panduan Setup Lingkungan Pengembangan Lokal (Local Development)

Dokumen ini memuat panduan langkah demi langkah untuk menjalankan SmartAttend secara manual di komputer pengembang tanpa container Docker.

---

## 1. Kebutuhan Sistem & Prasyarat

Sebelum memulai, pastikan paket perangkat lunak berikut telah terpasang pada komputer pengembang:

* **PHP**: Versi 8.2 atau 8.3 (dengan ekstensi `pdo_mysql`, `mbstring`, `exif`, `pcntl`, `bcmath`, `gd`, `curl`, `zip`).
* **Composer**: Versi 2.x (manajer paket PHP).
* **Node.js**: Versi 20.x atau 22.x LTS dengan npm.
* **Database**: MySQL 8.0 atau MariaDB 10.6+ aktif di port 3306.
* **Python**: Versi 3.10 (disarankan) atau 3.11.
* **Kebutuhan Kompilasi Dlib**:
  * **Linux (Ubuntu/Debian)**: `sudo apt install cmake build-essential libopenblas-dev liblapack-dev libx11-dev libgtk-3-dev python3-dev`
  * **Linux (Fedora/RHEL)**: `sudo dnf install cmake gcc-c++ openblas-devel lapack-devel python3-devel`
  * **Windows**: Pasang **Visual Studio C++ Build Tools** (pilih workload *Desktop development with C++*) dan `cmake`.

---

## 2. Setup Backend (Laravel 12)

### 1. Salin Repositori & Kloning
```bash
git clone https://github.com/hilal06/smart-attendanceESP32.git
cd smart-attendanceESP32
```

### 2. Salin Berkas Konfigurasi Lingkungan
```bash
cp .env.example .env
```

### 3. Konfigurasi Variabel `.env`
Buka file `.env` dan sesuaikan parameter koneksi database lokal:

```ini
APP_NAME=SmartAttend
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=smart_attendance
DB_USERNAME=root
DB_PASSWORD=

# Kunci API autentikasi internal microservice Python
API_KEY=rahasia_api_key_smartattend_123

# Kunci API Google Gemini (opsional, untuk fitur analitik naratif)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Buat Database MySQL
Masuk ke terminal MySQL dan buat database:
```sql
CREATE DATABASE smart_attendance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Pasang Dependensi PHP
```bash
composer install
```

### 6. Generate Kunci Aplikasi, Symlink Storage, dan Migrasi
```bash
# Generate encryption key
php artisan key:generate

# Wajib: tautkan storage publik untuk berkas foto profil/avatar
php artisan storage:link

# Jalankan migrasi dan seeder database (roles, permissions, dan akun bawaan)
php artisan migrate:fresh --seed
```

> **Pemberitahuan Akun Awal**:
> Perintah seeder otomatis membuat akun pengujian:
> * **Admin**: `admin@smart.com` | Password: `password123`
> * **Guru**: `teacher1@smartattend.com` | Password: `password123`
> * **Siswa**: `student1@smartattend.com` | Password: `password123`

---

## 3. Setup Frontend (React 19 & Inertia.js)

### 1. Pasang Dependensi Node.js
```bash
npm install
```

### 2. Bangun Asset Frontend
Untuk lingkungan pengembangan aktif dengan Hot Module Replacement (HMR):
```bash
npm run dev
```

Atau untuk mengompilasi bundel produksi lokal:
```bash
npm run build
```

---

## 4. Setup Microservice Pengenalan Wajah (Python)

Microservice berada di folder `python_service/`. Layanan ini bertanggung jawab memproses komputasi komparasi wajah 128D (dlib).

### 1. Masuk Direktori & Buat Lingkungan Virtual (venv)
```bash
cd python_service
python3 -m venv venv

# Aktivasi virtual environment
# Pada Linux / macOS:
source venv/bin/activate
# Pada Windows (PowerShell):
.\venv\Scripts\Activate.ps1
```

### 2. Pasang Dependensi Python
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Konfigurasi Berkas Lingkungan `.env` Python
Buat berkas `.env` di dalam folder `python_service/`:
```env
LARAVEL_API_URL=http://127.0.0.1:8000/api/attendance
API_KEY=rahasia_api_key_smartattend_123
```

> **Catatan Port**: Nilai `API_KEY` harus persis sama dengan nilai `API_KEY` pada file `.env` Laravel.

### 4. Jalankan Microservice
```bash
python app.py
```
Layanan akan aktif dan mendengarkan request pada port `5000` (`http://127.0.0.1:5000`).

---

## 5. Menjalankan Seluruh Sistem Secara Bersamaan

Buka 3 terminal terpisah untuk menjalankan alur pengembangan:

* **Terminal 1 (Laravel)**:
  ```bash
  php artisan serve
  ```
  *(Berjalan di `http://127.0.0.1:8000`)*

* **Terminal 2 (Vite HMR)**:
  ```bash
  npm run dev
  ```
  *(Berjalan di `http://127.0.0.1:5173` atau terintegrasi langsung dengan Laravel)*

* **Terminal 3 (Python Microservice)**:
  ```bash
  cd python_service
  source venv/bin/activate
  python app.py
  ```
  *(Berjalan di `http://127.0.0.1:5000`)*

Setelah ketiga layanan aktif, akses antarmuka web di peramban: `http://localhost:8000`.
