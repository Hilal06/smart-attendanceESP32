# Roadmap Pengembangan Proyek SmartAttend

Dokumen ini memuat catatan pencapaian teknis (*completed milestones*) serta rencana pengembangan fitur untuk iterasi berikutnya.

---

## 1. Pencapaian yang Telah Selesai (Completed - Versi 1.0)

* [x] **Arsitektur Pengenalan Wajah Berbasis Microservice**:
  * Microservice Python terisolasi (Flask + Dlib HOG + OpenCV) dengan komparasi vektor 128D.
  * Caching encoding wajah ke file `.pkl` dan hot-reload otomatis saat pendaftaran profil baru.
  * Endpoint kesehatan real-time (`/health`) untuk memantau status engine dan jumlah profil wajah yang aktif.
* [x] **Integrasi Hardware ESP32-CAM**:
  * Implementasi pemicu perangkat keras (*hardware trigger* via GPIO 13) menggunakan sensor PIR / tombol fisik guna mencegah pemborosan bandwidth dan saturasi jaringan.
  * Penonaktifan detektor brownout terprogram untuk mencegah watchdog reset saat konsumsi daya WiFi memuncak.
* [x] **Keamanan & Reverse Proxy**:
  * Penempatan container Python di belakang reverse proxy Nginx (port 80/443).
  * Proteksi pertukaran data internal dengan token autentikasi rahasia (`X-API-KEY`).
* [x] **Sistem Perhitungan Keterlambatan Dinamis**:
  * Perhitungan keterlambatan otomatis berdasarkan hari aktif (`weekly_schedule`) dan batas toleransi menit (`late_threshold_minutes`).
* [x] **Revamp Antarmuka & Multi-Varian Dashboard**:
  * 5 varian dashboard spesifik peran (*Academic Studio*, *Command Center*, *Nordic Minimal*, *Kiosk Monitor*, *Status Workspace*).
  * Palet tema dinamis (`data-color-theme`) dengan dukungan mode gelap berkontras tinggi (WCAG AA).
  * Notifikasi toast modern dengan Sonner, indikator kekuatan sandi zxcvbn, dan dialog yang ramah aksesibilitas.
* [x] **Analitik AI Generatif (Gemini AI)**:
  * Integrasi model Google GenAI (`@google/genai`) untuk analisis naratif tren absensi dan anomali kehadiran.
* [x] **Sistem Otorisasi Multi-Tingkat (RBAC)**:
  * Implementasi Spatie Laravel Permission untuk peran Admin, Guru, dan Siswa.

---

## 2. Rencana Jangka Menengah (Next Phase - Versi 1.1)

* [ ] **Ekspor Laporan Multiformat**:
  * Pembuatan endpoint backend untuk mengunduh laporan kehadiran dalam format CSV, Microsoft Excel (.xlsx), dan PDF terformat.
* [ ] **Manajemen Jadwal Libur Khusus**:
  * Kalender libur nasional dan cuti bersama terintegrasi ke dalam evaluasi kehadiran harian.
* [ ] **Sistem Backup Database Terotomatisasi**:
  * Penambahan container backup terjadwal (cron) untuk mengekspor database MariaDB setiap hari ke direktori `./storage/backups`.
* [ ] **Pemberitahuan Telegram / WhatsApp Bot**:
  * Notifikasi instan kepada orang tua / wali siswa saat siswa berhasil check-in atau terlambat.

---

## 3. Rencana Jangka Panjang (Future Vision - Versi 2.0)

* [ ] **Transisi ke Protokol MQTT (Pub/Sub IoT)**:
  * Penerapan broker Mosquitto untuk komunikasi event-driven berlatensi sangat rendah bagi jaringan multi-perangkat ESP32.
* [ ] **Aplikasi Mobile Wali Murid / Siswa**:
  * Aplikasi Android/iOS berbasis Flutter atau React Native untuk pemantauan kehadiran mandiri dan pengajuan izin digital.
* [ ] **Face Anti-Spoofing / Liveness Detection**:
  * Deteksi keaktifan biologis (kedipan mata atau analisis tekstur inframerah) untuk mencegah spoofing menggunakan foto cetak atau layar ponsel.
