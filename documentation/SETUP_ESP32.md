# Panduan Setup Perangkat Keras ESP32-CAM

Dokumen ini memuat instruksi teknis perakitan, konfigurasi firmware, dan pengujian modul ESP32-CAM untuk sistem presensi biometrik SmartAttend.

---

## 1. Spesifikasi Perangkat Keras

* **Modul Mikrokontroler**: AI-Thinker ESP32-CAM (terintegrasi modul kamera OV2640 dan slot microSD).
* **Modul Programmer**: USB to TTL FTDI FT232RL (atau modul ESP32-CAM-MB programmer base).
* **Sensor Pemicu (Hardware Trigger)**:
  * Sensor PIR HC-SR501 / AM312, atau
  * Tombol tekan fisik (tactile push-button switch).
* **Catu Daya**: Adaptor DC 5V 2A stabil (ESP32-CAM membutuhkan arus puncak hingga 500mA saat transmisi WiFi dan lampu flash aktif).
* **Kabel Jumper**: Female-to-Female dan Male-to-Female.

---

## 2. Skema Pengkabelan (Wiring Diagram)

### Mode Pemrograman (Flashing Mode)
Gunakan modul FTDI USB to TTL:

| Pin FTDI | Pin ESP32-CAM | Catatan |
| :--- | :--- | :--- |
| **VCC (5V)** | **5V** | Pastikan jumper FTDI di posisi 5V, bukan 3.3V |
| **GND** | **GND** | Ground bersama |
| **TXD** | **U0R (GPIO 3)** | Transmit data ke Receive ESP32 |
| **RXD** | **U0T (GPIO 1)** | Receive data dari Transmit ESP32 |
| **-** | **GPIO 0 -> GND** | **Hubungkan pin GPIO 0 ke GND sebelum menyalakan daya untuk masuk mode flashing** |

### Mode Operasi Normal & Hardware Trigger
Lepaskan jumper GPIO 0 dari GND setelah upload selesai. Pasang modul pemicu ke pin trigger:

| Komponen | Pin Komponen | Pin ESP32-CAM |
| :--- | :--- | :--- |
| **Sensor PIR / Tombol** | VCC | 5V / 3.3V |
| **Sensor PIR / Tombol** | GND | GND |
| **Sensor PIR / Tombol** | Output / Signal | **GPIO 13** (`TRIGGER_PIN`) |

---

## 3. Konfigurasi Lingkungan Arduino IDE

1. Buka **Arduino IDE** (versi 2.x disarankan).
2. Navigasi ke **File > Preferences**.
3. Pada kolom **Additional Boards Manager URLs**, tambahkan URL paket board ESP32:
   ```text
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. Buka **Tools > Board > Boards Manager**, cari `esp32`, lalu pasang versi stabil terbaru dari **Espressif Systems**.
5. Pilih konfigurasi board pada menu **Tools**:
   * **Board**: `AI Thinker ESP32-CAM`
   * **CPU Frequency**: `240MHz (WiFi/BT)`
   * **Flash Frequency**: `80MHz`
   * **Flash Mode**: `QIO`
   * **Partition Scheme**: `Huge APP (3MB No OTA/1MB SPIFFS)`
   * **Port**: Sesuaikan dengan port COM / `/dev/ttyUSB0` modul FTDI.

---

## 4. Konfigurasi Firmware Proyek

Firmware ESP32-CAM berada di direktori `esp32-cam/`:
* `esp32-cam/CaptureAndUpload.ino` (logika inisialisasi kamera, koneksi WiFi, interrupt, dan HTTP POST buffer).
* `esp32-cam/Config.h` (kredensial WiFi, endpoint server, dan nomor pin pemicu).

Buka `esp32-cam/Config.h` lalu sesuaikan variabel konfigurasi:

```cpp
#ifndef CONFIG_H
#define CONFIG_H

// 1. Kredensial WiFi
const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

// 2. Alamat Endpoint Server Presensi
// Development lokal: gunakan IP komputer host port 5000 jika tanpa Docker
// Docker production / dev: arahkan ke host Nginx (port 80)
const char* serverUrl = "http://192.168.1.100/recognize";

// 3. Konfigurasi Pin Pemicu Perangkat Keras
#define TRIGGER_PIN 13

#endif
```

---

## 5. Proteksi Brownout & Manajemen Daya

Pada `CaptureAndUpload.ino`, proteksi brownout detektor dinonaktifkan secara terprogram:

```cpp
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

void setup() {
  // Nonaktifkan detektor brownout untuk mencegah reset mendadak saat lonjakan daya transmisi WiFi
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  ...
}
```

Hal ini diperlukan karena sensor kamera OV2640 bersama modem radio WiFi sering menarik daya mendadak yang dapat memicu watchdog reset pada catu daya USB komputer standar.

---

## 6. Prosedur Flashing dan Verifikasi

1. Pastikan pin **GPIO 0 terhubung ke GND**.
2. Hubungkan modul FTDI ke port USB komputer.
3. Tekan tombol **RST (Reset)** pada modul ESP32-CAM sekali.
4. Klik tombol **Upload** di Arduino IDE.
5. Tunggu hingga proses upload menampilkan status `Leaving... Hard resetting via RTS pin...` (100%).
6. **Cabut jumper GPIO 0 dari GND**.
7. Buka **Tools > Serial Monitor**, ubah baud rate menjadi `115200`.
8. Tekan tombol **RST** pada ESP32-CAM sekali lagi.
9. Amati log serial. Perangkat akan menampilkan status:
   ```text
   WiFi Connected
   Camera init success
   ```
10. Ketika sensor di pin 13 terpicu, log akan menampilkan:
    ```text
    Trigger detected! Capturing photo...
    Server Response: {"status":"success","data":{"id":"123456-2026-10-12",...}}
    ```
