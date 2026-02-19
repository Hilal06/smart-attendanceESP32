# ESP32-CAM Setup Guide

This guide explains how to connect your ESP32-CAM to the SmartAttend backend.

## 1. Prerequisites

-   **Hardware**: ESP32-CAM module + FTDI Programmer (USB to TTL).
-   **Software**: Arduino IDE installed on your computer.

## 2. Arduino IDE Setup

1.  Open Arduino IDE.
2.  Go to **File > Preferences**.
3.  In "Additional Boards Manager URLs", add:
    `https://dl.espressif.com/dl/package_esp32_index.json`
4.  Go to **Tools > Board > Boards Manager**, search for `esp32`, and install **esp32 by Espressif Systems**.
5.  Select your board: **Tools > Board > AI Thinker ESP32-CAM**.

## 3. Flash the Code

We have provided a basic client sketch at `esp32-cam/SmartAttendance.ino`.

1.  Open `esp32-cam/SmartAttendance.ino` in Arduino IDE.
2.  **Edit the Configuration**:
    *   `ssid`: Your WiFi Name.
    *   `password`: Your WiFi Password.
    *   `serverUrl`: 
        *   **For Local Testing (Windows)**: Use your PC's IP address (e.g., `http://192.168.100.26:8000/api/attendance`). **Do not use localhost**.
        *   **For Production (Ubuntu Server)**: Use your Server's IP address (e.g., `http://YOUR_SERVER_IP/api/attendance`). Note: Production uses port 80/443 (default), so no port number is needed.
    *   `apiKey`: Must match the `API_KEY` in your `.env` file.
3.  Connect ESP32-CAM to PC (GPIO 0 connected to GND for flashing).
4.  Click **Upload**.
5.  Disconnect GPIO 0 from GND and press the Reset button on the ESP32.

## 4. Integrating Face Recognition

The provided code is a *client* that sends data. To enable Face Recognition:

1.  In Arduino IDE, go to **File > Examples > ESP32 > Camera > CameraWebServer**.
2.  This is a full-featured example provided by Espressif.
3.  You will need to modify that example to call our `sendAttendance()` function when a face is detected.

**Where to add the code in CameraWebServer:**
Look for the `app_httpd.cpp` file in the example. In the `recognize_face` logic, when a face is matched, you would add the HTTP request logic we provided in `SmartAttendance.ino`.

> **Note**: ESP32-CAM face recognition is basic. For an enterprise system, we recommend sending the *image* to the server and letting Python/OpenCV handle the recognition, but the current backend is designed for ID-based checking (e.g., QR Code or On-Device recognition).

## 5. Testing

1.  Open the Serial Monitor (Baud 115200).
2.  Power on the ESP32.
3.  It should connect to WiFi.
4.  It will send a test request for Employee ID `123456`.
5.  Check your Laravel logs or Dashboard—you should see the attendance recorded!

## 6. Troubleshooting

### Error Code -1 (Connection Failed)
This means the ESP32 cannot reach your computer.
1.  **Wrong IP**: Double check your PC IP (`ipconfig`).
2.  **Server Not Public**: By default, `php artisan serve` only listens on `localhost`. You **MUST** run it like this to allow outside connections:
    ```bash
    php artisan serve --host 0.0.0.0 --port 8000
    ```
3.  **Firewall**: Windows Firewall might block port 8000. Try turning it off temporarily to test.
4.  **Same Network**: Ensure your PC and ESP32 are on the *same* WiFi frequency (2.4GHz is safest for ESP32).
