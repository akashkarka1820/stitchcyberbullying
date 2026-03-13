"""
Cyberbullying Detection Flask API
Serves predictions from the trained ML model.
Run after train_model.py has created model artifacts.
"""

import os
import re
import json
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ─── Load Model Artifacts ────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')

try:
    model = joblib.load(os.path.join(MODEL_DIR, 'model.pkl'))
    vectorizer = joblib.load(os.path.join(MODEL_DIR, 'vectorizer.pkl'))
    with open(os.path.join(MODEL_DIR, 'metrics.json'), 'r') as f:
        metrics = json.load(f)
    print("✅ Model loaded successfully!")
    print(f"   Best model: {metrics['best_model']}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("   Run train_model.py first to train the model.")
    model = None
    vectorizer = None
    metrics = None


def preprocess_text(text):
    """Clean and preprocess text (same as training)."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'#(\w+)', r'\1', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'best_model': metrics['best_model'] if metrics else None
    })


@app.route('/reload', methods=['POST'])
def reload_model():
    """Reload model artifacts from disk."""
    global model, vectorizer, metrics
    try:
        model = joblib.load(os.path.join(MODEL_DIR, 'model.pkl'))
        vectorizer = joblib.load(os.path.join(MODEL_DIR, 'vectorizer.pkl'))
        with open(os.path.join(MODEL_DIR, 'metrics.json'), 'r') as f:
            metrics = json.load(f)
        return jsonify({
            'status': 'reloaded',
            'best_model': metrics['best_model']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/predict', methods=['POST'])
def predict():
    """Analyze text for cyberbullying content."""
    if model is None or vectorizer is None:
        return jsonify({'error': 'Model not loaded. Run train_model.py first.'}), 503

    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing "text" field in request body.'}), 400

    text = data['text']
    cleaned = preprocess_text(text)

    if not cleaned:
        return jsonify({
            'prediction': 'not_cyberbullying',
            'is_cyberbullying': False,
            'confidence': 1.0,
            'original_text': text
        })

    # Vectorize and predict
    text_tfidf = vectorizer.transform([cleaned])

    # Get prediction
    prediction = model.predict(text_tfidf)[0]

    # Try to get confidence (probability)
    confidence = 0.5
    if hasattr(model, 'predict_proba'):
        proba = model.predict_proba(text_tfidf)[0]
        confidence = float(max(proba))
    elif hasattr(model, 'decision_function'):
        decision = model.decision_function(text_tfidf)[0]
        # Convert decision function to pseudo-probability using sigmoid
        import numpy as np
        confidence = float(1 / (1 + np.exp(-abs(decision))))

    is_cyberbullying = bool(prediction == 1)

    return jsonify({
        'prediction': 'cyberbullying' if is_cyberbullying else 'not_cyberbullying',
        'is_cyberbullying': is_cyberbullying,
        'confidence': round(confidence, 4),
        'original_text': text
    })


@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Return model comparison metrics."""
    if metrics is None:
        return jsonify({'error': 'Metrics not available. Run train_model.py first.'}), 503
    return jsonify(metrics)


if __name__ == '__main__':
    print("\n🚀 Starting Cyberbullying Detection API on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
