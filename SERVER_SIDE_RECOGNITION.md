# Server-Side Face Recognition Guide

This guide explains how to switch your ESP32-CAM to a "Capture Only" mode and handle Face Recognition on your computer (Server-Side).

## 1. Architecture
*   **ESP32-CAM**: Takes a photo -> Uploads to Python Service.
*   **Python Service**: Receives photo -> Compares with known faces -> Returns result.

## 2. Setup ESP32-CAM
1.  Open `esp32-cam/CaptureAndUpload.ino`.
2.  Edit `ssid` and `password`.
3.  Edit `serverUrl`:
*   **Local Testing**: `http://YOUR_PC_IP:5000/recognize` (e.g., `http://192.168.100.26:5000/recognize`)
4.  Upload to ESP32.

## 3. Setup Python Service (Local Windows)

### Prerequisites
You need **Python** installed.
You also need **Visual Studio C++ Build Tools** (required for `dlib` library). If `pip install` fails later, this is usually why.

### Installation

1.  Open Command Prompt in `smart-attendanceESP32/python_service`.2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

**Troubleshooting Installation Issues:**

*   **Error: `ModuleNotFoundError: No module named 'flask'`**
    This means the requirements file failed. Install manually:
    ```bash
    pip install flask requests numpy
    ```

*   **Error: `face_recognition` fails to install**
    This library requires C++ compilation.
    1.  Ensure **Visual Studio C++ Build Tools** are installed on your Windows.
    2.  Install CMake: `pip install cmake`
    3.  Try again: `pip install --no-cache-dir face_recognition`

*   **"Running in Capture-Only Mode"**
    If you see this warning when running the app, it means `face_recognition` is missing. **This is okay for testing!** The server will still receive images from the ESP32 and save them to `uploads/`. You can fix the library installation later.

### Configuration
1.  Create a folder named `known_faces` inside `python_service/`.
2.  Add photos of your employees.
    *   **Naming Rule**: The filename MUST be the Employee ID.
    *   Example: `123456.jpg`, `EMP001.png`.

### Run the Server
```bash
python app.py
```
It will start listening on Port 5000.

## 4. Testing
1.  Power on ESP32-CAM.
2.  Watch the Python console.
3.  When ESP32 takes a photo, you should see:
    ```
    [20260219_140000] Result: 123456
    ```
    OR
    ```
    [20260219_140000] Result: Unknown
    ```

## 5. Connecting to Backend (Future)
Currently, `app.py` just prints the result. To automatically log attendance to Laravel:
1.  Uncomment the "Forward to Laravel" section in `app.py`.
2.  Update the URL to point to your `php artisan serve` address.
