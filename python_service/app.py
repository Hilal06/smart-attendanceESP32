import os
from flask import Flask, request, jsonify
from datetime import datetime
import numpy as np

# Optional: Face Recognition
try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("Warning: face_recognition library not found. Running in Capture-Only mode.")

# ==========================================
# CONFIGURATION
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KNOWN_FACES_DIR = os.path.join(BASE_DIR, "known_faces")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

app = Flask(__name__)

# Load known faces properly
known_face_encodings = []
known_face_names = []

def load_known_faces():
    if not FACE_RECOGNITION_AVAILABLE:
        return

    print("Loading known faces...")
    if not os.path.exists(KNOWN_FACES_DIR):
        os.makedirs(KNOWN_FACES_DIR)
        print(f"Created directory: {KNOWN_FACES_DIR} - Put employee images here!")
        return

    for filename in os.listdir(KNOWN_FACES_DIR):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            # Name = filename without extension (e.g., "123456.jpg" -> "123456")
            name = os.path.splitext(filename)[0]
            image_path = os.path.join(KNOWN_FACES_DIR, filename)
            
            try:
                image = face_recognition.load_image_file(image_path)
                encodings = face_recognition.face_encodings(image)
                
                if len(encodings) > 0:
                    known_face_encodings.append(encodings[0])
                    known_face_names.append(name)
                    print(f"Loaded: {name}")
                else:
                    print(f"Warning: No face found in {filename}")
            except Exception as e:
                print(f"Error loading {filename}: {e}")

# Initial Load
load_known_faces()

@app.route('/recognize', methods=['POST'])
def recognize_face():
    # 1. Handle Raw Image Data (from ESP32)
    try:
        if not request.data:
            return jsonify({"status": "error", "message": "No image data sent"}), 400

        # Save received image temporarily
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_filename = f"{UPLOAD_DIR}/capture_{timestamp}.jpg"
        
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)

        with open(temp_filename, "wb") as f:
            f.write(request.data)

        # 2. Process Image
        matched_name = "Unknown"
        
        if FACE_RECOGNITION_AVAILABLE:
            try:
                unknown_image = face_recognition.load_image_file(temp_filename)
                face_locations = face_recognition.face_locations(unknown_image)
                face_encodings = face_recognition.face_encodings(unknown_image, face_locations)

                for face_encoding in face_encodings:
                    matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
                    face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
                    
                    if len(face_distances) > 0:
                        best_match_index = np.argmin(face_distances)
                        if matches[best_match_index]:
                            matched_name = known_face_names[best_match_index]
                            break
            except Exception as e:
                print(f"Recognition Error: {e}")
        else:
            matched_name = "Recognition Disabled (Missing Lib)"

        
        print(f"[{timestamp}] Result: {matched_name}")
        
        # 3. (Optional) Forward to Laravel
        # if matched_name != "Unknown":
        #     requests.post("http://localhost:8000/api/attendance", json={"employee_id": matched_name})

        return jsonify({
            "status": "success",
            "match": matched_name,
            "timestamp": timestamp
        })

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # Run slightly accessible
    print("Starting Face Recognition Service...")
    print(f"Ensure you have images in '{KNOWN_FACES_DIR}' folder.")
    app.run(host='0.0.0.0', port=5000)
