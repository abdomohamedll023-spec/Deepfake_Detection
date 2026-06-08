import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import io
try:
    import torch
    import torch.nn as nn
    from torchvision import models, transforms
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("[WARNING] PyTorch or TorchVision is not installed! Running in Mock Mode.")

from flask import Flask, request, jsonify, render_template
try:
    from flask_cors import CORS
    CORS_AVAILABLE = True
except ImportError:
    CORS_AVAILABLE = False
    print("[WARNING] flask_cors is not installed! CORS is disabled.")

from werkzeug.utils import secure_filename
from PIL import Image

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')
if CORS_AVAILABLE:
    CORS(app)  # Enable CORS so users can test by double-clicking index.html

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Basic Security Settings
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Limit upload to 16 MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==============================================================================
# MODEL LOADING SECTION
# ==============================================================================
# We define the model architecture exactly as in the notebook.
# We do not modify the original `.ipynb` file.

if TORCH_AVAILABLE:
    def get_resnet50_model():
        """
        Initializes the ResNet50 model with the modified fully connected layer
        used during training.
        """
        # Load base ResNet50
        model = models.resnet50(weights=None)
        
        # Modify the fully connected (FC) layer to match training architecture
        num_ftrs = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Linear(num_ftrs, 1024),
            nn.BatchNorm1d(1024),
            nn.LeakyReLU(),
            nn.Dropout(0.5),

            nn.Linear(1024, 512),
            nn.BatchNorm1d(512),
            nn.LeakyReLU(),
            nn.Dropout(0.5),

            nn.Linear(512, 1),
            nn.Sigmoid()
        )
        return model

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = get_resnet50_model()

    # We load the model weights ONLY once when the server starts
    # Ensure your trained model file is named 'deepfake_model_150px.pth' or 'best_resnet50.pth'
    # and placed in the same directory as app.py
    MODEL_PATH = "deepfake_model_150px.pth" 

    if os.path.exists(MODEL_PATH):
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        print(f"[INFO] Model loaded successfully from {MODEL_PATH}")
    else:
        print(f"[WARNING] {MODEL_PATH} not found. Ensure the .pth file is in the root directory.")

    model = model.to(device)
    model.eval()  # Set model to evaluation mode

    # ==============================================================================
    # PREPROCESSING
    # ==============================================================================
    # Transformation strictly matches testing parameters:
    # 1. Resize to (112, 112)
    # 2. Convert to Tensor
    test_transform = transforms.Compose([
        transforms.Resize((112, 112)),
        transforms.ToTensor(),
    ])

# ==============================================================================
# ROUTES
# ==============================================================================

@app.route('/')
def index():
    """Renders the minimal frontend UI."""
    return render_template('index.html')

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    """Handles image upload and returns prediction as JSON."""
    if request.method == 'OPTIONS':
        return '', 204

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded.'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected.'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Please upload JPG or PNG.'}), 400
        
    try:
        # Secure filename
        filename = secure_filename(file.filename)
        
        # Read image
        image_bytes = file.read()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        if not TORCH_AVAILABLE:
            import random
            import time
            time.sleep(1)  # Simulate processing time
            output = random.uniform(0.1, 0.9)
            prediction = "Real" if output > 0.5 else "Fake"
            confidence = output if prediction == "Real" else (1.0 - output)
            return jsonify({
                'prediction': prediction,
                'confidence': round(confidence * 100, 2),
                'filename': filename,
                'warning': 'Mock mode - PyTorch not installed'
            })
            
        # Preprocess
        img_tensor = test_transform(img).unsqueeze(0).to(device)
        
        # Inference
        with torch.no_grad():
            output = model(img_tensor).item()
            
        # Mathematically correct mapping based on notebook: 1 -> Real, 0 -> Fake
        prediction = "Real" if output > 0.5 else "Fake"
        confidence = output if prediction == "Real" else (1.0 - output)
        
        return jsonify({
            'prediction': prediction,
            'confidence': round(confidence * 100, 2),
            'filename': filename
        })
        
    except Exception as e:
        return jsonify({'error': f'Server failed to process the image: {str(e)}'}), 500

if __name__ == '__main__':
    print("[INFO] Starting Flask API...")
    app.run(host='0.0.0.0', port=5000, debug=True)
