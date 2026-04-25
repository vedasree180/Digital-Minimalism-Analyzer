"""
train.py — ML Model Training for Digital Minimalism Analyzer
Trains:
  1. K-Means Clustering (unsupervised behavior grouping)
  2. Logistic Regression (risk level classification)
Saves both models to disk for serving via Flask API.
"""

import os
import numpy as np
import pandas as pd
import joblib
import json
from sklearn.cluster import KMeans
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, confusion_matrix,
    accuracy_score, silhouette_score
)
from sklearn.pipeline import Pipeline

# ── Config ────────────────────────────────────────────────────────────────────
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

MODEL_DIR = 'models'
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs('data', exist_ok=True)


# ── Data generation (inline, no file dependency) ──────────────────────────────
def _make_profile(user_type, rng):
    if user_type == 'low':
        avg = rng.uniform(30, 120)
        night = rng.integers(0, 3)
        apps = rng.integers(2, 5)
        sess = rng.integers(5, 16)
        sm = rng.uniform(10, 30)
    elif user_type == 'medium':
        avg = rng.uniform(120, 240)
        night = rng.integers(2, 6)
        apps = rng.integers(4, 8)
        sess = rng.integers(15, 36)
        sm = rng.uniform(30, 55)
    else:
        avg = rng.uniform(240, 480)
        night = rng.integers(5, 16)
        apps = rng.integers(6, 13)
        sess = rng.integers(35, 81)
        sm = rng.uniform(55, 85)

    return {
        'avg_daily_minutes': round(float(avg), 1),
        'night_usage_count': int(night),
        'unique_apps': int(apps),
        'total_sessions': int(sess),
        'social_media_pct': round(float(sm), 1),
        'morning_sessions': int(rng.integers(1, 9)),
        'evening_sessions': int(rng.integers(2, 11)),
        'max_single_session': round(float(avg * rng.uniform(0.3, 0.7)), 1),
        'user_type': user_type,
        'risk_label': {'low': 0, 'medium': 1, 'high': 2}[user_type],
    }


def load_or_generate_data(n=600, seed=42):
    csv_path = 'data/user_profiles.csv'
    if os.path.exists(csv_path):
        print(f"📂 Loading existing dataset: {csv_path}")
        return pd.read_csv(csv_path)

    print("🔧 Generating synthetic dataset...")
    rng = np.random.default_rng(seed)
    records = []
    per = n // 3
    for _ in range(per):      records.append(_make_profile('low', rng))
    for _ in range(per):      records.append(_make_profile('medium', rng))
    for _ in range(n - 2*per): records.append(_make_profile('high', rng))
    rng.shuffle(records := np.array(records, dtype=object))
    df = pd.DataFrame(list(records))
    df.to_csv(csv_path, index=False)
    print(f"✅ Generated {len(df)} samples — saved to {csv_path}")
    return df


# ── Training ───────────────────────────────────────────────────────────────────
def train_logistic_regression(df):
    print("\n" + "="*50)
    print("🤖  Training Logistic Regression Classifier")
    print("="*50)

    X = df[FEATURES].values
    y = df['risk_label'].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(
            max_iter=1000,
            multi_class='multinomial',
            solver='lbfgs',
            C=1.0,
            random_state=42
        ))
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    print(f"\n✅ Accuracy: {acc:.4f} ({acc*100:.1f}%)")
    print("\nClassification Report:")
    print(classification_report(
        y_test, y_pred,
        target_names=['Low Risk', 'Medium Risk', 'High Risk']
    ))

    model_path = os.path.join(MODEL_DIR, 'logistic_regression.pkl')
    joblib.dump(pipeline, model_path)
    print(f"💾 Saved: {model_path}")

    return pipeline, acc


def train_kmeans(df, n_clusters=3):
    print("\n" + "="*50)
    print("🔵  Training K-Means Clustering")
    print("="*50)

    X = df[FEATURES].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Find optimal k using silhouette score (test k=2..6)
    scores = {}
    for k in range(2, 7):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(X_scaled)
        scores[k] = silhouette_score(X_scaled, labels)
        print(f"  k={k} → silhouette={scores[k]:.4f}")

    best_k = max(scores, key=scores.get)
    print(f"\n✅ Best k={best_k} (silhouette={scores[best_k]:.4f})")

    # Train final model with best k (force 3 for interpretability)
    final_k = 3
    kmeans = KMeans(n_clusters=final_k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    df['cluster'] = labels

    # Map cluster → behavior label based on avg daily usage
    cluster_means = df.groupby('cluster')['avg_daily_minutes'].mean()
    sorted_clusters = cluster_means.sort_values().index.tolist()
    cluster_map = {
        sorted_clusters[0]: 'Mindful User',
        sorted_clusters[1]: 'Moderate User',
        sorted_clusters[2]: 'Heavy User',
    }

    print("\nCluster Mapping:")
    for c, label in cluster_map.items():
        mean_val = cluster_means[c]
        count = (labels == c).sum()
        print(f"  Cluster {c} → {label} | avg_daily={mean_val:.1f}min | n={count}")

    # Save scaler + kmeans + cluster_map together
    bundle = {
        'scaler': scaler,
        'kmeans': kmeans,
        'cluster_map': cluster_map,
        'features': FEATURES,
    }
    model_path = os.path.join(MODEL_DIR, 'kmeans.pkl')
    joblib.dump(bundle, model_path)
    print(f"💾 Saved: {model_path}")

    # Save cluster map as JSON for fast loading
    with open(os.path.join(MODEL_DIR, 'cluster_map.json'), 'w') as f:
        json.dump({str(k): v for k, v in cluster_map.items()}, f, indent=2)

    return bundle


def save_metadata(lr_acc):
    meta = {
        'features': FEATURES,
        'classes': ['Low', 'Medium', 'High'],
        'lr_accuracy': round(lr_acc, 4),
        'models': ['logistic_regression.pkl', 'kmeans.pkl'],
        'trained_at': pd.Timestamp.now().isoformat(),
    }
    with open(os.path.join(MODEL_DIR, 'metadata.json'), 'w') as f:
        json.dump(meta, f, indent=2)
    print(f"\n📋 Metadata saved: {MODEL_DIR}/metadata.json")


if __name__ == '__main__':
    print("🧠  Digital Minimalism Analyzer — ML Training Pipeline")
    print("=" * 55)

    df = load_or_generate_data(600)
    print(f"\nDataset: {len(df)} samples | Classes: {df['user_type'].value_counts().to_dict()}")

    lr_model, lr_acc = train_logistic_regression(df)
    km_bundle = train_kmeans(df)
    save_metadata(lr_acc)

    print("\n🎉  Training complete! All models saved to ./models/")
    print("    Run: python app.py   to start the prediction API")
