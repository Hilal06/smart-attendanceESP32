#include <WiFi.h>
#include <HTTPClient.h>

// ==========================================
// 1. NETWORK CONFIGURATION
// ==========================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ==========================================
// 2. SERVER CONFIGURATION
// ==========================================
// REPLACE with your computer/server IP address. 
// Do not use 'localhost' because ESP32 is a separate device.
const char* serverUrl = "http://192.168.1.X:8000/api/attendance"; 
const char* apiKey = "secret_esp32_key"; // Must match API_KEY in your .env

// ==========================================
// 3. MAIN SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  Serial.println();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());

  // Wait a bit
  delay(2000);

  // Example: Send a test attendance check-in
  // In a real face recognition code, you would call this 
  // function when a face ID is recognized.
  Serial.println("Sending test attendance...");
  sendAttendance("123456"); 
}

void loop() {
  // Put your Face Recognition loop here.
  // When a face is recognized:
  // sendAttendance(recognizedFaceId);
  
  delay(10000); // Wait 10 seconds before next loop
}

// ==========================================
// 4. FUNCTION TO SEND DATA
// ==========================================
void sendAttendance(String employeeId) {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    Serial.println("Connecting to server...");
    http.begin(serverUrl);
    
    // Set Headers
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-KEY", apiKey); // Critical for security

    // JSON Payload
    String jsonPayload = "{\"employee_id\": \"" + employeeId + "\"}";
    
    // POST Request
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      Serial.println("Server Reply: " + response);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }
}
