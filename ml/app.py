"""
app.py — Flask ML Prediction API
Serves risk predictions and cluster classifications for the
Digital Minimalism Analyzer.

Endpoints:
  GET  /health          — health check
  POST /predict         — predict risk level from usage features
  POST /predict/batch   — batch predict for multiple users
  GET  /model/info      — model metadata
  POST /cluster         — K-Means cluster assignment only
"""

import os
import json
import numpy as np
import joblib

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')

# ── Feature list (must match training) ────────────────────────────────────────
FEATURES = [
    'avg_daily_minutes',
    'night_usage_count',
    'unique_apps',
    'total_sessions',
    'social_media_pct',
    'morning_sessions',
    'evening_sessions',
    'max_single_session',
]

RISK_LABELS = {0: 'Low', 1: 'Medium', 2: 'High'}
CLUSTER_LABELS = {0: 'Mindful User', 1: 'Moderate User', 2: 'Heavy User'}

# ── Model loading ──────────────────────────────────────────────────────────────
lr_model = None
km_bundle = None
metadata = {}


def load_models():
    global lr_model, km_bundle, metadata

    lr_path = os.path.join(MODEL_DIR, 'logistic_regression.pkl')
    km_path = os.path.join(MODEL_DIR, 'kmeans.pkl')
    meta_path = os.path.join(MODEL_DIR, 'metadata.json')

    if os.path.exists(lr_path):
        lr_model = joblib.load(lr_path)
        print("✅ Loaded: Logistic Regression")
    else:
        print("⚠️  logistic_regression.pkl not found — run train.py first")

    if os.path.exists(km_path):
        km_bundle = joblib.load(km_path)
        print("✅ Loaded: K-Means bundle")
    else:
        print("⚠️  kmeans.pkl not found — run train.py first")

    if os.path.exists(meta_path):
        with open(meta_path) as f:
            metadata = json.load(f)


load_models()


# ── Helpers ────────────────────────────────────────────────────────────────────
def rule_based_score(data: dict) -> dict:
    """Fallback rule-based risk scoring when models aren't loaded."""
    score = 0
    avg = data.get('avg_daily_minutes', 0)
    night = data.get('night_usage_count', 0)
    apps = data.get('unique_apps', 0)

    if avg > 240:  score += 40
    elif avg > 120: score += 20
    if night > 5:  score += 25
    elif night > 2: score += 12
    if apps > 7:   score += 15

    score = min(100, score)
    level = 'High' if score >= 60 else 'Medium' if score >= 30 else 'Low'
    cluster = 'Heavy User' if score >= 60 else 'Moderate User' if score >= 30 else 'Mindful User'

    return {
        'risk_score': score,
        'risk_level': level,
        'cluster': cluster,
        'source': 'rule-based',
        'confidence': None,
    }


def extract_features(data: dict) -> list:
    """Extract feature vector from request data with defaults."""
    avg = data.get('avg_daily_minutes', 0)
    return [
        float(data.get('avg_daily_minutes', 0)),
        float(data.get('night_usage_count', 0)),
        float(data.get('unique_apps', 3)),
        float(data.get('total_sessions', 10)),
        float(data.get('social_media_pct', 30)),
        float(data.get('morning_sessions', 2)),
        float(data.get('evening_sessions', 3)),
        float(data.get('max_single_session', avg * 0.4)),
    ]


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'models_loaded': {
            'logistic_regression': lr_model is not None,
            'kmeans': km_bundle is not None,
        },
        'message': 'Digital Minimalism ML API running',
    })


