const express = require('express')
const router = express.Router()
const axios = require('axios')

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

let UsageLog
try { UsageLog = require('../models/UsageLog') } catch {}

// ─── Helper: Compute stats from logs ─────────────────────────────────────────
function computeStats(logs) {
  if (!logs.length) return null

  const byApp = {}
  const byDay = {}
  let nightCount = 0
  let totalMinutes = 0

  logs.forEach(log => {
    const day = new Date(log.date).toISOString().split('T')[0]
    byApp[log.app] = (byApp[log.app] || 0) + log.minutes
    byDay[day] = (byDay[day] || 0) + log.minutes
    totalMinutes += log.minutes
    if (log.timeOfDay === 'night' || log.hour >= 23 || log.hour < 5) nightCount++
  })

  const dailyTotals = Object.values(byDay)
  const avgDaily = dailyTotals.length ? Math.round(totalMinutes / dailyTotals.length) : 0
  const maxDaily = Math.max(...dailyTotals, 0)
  const topApp = Object.entries(byApp).sort((a, b) => b[1] - a[1])[0]
  const uniqueApps = Object.keys(byApp).length

  // Rule-based risk score
  let riskScore = 0
  if (avgDaily > 240) riskScore += 40
  else if (avgDaily > 120) riskScore += 20
  if (nightCount > 5) riskScore += 25
  else if (nightCount > 2) riskScore += 12
  if (uniqueApps > 7) riskScore += 15
  if (maxDaily > 360) riskScore += 20

  const riskLevel = riskScore >= 60 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low'

  return {
    totalMinutes,
    avgDaily,
    maxDaily,
    nightCount,
    uniqueApps,
    topApp: topApp?.[0],
    topAppMinutes: topApp?.[1] || 0,
    riskScore: Math.min(100, riskScore),
    riskLevel,
    byApp,
    byDay,
    totalSessions: logs.length,
  }
}

