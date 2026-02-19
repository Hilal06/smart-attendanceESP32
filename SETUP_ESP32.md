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

## 3. Next Steps

We have migrated to a **Server-Side Face Recognition** approach for better performance.

Please proceed to **[SERVER_SIDE_RECOGNITION.md](SERVER_SIDE_RECOGNITION.md)** for instructions on:
1.  Flashing the new firmware (`esp32-cam/CaptureAndUpload.ino`).
2.  Setting up the Python Recognition Service.
3.  Testing the system.
