# SmartAttend - Project Documentation & Guides

Folder ini berisi kumpulan dokumentasi teknis, arsitektur perangkat lunak, dan panduan implementasi untuk sistem **SmartAttend**.

---

## 📑 Daftar Dokumen Teknis

| Dokumen | Deskripsi | Target Pembaca |
| :--- | :--- | :--- |
| **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** | **Dokumentasi komprehensif pengembang**: SDLC, arsitektur sistem, diagram sequence, diagram use case, skema database & ERD, spesifikasi API lengkap, struktur direktori, showcase antarmuka, dan pemeliharaan. | Seluruh Tim Pengembang |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Panduan deployment produksi menggunakan Docker Compose, Nginx reverse proxy, MariaDB, dan rotasi file log. | DevOps / SysAdmin |
| **[SETUP_LOCAL.md](SETUP_LOCAL.md)** | Panduan konfigurasi lingkungan pengembangan lokal manual tanpa Docker (PHP 8.2+, Node.js 20+, Python 3.10). | Pengembang (Backend/Frontend) |
| **[SETUP_ESP32.md](SETUP_ESP32.md)** | Panduan perakitan modul, pinout hardware trigger, mitigasi brownout, dan flashing firmware ESP32-CAM. | Teknisi Hardware / IoT |
| **[RBAC_IMPLEMENTATION_GUIDE.md](RBAC_IMPLEMENTATION_GUIDE.md)** | Dokumentasi hierarki Role-Based Access Control (Admin, Teacher, Student) dengan Spatie Permission. | Tim Pengembang Backend |
| **[FUTURE_MQTT_GUIDE.md](FUTURE_MQTT_GUIDE.md)** | Rancangan arsitektur transisi ke protokol MQTT untuk skalabilitas multi-device IoT berkapasitas besar. | Arsitek Sistem / IoT |
| **[ROADMAP.md](ROADMAP.md)** | Catatan pencapaian fitur versi 1.0 serta rencana pengembangan fitur untuk versi mendatang. | Tim Produk & Pengembang |

---

Untuk gambaran umum proyek dan petunjuk cepat, silakan merujuk ke **[Root README.md](../README.md)**.
