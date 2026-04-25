"""
model.py — Reusable model utilities for the Digital Minimalism Analyzer ML layer.
Provides feature engineering, prediction helpers, and evaluation tools.
"""

import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, silhouette_score
import json
import os


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


# ── Feature Engineering ────────────────────────────────────────────────────────

def engineer_features(raw_logs: list) -> dict:
    """
    Convert raw usage log list into a feature dict for ML prediction.
    
    Args:
        raw_logs: list of dicts with keys: app, minutes, time_of_day, date
    
    Returns:
        feature dict compatible with /predict endpoint
    """
    if not raw_logs:
        return {f: 0 for f in FEATURES}

    by_day = {}
    by_app = {}
    night_count = 0
    morning_count = 0
    evening_count = 0
    social_media_apps = {'Instagram', 'Twitter', 'Facebook', 'TikTok', 'Snapchat', 'Reddit'}
    social_minutes = 0
    total_minutes = 0
    single_sessions = []

    for log in raw_logs:
        date = str(log.get('date', ''))[:10]
        app = log.get('app', 'Other')
        mins = int(log.get('minutes', 0))
        tod = log.get('time_of_day', log.get('timeOfDay', 'evening'))

        by_day[date] = by_day.get(date, 0) + mins
        by_app[app] = by_app.get(app, 0) + mins
        total_minutes += mins
        single_sessions.append(mins)

        if tod == 'night':
            night_count += 1
        elif tod == 'morning':
            morning_count += 1
        elif tod == 'evening':
            evening_count += 1

        if app in social_media_apps:
            social_minutes += mins

    days = len(by_day) or 1
    avg_daily = total_minutes / days
    social_pct = (social_minutes / total_minutes * 100) if total_minutes > 0 else 0

    return {
        'avg_daily_minutes': round(avg_daily, 1),
        'night_usage_count': night_count,
        'unique_apps': len(by_app),
        'total_sessions': len(raw_logs),
        'social_media_pct': round(social_pct, 1),
        'morning_sessions': morning_count,
        'evening_sessions': evening_count,
        'max_single_session': max(single_sessions) if single_sessions else 0,
    }


# ── Insight Generation ─────────────────────────────────────────────────────────

def generate_insights(feature_dict: dict, prediction: dict) -> list:
    """Generate human-readable insights from features and ML prediction."""
    insights = []
    avg = feature_dict.get('avg_daily_minutes', 0)
    night = feature_dict.get('night_usage_count', 0)
    apps = feature_dict.get('unique_apps', 0)
    social = feature_dict.get('social_media_pct', 0)
    risk = prediction.get('risk_level', 'Low')

    if avg > 240:
        insights.append({
            'type': 'danger',
            'message': f'You average {avg:.0f} min/day — 2× the healthy limit of 120 min.'
        })
    elif avg > 120:
        insights.append({
            'type': 'warning',
            'message': f'Daily usage ({avg:.0f} min) is above the recommended 2-hour limit.'
        })
    else:
        insights.append({
            'type': 'success',
            'message': f'Daily usage ({avg:.0f} min) is within healthy range. Keep it up!'
        })

    if night > 5:
        insights.append({
            'type': 'danger',
            'message': f'{night} late-night sessions detected. This disrupts sleep cycles significantly.'
        })
    elif night > 2:
        insights.append({
            'type': 'warning',
            'message': f'{night} night sessions found. Consider stopping screens 1h before bed.'
        })

    if social > 50:
        insights.append({
            'type': 'warning',
            'message': f'{social:.0f}% of your time is social media. Try the 30-min daily cap rule.'
        })

    if apps > 7:
        insights.append({
            'type': 'info',
            'message': f'You used {apps} different apps. App-hopping fragments focus and increases anxiety.'
        })

    return insights


# ── Evaluation Utilities ───────────────────────────────────────────────────────

def print_evaluation(y_true, y_pred, target_names=None):
    """Print full evaluation metrics."""
    target_names = target_names or ['Low', 'Medium', 'High']
    print("\n📊 Classification Report:")
    print(classification_report(y_true, y_pred, target_names=target_names))
    print("Confusion Matrix:")
    print(confusion_matrix(y_true, y_pred))


def compute_addiction_score(features: dict) -> int:
    """
    Compute a 0–100 addiction index score from features.
    Used as a deterministic fallback if ML models are unavailable.
    """
    score = 0.0
    avg = features.get('avg_daily_minutes', 0)
    night = features.get('night_usage_count', 0)
    apps = features.get('unique_apps', 0)
    social = features.get('social_media_pct', 0)
    max_sess = features.get('max_single_session', 0)

    # Usage time: 0–40 pts
    score += min(40, avg / 6)

    # Night usage: 0–25 pts
    score += min(25, night * 3.5)

    # App diversity: 0–15 pts
    score += min(15, apps * 1.5)

    # Social media dominance: 0–10 pts
    score += min(10, social / 8)

    # Long binge sessions: 0–10 pts
    score += min(10, max_sess / 30)

    return min(100, int(score))