// ─── Helper: Generate recommendations ────────────────────────────────────────
function generateRecommendations(stats) {
  const recs = []

  if (stats.avgDaily > 240) {
    recs.push({
      priority: 1,
      category: 'Critical',
      icon: '🚨',
      title: 'Reduce Daily Screen Time Immediately',
      body: `You're averaging ${Math.floor(stats.avgDaily / 60)}h ${stats.avgDaily % 60}m per day — well above the 2-hour healthy limit. Start with a 30-minute daily reduction goal.`,
    })
  }

  if (stats.nightCount > 3) {
    recs.push({
      priority: 2,
      category: 'Sleep Health',
      icon: '🌙',
      title: 'Stop Late-Night Screen Use',
      body: `You've had ${stats.nightCount} late-night sessions. Blue light disrupts melatonin production. Set a strict "no screens after 10 PM" rule.`,
    })
  }

  if (stats.topApp) {
    recs.push({
      priority: 3,
      category: 'App Control',
      icon: '📵',
      title: `Set Limit on ${stats.topApp}`,
      body: `${stats.topApp} is your most-used app at ${Math.floor(stats.topAppMinutes / 60)}h total. Set a 30-minute daily cap using your device's built-in app timer.`,
    })
  }

  if (stats.uniqueApps > 6) {
    recs.push({
      priority: 4,
      category: 'Focus',
      icon: '🎯',
      title: 'Reduce App Hopping',
      body: `You're using ${stats.uniqueApps} different apps regularly. Frequent context switching drains focus and increases anxiety. Aim for 3–4 core apps maximum.`,
    })
  }

  recs.push({
    priority: 5,
    category: 'Habit',
    icon: '🌅',
    title: 'Phone-Free Morning Ritual',
    body: 'Do not check your phone for the first 30 minutes after waking. Replace it with stretching, journaling, or a warm drink.',
  })

  recs.push({
    priority: 6,
    category: 'Digital Detox',
    icon: '🧘',
    title: 'Schedule Daily Offline Blocks',
    body: 'Block out at least 2 hours daily where you are completely offline. Try 12–1 PM and 8–10 PM as starting points.',
  })

  return recs.slice(0, 6)
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/analysis/:userId — full analysis
router.get('/:userId', async (req, res) => {
  try {
    const { days = 7 } = req.query
    const since = new Date()
    since.setDate(since.getDate() - parseInt(days))

    let logs = []

    if (UsageLog) {
      logs = await UsageLog.find({
        userId: req.params.userId,
        date: { $gte: since }
      }).sort({ date: -1 })
    }

    // Demo data if empty
    if (!logs.length) {
      const apps = ['Instagram', 'YouTube', 'WhatsApp', 'Twitter', 'Reddit', 'Netflix', 'TikTok']
      const times = ['morning', 'afternoon', 'evening', 'night']
      for (let i = 0; i < parseInt(days); i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        apps.slice(0, 4).forEach(app => {
          logs.push({
            app,
            minutes: Math.floor(Math.random() * 90) + 20,
            timeOfDay: times[Math.floor(Math.random() * times.length)],
            date: date.toISOString(),
          })
        })
      }
    }

    const stats = computeStats(logs)
    if (!stats) return res.json({ message: 'No data available', stats: null })

    // Try to call ML service for enhanced classification
    let mlResult = null
    try {
      const mlRes = await axios.post(`${ML_URL}/predict`, {
        avg_daily_minutes: stats.avgDaily,
        night_usage_count: stats.nightCount,
        unique_apps: stats.uniqueApps,
        total_sessions: stats.totalSessions,
      }, { timeout: 3000 })
      mlResult = mlRes.data
    } catch {
      // ML service not running — use rule-based
      mlResult = {
        risk_level: stats.riskLevel,
        risk_score: stats.riskScore,
        cluster: stats.riskLevel === 'High' ? 'Heavy User' : stats.riskLevel === 'Medium' ? 'Moderate User' : 'Mindful User',
        source: 'rule-based'
      }
    }

    res.json({
      stats,
      ml: mlResult,
      recommendations: generateRecommendations(stats),
      flags: {
        excessUsage: stats.avgDaily > 240,
        nightAddiction: stats.nightCount > 3,
        appHopping: stats.uniqueApps > 6,
        weekendBinge: stats.maxDaily > 360,
      }
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/analysis/:userId/recommendations — just recommendations
router.get('/:userId/recommendations', async (req, res) => {
  try {
    const since = new Date()
    since.setDate(since.getDate() - 7)

    let logs = []
    if (UsageLog) {
      logs = await UsageLog.find({ userId: req.params.userId, date: { $gte: since } })
    }

    const stats = computeStats(logs) || {
      avgDaily: 180, nightCount: 4, topApp: 'Instagram',
      topAppMinutes: 240, uniqueApps: 6, riskLevel: 'Medium', riskScore: 45
    }

    res.json({ recommendations: generateRecommendations(stats) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/analysis/:userId/trend — week-over-week trend
router.get('/:userId/trend', async (req, res) => {
  try {
    const now = new Date()
    const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - 7)
    const lastWeekStart = new Date(now); lastWeekStart.setDate(now.getDate() - 14)

    let thisWeekLogs = [], lastWeekLogs = []

    if (UsageLog) {
      thisWeekLogs = await UsageLog.find({ userId: req.params.userId, date: { $gte: thisWeekStart } })
      lastWeekLogs = await UsageLog.find({ userId: req.params.userId, date: { $gte: lastWeekStart, $lt: thisWeekStart } })
    }

    const thisWeekTotal = thisWeekLogs.reduce((s, l) => s + l.minutes, 0)
    const lastWeekTotal = lastWeekLogs.reduce((s, l) => s + l.minutes, 0)
    const change = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0

    res.json({
      thisWeek: { total: thisWeekTotal, avg: Math.round(thisWeekTotal / 7) },
      lastWeek: { total: lastWeekTotal, avg: Math.round(lastWeekTotal / 7) },
      changePercent: change,
      improving: change < 0,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/analysis/risk — compute risk for raw data
router.post('/risk', async (req, res) => {
  try {
    const { avg_daily_minutes, night_usage_count, unique_apps, total_sessions } = req.body

    // Try ML service first
    try {
      const mlRes = await axios.post(`${ML_URL}/predict`, req.body, { timeout: 3000 })
      return res.json(mlRes.data)
    } catch {}

    // Rule-based fallback
    let score = 0
    if (avg_daily_minutes > 240) score += 40
    else if (avg_daily_minutes > 120) score += 20
    if (night_usage_count > 5) score += 25
    else if (night_usage_count > 2) score += 12
    if (unique_apps > 7) score += 15
    score = Math.min(100, score)

    res.json({
      risk_score: score,
      risk_level: score >= 60 ? 'High' : score >= 30 ? 'Medium' : 'Low',
      cluster: score >= 60 ? 'Heavy User' : score >= 30 ? 'Moderate User' : 'Mindful User',
      source: 'rule-based'
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