@app.route('/model/info', methods=['GET'])
def model_info():
    return jsonify({
        'metadata': metadata,
        'features': FEATURES,
        'classes': list(RISK_LABELS.values()),
        'endpoints': ['/predict', '/predict/batch', '/cluster', '/health'],
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict risk level for a single user.
    Body (JSON):
      avg_daily_minutes  float  required
      night_usage_count  int    required
      unique_apps        int    optional (default 3)
      total_sessions     int    optional (default 10)
      social_media_pct   float  optional (default 30)
      morning_sessions   int    optional
      evening_sessions   int    optional
      max_single_session float  optional
    """
    data = request.get_json(force=True) or {}

    if 'avg_daily_minutes' not in data:
        return jsonify({'error': 'avg_daily_minutes is required'}), 400

    # Fallback if models not loaded
    if lr_model is None or km_bundle is None:
        return jsonify(rule_based_score(data))

    try:
        features = np.array([extract_features(data)])

        # Logistic Regression prediction
        lr_pred = int(lr_model.predict(features)[0])
        lr_proba = lr_model.predict_proba(features)[0]
        risk_level = RISK_LABELS[lr_pred]
        confidence = float(lr_proba[lr_pred])

        # Risk score: weighted sum of probabilities
        risk_score = int(lr_proba[0] * 20 + lr_proba[1] * 50 + lr_proba[2] * 90)

        # K-Means cluster
        scaler = km_bundle['scaler']
        kmeans = km_bundle['kmeans']
        cluster_map = km_bundle['cluster_map']
        X_scaled = scaler.transform(features)
        cluster_id = int(kmeans.predict(X_scaled)[0])
        cluster_label = cluster_map.get(cluster_id, CLUSTER_LABELS.get(cluster_id, 'Unknown'))

        return jsonify({
            'risk_level': risk_level,
            'risk_score': risk_score,
            'confidence': round(confidence, 4),
            'probabilities': {
                'Low': round(float(lr_proba[0]), 4),
                'Medium': round(float(lr_proba[1]), 4),
                'High': round(float(lr_proba[2]), 4),
            },
            'cluster': cluster_label,
            'cluster_id': cluster_id,
            'source': 'ml',
            'features_used': dict(zip(FEATURES, extract_features(data))),
        })

    except Exception as e:
        app.logger.error(f"Prediction error: {e}")
        return jsonify(rule_based_score(data))


@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """
    Batch predict for multiple users.
    Body: { "users": [ {...}, {...} ] }
    """
    data = request.get_json(force=True) or {}
    users = data.get('users', [])

    if not users:
        return jsonify({'error': 'users array is required'}), 400
    if len(users) > 100:
        return jsonify({'error': 'Maximum 100 users per batch'}), 400

    results = []
    for user in users:
        if lr_model is None:
            results.append(rule_based_score(user))
        else:
            try:
                features = np.array([extract_features(user)])
                pred = int(lr_model.predict(features)[0])
                proba = lr_model.predict_proba(features)[0]
                risk_score = int(proba[0] * 20 + proba[1] * 50 + proba[2] * 90)
                results.append({
                    'risk_level': RISK_LABELS[pred],
                    'risk_score': risk_score,
                    'confidence': round(float(proba[pred]), 4),
                    'source': 'ml',
                })
            except Exception:
                results.append(rule_based_score(user))

    return jsonify({'count': len(results), 'predictions': results})


@app.route('/cluster', methods=['POST'])
def cluster_only():
    """
    Return just the K-Means cluster assignment.
    Body: same as /predict
    """
    data = request.get_json(force=True) or {}

    if km_bundle is None:
        score = rule_based_score(data)
        return jsonify({'cluster': score['cluster'], 'source': 'rule-based'})

    try:
        features = np.array([extract_features(data)])
        X_scaled = km_bundle['scaler'].transform(features)
        cluster_id = int(km_bundle['kmeans'].predict(X_scaled)[0])
        cluster_label = km_bundle['cluster_map'].get(cluster_id, 'Unknown')
        return jsonify({
            'cluster_id': cluster_id,
            'cluster': cluster_label,
            'source': 'kmeans',
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"🧠  ML API starting on http://localhost:{port}")
    print(f"    Models loaded: LR={lr_model is not None}, KMeans={km_bundle is not None}")
    print(f"    If models missing — run: python train.py")
    app.run(host='0.0.0.0', port=port, debug=True)
