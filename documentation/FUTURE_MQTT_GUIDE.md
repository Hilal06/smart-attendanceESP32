# Future Implementation: MQTT for ESP32-CAM

This guide outlines how to migrate from HTTP Polling to **MQTT Pub/Sub** for real-time attendance tracking.

## 1. Why Switch to MQTT?

### Pros
-   **Low Bandwidth**: Sends tiny packets, ideal for slow/unstable WiFi.
-   **Real-Time**: Push-based model (Server reacts instantly).
-   **Reliable**: Built-in Quality of Service (QoS) ensures message delivery.

### Cons (Infrastructure Complexity)
-   Requires a **Broker** (Mosquitto) service running 24/7.
-   Requires a **Worker Process** (Laravel Command) running permanently to listen for messages.

---

## 2. Implementation Plan

### Step A: Update `docker-compose.prod.yml`
Add the Mosquitto broker service.

```yaml
  mosquitto:
    image: eclipse-mosquitto
    restart: always
    ports:
      - "1883:1883"
    volumes:
      - ./docker/mosquitto/config:/mosquitto/config
      - ./docker/mosquitto/data:/mosquitto/data
      - ./docker/mosquitto/log:/mosquitto/log
    networks:
      - smart-attendance-network
```

### Step B: Backend (Laravel) Setup

1.  **Install PHP MQTT Library**:
    ```bash
    composer require php-mqtt/client
    ```

2.  **Create a Listen Command**:
    Create `app/Console/Commands/MqttListen.php`. This script will run forever, waiting for messages on the topic `attendance/checkin`.

    ```php
    public function handle()
    {
        $mqtt = new \PhpMqtt\Client\MqttClient('mosquitto', 1883, 'laravel-client');
        $mqtt->connect();
        
        $mqtt->subscribe('attendance/checkin', function ($topic, $message) {
            $data = json_decode($message, true);
            $this->processAttendance($data['employee_id']);
        }, 0);

        $mqtt->loop(true);
    }
    ```

3.  **Run as Daemon (Supervisor)**:
    You must use Supervisor to keep `php artisan mqtt:listen` running in the background.

### Step C: ESP32-CAM (Arduino) Setup

1.  **Install Library**: `PubSubClient` by Nick O'Leary.
2.  **Update `SmartAttendance.ino`**:
    -   Connect to WiFi.
    -   Connect to MQTT Broker (`192.168.1.X`, Port `1883`).
    -   Publish detection event:
        ```cpp
        client.publish("attendance/checkin", "{\"employee_id\": \"123456\"}");
        ```

---

## 3. Deployment Considerations
-   **Security**: Use TLS/SSL for MQTT if exposing it over the internet (Port 8883).
-   **Auth**: Configure Mosquitto with a username/password file.
