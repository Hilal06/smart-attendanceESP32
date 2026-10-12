import os
from flask import Flask, request, jsonify
from datetime import datetime
import numpy as np
import urllib.request
import json
import shutil
import pickle
import io

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

# Laravel API Config
from dotenv import load_dotenv
load_dotenv()

# In Docker, this will be "http://webserver/api/attendance"
# In Local, it defaults to "http://127.0.0.1:8000/api/attendance"
LARAVEL_API_URL = os.environ.get("LARAVEL_API_URL", "http://127.0.0.1:8000/api/attendance")
API_KEY = os.environ.get("API_KEY", "1234567890")

app = Flask(__name__)

# Load known faces properly
known_face_encodings = []
known_face_names = []

def load_known_faces():
    global known_face_encodings, known_face_names
    if not FACE_RECOGNITION_AVAILABLE:
        return

    print("Loading known faces...")
    cache_file = os.path.join(KNOWN_FACES_DIR, "encodings_cache.pkl")
    
    if not os.path.exists(KNOWN_FACES_DIR):
        os.makedirs(KNOWN_FACES_DIR)
        print(f"Created directory: {KNOWN_FACES_DIR} - Put profile images here!")
        return

    # Check if cache exists and is newer than all images
    use_cache = False
    if os.path.exists(cache_file):
        cache_mtime = os.path.getmtime(cache_file)
        use_cache = True
        for filename in os.listdir(KNOWN_FACES_DIR):
            if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                if os.path.getmtime(os.path.join(KNOWN_FACES_DIR, filename)) > cache_mtime:
                    use_cache = False
                    break
                    
    if use_cache:
        try:
            with open(cache_file, 'rb') as f:
                data = pickle.load(f)
                known_face_encodings.clear()
                known_face_names.clear()
                known_face_encodings.extend(data['encodings'])
                known_face_names.extend(data['names'])
            print(f"Loaded {len(known_face_names)} faces from cache.")
            return
        except Exception as e:
            print(f"Failed to load cache: {e}. Rebuilding...")

    known_face_encodings.clear()
    known_face_names.clear()

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

    # Save cache
    try:
        with open(cache_file, 'wb') as f:
            pickle.dump({'encodings': known_face_encodings, 'names': known_face_names}, f)
        print("Saved encodings to cache.")
    except Exception as e:
        print(f"Failed to save cache: {e}")

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

        # Enforce upload limit: If > 15 images, delete oldest 10
        try:
            files = [os.path.join(UPLOAD_DIR, f) for f in os.listdir(UPLOAD_DIR) if os.path.isfile(os.path.join(UPLOAD_DIR, f))]
            if len(files) > 15:
                # Sort files by creation/modification time (oldest first)
                files.sort(key=os.path.getmtime)
                # Delete the oldest 10 files
                files_to_delete = files[:10]
                for file_path in files_to_delete:
                    os.remove(file_path)
                print(f"Cleanup: Deleted {len(files_to_delete)} old images to respect the 15-file limit.")
        except Exception as cleanup_error:
            print(f"Warning: Failed to cleanup uploads directory: {cleanup_error}")

        # 2. Process Image
        matched_name = "Unknown"
        
        if FACE_RECOGNITION_AVAILABLE:
            try:
                # Process directly from memory
                image_stream = io.BytesIO(request.data)
                unknown_image = face_recognition.load_image_file(image_stream)
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

        # 3. Forward to Laravel
        if matched_name != "Unknown" and matched_name != "Recognition Disabled (Missing Lib)":
            try:
                print(f"Logging attendance for {matched_name}...")
                
                req_data = json.dumps({"profile_id": matched_name}).encode('utf-8')
                req_headers = {
                    "Content-Type": "application/json",
                    "X-API-KEY": API_KEY
                }
                
                req = urllib.request.Request(LARAVEL_API_URL, data=req_data, headers=req_headers, method='POST')
                with urllib.request.urlopen(req) as response:
                    res_body = response.read().decode('utf-8')
                    print(f"Laravel Response: {response.status} - {res_body}")
            except Exception as e:
                print(f"Failed to contact Laravel: {e}")

        
        # 3. (Optional) Forward to Laravel
        # if matched_name != "Unknown":
        #     requests.post("http://localhost:8000/api/attendance", json={"profile_id": matched_name})

        return jsonify({
            "status": "success",
            "match": matched_name,
            "timestamp": timestamp
        })


    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/register_face', methods=['POST'])
def register_face():
    try:
        if 'profile_id' not in request.form:
            return jsonify({"status": "error", "message": "Missing profile_id"}), 400
        
        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "Missing file"}), 400
            
        profile_id = request.form['profile_id']
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"status": "error", "message": "No selected file"}), 400
            
        if file and (file.filename.lower().endswith(('.jpg', '.jpeg', '.png'))):
            if not os.path.exists(KNOWN_FACES_DIR):
                os.makedirs(KNOWN_FACES_DIR)
                
            # Save as ID.jpg
            filename = f"{profile_id}.jpg"
            file_path = os.path.join(KNOWN_FACES_DIR, filename)
            
            file.save(file_path)
            
            # --- NEW: Verify face exists in the image ---
            if FACE_RECOGNITION_AVAILABLE:
                try:
                    loaded_image = face_recognition.load_image_file(file_path)
                    face_locations = face_recognition.face_locations(loaded_image)
                    
                    if len(face_locations) == 0:
                        # No face found! Move to rejected_faces for debugging
                        rejected_path = os.path.join(BASE_DIR, "rejected_faces", f"rejected_no_face_{profile_id}.jpg")
                        shutil.copy2(file_path, rejected_path)
                        os.remove(file_path)
                        return jsonify({"status": "error", "message": "No face detected in the image. Please provide a clearer photo."}), 400
                    elif len(face_locations) > 1:
                        # Multiple faces found
                        rejected_path = os.path.join(BASE_DIR, "rejected_faces", f"rejected_multi_face_{profile_id}.jpg")
                        shutil.copy2(file_path, rejected_path)
                        os.remove(file_path)
                        return jsonify({"status": "error", "message": "Multiple faces detected. Please provide a photo with only one person."}), 400
                except Exception as eval_e:
                    os.remove(file_path)
                    return jsonify({"status": "error", "message": f"Failed to process image for face detection: {eval_e}"}), 400
            # --- END NEW ---

            # Reload known faces to include the new/updated one
            global known_face_encodings, known_face_names
            known_face_encodings = []
            known_face_names = []
            load_known_faces()
            
            return jsonify({"status": "success", "message": f"Face registered for {profile_id}"})
        else:
            return jsonify({"status": "error", "message": "Invalid file type. Only jpg, jpeg, png allowed."}), 400

    except Exception as e:
        print(f"Error registering face: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/reload', methods=['GET', 'POST'])
def reload_faces():
    global known_face_encodings, known_face_names
    known_face_encodings = []
    known_face_names = []
    load_known_faces()
    return jsonify({
        "status": "success", 
        "message": f"Reloaded {len(known_face_names)} faces",
        "faces": known_face_names
    })

@app.route('/health', methods=['GET'])
def health_check():
    status = "online" if FACE_RECOGNITION_AVAILABLE else "offline"
    return jsonify({
        "status": status,
        "loaded_faces_count": len(known_face_names),
        "face_rec_available": FACE_RECOGNITION_AVAILABLE
    }), 200

if __name__ == '__main__':
    # Run slightly accessible
    print("Starting Face Recognition Service...")
    print(f"Ensure you have images in '{KNOWN_FACES_DIR}' folder.")
    app.run(host='0.0.0.0', port=5000)
