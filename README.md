# 🧠 Digital Minimalism Analyzer
### Intelligent Screen Habit & Behavior Analysis System

A full-stack web application that analyzes digital usage patterns, detects addictive behaviors, classifies users using ML, and provides personalized recommendations for digital wellness.

---

## 📸 Features

| Feature | Description |
|---|---|
| 📊 Dashboard | Real-time stats, daily trends, risk score overview |
| ✦ Log Usage | Manual entry form for daily app usage |
| ◎ Analytics | Behavioral charts — peak times, app breakdown, radar, week comparison |
| ◆ Recommendations | Personalized, priority-ranked action plan |
| ◉ Detox Planner | Schedulable offline blocks + 30-day challenges |
| ◇ History | Filterable, sortable complete usage log table |

---

## 🛠️ Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | React + Vite + Recharts | UI, charts, data entry |
| Backend | Node.js + Express | REST API, business logic |
| ML Service | Python + Flask | K-Means clustering, Logistic Regression prediction |
| Database | MongoDB + Mongoose | Persistent storage |

---

## 🧩 System Architecture

```
User → React (port 3000)
         ↓  /api/* proxy
       Node.js Express (port 5000)
         ↓  MongoDB     ↓  HTTP POST
       Mongoose      Flask ML API (port 8000)
                       ↓
               sklearn models (.pkl)
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- MongoDB (optional — app runs in demo mode without it)

---

### 1️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
# → Runs at http://localhost:3000
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env: set MONGODB_URI if you have MongoDB running

npm run dev
# → Runs at http://localhost:5000
# → Test: http://localhost:5000/api/health
```

---

### 3️⃣ ML Service Setup

```bash
cd ml
pip install -r requirements.txt

# Step 1: Train the models (generates synthetic data + trains K-Means & LR)
python train.py

# Step 2: Start the Flask prediction API
python app.py
# → Runs at http://localhost:8000
# → Test: http://localhost:8000/health
```

> ⚠️ **Note:** The app works fully without the ML service or MongoDB — it falls back to
> rule-based risk scoring and localStorage for demo/offline use.

---

## 📁 Project Structure

```
digital-minimalism-analyzer/
│
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Overview, daily trend, risk score
│   │   │   ├── LogUsage.jsx     # Manual usage entry form
│   │   │   ├── Analytics.jsx    # Deep behavioral charts
│   │   │   ├── Recommendations.jsx  # Smart suggestions
│   │   │   ├── DetoxPlanner.jsx # Offline scheduling tool
│   │   │   └── History.jsx      # Full log table + filters
│   │   ├── utils/
│   │   │   ├── api.js           # Axios API helpers
│   │   │   └── mockData.js      # Demo data + stats computation
│   │   ├── App.jsx              # Router + sidebar layout
│   │   └── index.css            # Design system (CSS variables)
│   └── package.json
│
├── backend/                     # Node.js + Express
│   ├── models/
│   │   ├── User.js              # Mongoose user schema
│   │   ├── UsageLog.js          # Usage entry schema + auto-flags
│   │   └── DetoxPlan.js         # Detox blocks schema
│   ├── routes/
│   │   ├── users.js             # POST/GET users
│   │   ├── usage.js             # CRUD for usage logs
│   │   └── analysis.js          # Pattern analysis + recommendations
│   ├── app.js                   # Express server entry
│   └── .env.example
│
└── ml/                          # Python Flask ML
    ├── app.py                   # Flask prediction API (4 endpoints)
    ├── train.py                 # K-Means + Logistic Regression training
    ├── model.py                 # Feature engineering + utilities
    ├── generate_data.py         # Synthetic data generator
    ├── requirements.txt
    └── models/                  # Created after running train.py
        ├── logistic_regression.pkl
        ├── kmeans.pkl
        ├── cluster_map.json
        └── metadata.json
```

---

## 🤖 ML Implementation

### Input Features

| Feature | Description |
|---|---|
| `avg_daily_minutes` | Average minutes of screen time per day |
| `night_usage_count` | Number of sessions after 11 PM |
| `unique_apps` | Number of distinct apps used |
| `total_sessions` | Total number of usage sessions |
| `social_media_pct` | % of time on social platforms |
| `morning_sessions` | Sessions before noon |
| `evening_sessions` | Sessions 6 PM – 11 PM |
| `max_single_session` | Longest single app session |

### Models

**K-Means Clustering** — Groups users into behavioral clusters:
- `Mindful User` — Low usage, healthy patterns
- `Moderate User` — Average usage, some risk factors
- `Heavy User` — High usage, multiple addiction flags

**Logistic Regression** — Classifies risk level:
- Output: `Low` / `Medium` / `High`
- Multi-class (multinomial, lbfgs solver)
- Includes probability scores for each class

### ML API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service health + model status |
| POST | `/predict` | Single user risk prediction |
| POST | `/predict/batch` | Batch predict (up to 100 users) |
| POST | `/cluster` | K-Means cluster assignment only |
| GET | `/model/info` | Model metadata and accuracy |

---

## 🔌 Backend API Reference

### Usage Logs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/usage` | Create a single usage log |
| POST | `/api/usage/bulk` | Bulk insert multiple logs |
| GET | `/api/usage/:userId?days=7` | Get logs for a user |
| DELETE | `/api/usage/:id` | Delete a log entry |

### Analysis

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analysis/:userId` | Full analysis + ML results |
| GET | `/api/analysis/:userId/recommendations` | Just recommendations |
| GET | `/api/analysis/:userId/trend` | Week-over-week comparison |
| POST | `/api/analysis/risk` | Compute risk for raw feature data |

### Users

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users` | Create or get user by name |
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id/settings` | Update user settings |

---

## 🧪 Pattern Detection Logic

```
If avg_daily_usage > 4 hrs/day   → Flag: Excessive Usage
If sessions after 11 PM > 3      → Flag: Night Addiction
If unique_apps > 7               → Flag: App Hopping
If single session > 60 min       → Flag: Binge Session
If max_daily > 6 hrs             → Flag: Weekend Binge
```

---

## 🌟 WOW Factors (for Viva)

1. **Behavior analysis**, not just time tracking — detects *patterns*
2. **Dual ML approach**: unsupervised clustering + supervised classification
3. **Personalized recommendations** using both ML output and rule-based heuristics  
4. **Graceful degradation** — works offline/without MongoDB/without ML service
5. **Risk scoring 0–100** with flag breakdown (night addiction, app hopping, etc.)
6. **Interactive detox planner** with toggle-able blocks and challenges

---

## 🔮 Future Enhancements

- [ ] Auto-tracking via Browser Extension API
- [ ] AI chatbot for habit coaching (Anthropic/OpenAI integration)
- [ ] Deep Learning (LSTM) for time-series pattern modeling
- [ ] Integration with iOS Screen Time / Android Digital Wellbeing APIs
- [ ] Wearable device data (heart rate correlation with phone use)
- [ ] Social accountability — compare with friends (anonymized)
- [ ] Push notifications for goal reminders

---

## 👨‍💻 Author

**Digital Minimalism Analyzer** — Built as an intelligent wellness analytics platform combining psychology, machine learning, and web development.

*"The less we use our devices mindlessly, the more we use them mindfully."*
