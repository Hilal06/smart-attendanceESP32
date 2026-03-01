import face_recognition

image_path = "/app/rejected_faces/rejected_no_face_1212.jpg"
image = face_recognition.load_image_file(image_path)
face_locations = face_recognition.face_locations(image)
print(f"HOG default model found: {len(face_locations)} faces")

if len(face_locations) == 0:
    print("Trying HOG with 2 upsamples to find smaller faces...")
    face_locations = face_recognition.face_locations(image, number_of_times_to_upsample=2, model="hog")
    print(f"HOG model (2 upsamples) found: {len(face_locations)} faces")
    
    # Try CNN model if available (might run out of memory or not supported without CUDA)
    try:
        print("Trying CNN model...")
        cnn_locations = face_recognition.face_locations(image, model="cnn")
        print(f"CNN model found: {len(cnn_locations)} faces")
    except Exception as e:
        print(f"CNN model failed: {e}")
