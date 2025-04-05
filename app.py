import os
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image

app = Flask(__name__)
# ✅ Allow CORS for the frontend (React)
CORS(app, resources={r"/*": {"origins": "http://localhost:5175"}})

# 🧠 Load trained model safely
model = tf.keras.models.load_model("model.keras")
print("✅ Model loaded successfully!")

# 📌 Define disease labels and solutions
DISEASE_CLASSES = ["Healthy Soil", "Fungal Infection", "Nutrient Deficiency", "Bacterial Wilt"]
SOLUTIONS = {
    "Healthy Soil": "Your soil is in good condition! Keep maintaining it.",
    "Fungal Infection": "Apply organic fungicides and improve soil drainage.",
    "Nutrient Deficiency": "Use compost and organic fertilizers to enrich the soil.",
    "Bacterial Wilt": "Rotate crops and apply antibacterial soil treatments."
}

# ✅ Ensure upload folder exists
UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# 📷 **Image Preprocessing Function**
def preprocess_image(image_path, target_size=(224, 224)):
    try:
        img = Image.open(image_path)
        img = img.convert("RGB")  # Convert grayscale & transparent images to RGB
        img = img.resize(target_size)  # Resize to model's expected input size
        img_array = np.array(img, dtype=np.float32) / 255.0  # Normalize pixel values
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension (1, 224, 224, 3)
        return img_array
    except Exception as e:
        print(f"❌ Error processing image: {e}")
        return None

@app.route('/analyze', methods=['POST'])
def analyze_soil():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty file received'}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    # ✅ Process the uploaded image
    img = preprocess_image(file_path)
    if img is None:
        return jsonify({'error': 'Failed to process image'}), 400

    # 🧠 **Make Prediction**
    prediction = model.predict(img)
    predicted_class = np.argmax(prediction[0])  
    disease_name = DISEASE_CLASSES[predicted_class]
    solution = SOLUTIONS[disease_name]

    # 🔥 Return Prediction Result
    return jsonify({'disease': disease_name, 'solution': solution})

if __name__ == '__main__':
    app.run(port=5001, debug=True)
