#ifndef CONFIG_H
#define CONFIG_H

// ==========================================
// 1. WIFI & SERVER CONFIGURATION
// ==========================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// REPLACE with your Python Service IP (Local Windows IP) or Docker host
const char* serverUrl = "http://192.168.100.73/recognize"; 

// ==========================================
// 2. HARDWARE TRIGGER CONFIGURATION
// ==========================================
// Pin connected to PIR sensor or push button
#define TRIGGER_PIN 13

#endif
