"""
generate_data.py — Synthetic dataset generator for Digital Minimalism Analyzer
Generates realistic user screen usage data for model training.
"""

import numpy as np
import pandas as pd
import random
from datetime import datetime, timedelta

APPS = [
    'Instagram', 'YouTube', 'WhatsApp', 'Twitter', 'Facebook',
    'TikTok', 'Snapchat', 'Reddit', 'Netflix', 'Spotify',
    'LinkedIn', 'Games', 'News', 'Other'
]

TIME_SLOTS = ['morning', 'afternoon', 'evening', 'night']


def generate_user_profile(user_type: str) -> dict:
    """Generate a single user's aggregated weekly usage profile."""
    if user_type == 'low':
        avg_daily = random.uniform(30, 120)
        night_sessions = random.randint(0, 2)
        unique_apps = random.randint(2, 4)
        total_sessions = random.randint(5, 15)
        social_media_pct = random.uniform(10, 30)
    elif user_type == 'medium':
        avg_daily = random.uniform(120, 240)
        night_sessions = random.randint(2, 5)
        unique_apps = random.randint(4, 7)
        total_sessions = random.randint(15, 35)
        social_media_pct = random.uniform(30, 55)
    else:  # high
        avg_daily = random.uniform(240, 480)
        night_sessions = random.randint(5, 15)
        unique_apps = random.randint(6, 12)
        total_sessions = random.randint(35, 80)
        social_media_pct = random.uniform(55, 85)

    return {
        'avg_daily_minutes': round(avg_daily, 1),
        'night_usage_count': night_sessions,
        'unique_apps': unique_apps,
        'total_sessions': total_sessions,
        'social_media_pct': round(social_media_pct, 1),
        'morning_sessions': random.randint(1, 8),
        'evening_sessions': random.randint(2, 10),
        'max_single_session': round(avg_daily * random.uniform(0.3, 0.7), 1),
        'days_tracked': 7,
        'user_type': user_type,
        # Numeric label: 0=Low, 1=Medium, 2=High
        'risk_label': {'low': 0, 'medium': 1, 'high': 2}[user_type]
    }


def generate_dataset(n_users: int = 500, seed: int = 42) -> pd.DataFrame:
    """Generate a full dataset with balanced classes."""
    random.seed(seed)
    np.random.seed(seed)

    records = []
    per_class = n_users // 3

    for _ in range(per_class):
        records.append(generate_user_profile('low'))
    for _ in range(per_class):
        records.append(generate_user_profile('medium'))
    for _ in range(n_users - 2 * per_class):
        records.append(generate_user_profile('high'))

    random.shuffle(records)
    df = pd.DataFrame(records)

    print(f"✅ Generated {len(df)} user profiles")
    print(df['user_type'].value_counts())
    print("\nFeature stats:")
    print(df[['avg_daily_minutes', 'night_usage_count', 'unique_apps', 'total_sessions']].describe())

    return df


def generate_daily_logs(n_days: int = 30, seed: int = 42) -> pd.DataFrame:
    """Generate daily app-level usage logs (for demo/visualization)."""
    random.seed(seed)
    np.random.seed(seed)

    rows = []
    today = datetime.now()

    for day_offset in range(n_days):
        date = today - timedelta(days=day_offset)
        n_apps = random.randint(2, 6)
        selected_apps = random.sample(APPS, n_apps)

        for app in selected_apps:
            time_of_day = random.choice(TIME_SLOTS)
            hour = {
                'morning': random.randint(6, 11),
                'afternoon': random.randint(12, 17),
                'evening': random.randint(18, 22),
                'night': random.choice([23, 0, 1, 2]),
            }[time_of_day]

            minutes = max(5, int(np.random.lognormal(3.5, 0.6)))
            minutes = min(minutes, 300)

            rows.append({
                'date': date.strftime('%Y-%m-%d'),
                'app': app,
                'minutes': minutes,
                'time_of_day': time_of_day,
                'hour': hour,
                'is_night': time_of_day == 'night',
                'is_overuse': minutes > 60,
            })

    df = pd.DataFrame(rows)
    print(f"\n✅ Generated {len(df)} daily log entries over {n_days} days")
    return df


if __name__ == '__main__':
    # Generate and save datasets
    user_df = generate_dataset(600)
    user_df.to_csv('data/user_profiles.csv', index=False)
    print("\n💾 Saved: data/user_profiles.csv")

    log_df = generate_daily_logs(30)
    log_df.to_csv('data/daily_logs.csv', index=False)
    print("💾 Saved: data/daily_logs.csv")
