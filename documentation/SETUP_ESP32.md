# ESP32-CAM Setup Guide

This guide explains how to connect your ESP32-CAM to the Smart Attendance backend. We utilize a **Server-Side Face Recognition** approach where the ESP32 only captures and uploads frames to the Python Service.

## 1. Prerequisites
- **Hardware**: ESP32-CAM module + FTDI Programmer (USB to TTL).
- **Software**: Arduino IDE installed on your computer.

## 2. Arduino IDE Setup
1. Open Arduino IDE.
2. Go to **File > Preferences**.
3. In "Additional Boards Manager URLs", add:
   `https://dl.espressif.com/dl/package_esp32_index.json`
4. Go to **Tools > Board > Boards Manager**, search for `esp32`, and install **esp32 by Espressif Systems**.
5. Select your board: **Tools > Board > AI Thinker ESP32-CAM**.

## 3. Configure Firmware
1. Open the sketch located at `esp32-cam/CaptureAndUpload/CaptureAndUpload.ino` (or whichever folder it is located).
2. Edit the WiFi credentials in the code:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. Edit the Server URL to point to your Python Service:
   - **Local Testing**: `http://YOUR_LOCAL_IP:5000/recognize` (e.g., `http://192.168.1.100:5000/recognize`)
   - **Production**: `http://YOUR_SERVER_DOMAIN_OR_IP:5000/recognize`
   ```cpp
   String serverUrl = "http://YOUR_LOCAL_IP:5000/recognize";
   ```

## 4. Flash and Test
1. Connect the ESP32-CAM to your computer via the FTDI programmer. Remember to bridge GPIO0 to GND for programming mode.
2. Click **Upload** in the Arduino IDE.
3. Once finished, disconnect the GPIO0 bridge and press the reset button on the ESP32-CAM.
4. Open the Serial Monitor (115200 baud). You should see the ESP32 connect to WiFi and begin capturing and sending photos to your Python service!

## What's Next?
If you haven't set up the local backend servers (Laravel and Python) yet, please see the **[SETUP_LOCAL.md](SETUP_LOCAL.md)** guide.
If you are deploying for the real world, refer to the **[DEPLOYMENT.md](DEPLOYMENT.md)** guide.
