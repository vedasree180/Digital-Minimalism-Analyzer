const express = require('express')
const router = express.Router()

// In-memory store as fallback
let memLogs = []
let UsageLog
try { UsageLog = require('../models/UsageLog') } catch {}

// POST /api/usage — create a new log entry
router.post('/', async (req, res) => {
  try {
    const { userId, app, minutes, timeOfDay, date, note, hour } = req.body

    if (!app || !minutes || !timeOfDay) {
      return res.status(400).json({ error: 'app, minutes, and timeOfDay are required' })
    }

    if (UsageLog) {
      const log = await UsageLog.create({
        userId: userId || '000000000000000000000001',
        app, minutes: parseInt(minutes),
        timeOfDay,
        hour: hour || (timeOfDay === 'morning' ? 9 : timeOfDay === 'afternoon' ? 14 : timeOfDay === 'evening' ? 19 : 23),
        date: date ? new Date(date) : new Date(),
        note,
      })
      return res.status(201).json(log)
    }

    // Fallback
    const log = {
      _id: `log_${Date.now()}`,
      userId, app, minutes: parseInt(minutes),
      timeOfDay, date: date || new Date().toISOString(), note,
      flags: {
        isNightUse: timeOfDay === 'night',
        isOveruse: parseInt(minutes) > 60,
      }
    }
    memLogs.push(log)
    res.status(201).json(log)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/usage/bulk — create multiple log entries at once
router.post('/bulk', async (req, res) => {
  try {
    const { logs } = req.body
    if (!Array.isArray(logs) || !logs.length) {
      return res.status(400).json({ error: 'logs array is required' })
    }

    if (UsageLog) {
      const created = await UsageLog.insertMany(logs.map(l => ({
        userId: l.userId || '000000000000000000000001',
        app: l.app, minutes: parseInt(l.minutes),
        timeOfDay: l.timeOfDay,
        date: l.date ? new Date(l.date) : new Date(),
        note: l.note,
      })))
      return res.status(201).json({ created: created.length, logs: created })
    }

    const created = logs.map(l => ({ ...l, _id: `log_${Date.now()}_${Math.random()}` }))
    memLogs.push(...created)
    res.status(201).json({ created: created.length, logs: created })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/usage/:userId — get logs for a user
router.get('/:userId', async (req, res) => {
  try {
    const { days = 7, app, timeOfDay } = req.query
    const since = new Date()
    since.setDate(since.getDate() - parseInt(days))

    if (UsageLog) {
      const query = {
        userId: req.params.userId,
        date: { $gte: since }
      }
      if (app) query.app = app
      if (timeOfDay) query.timeOfDay = timeOfDay

      const logs = await UsageLog.find(query).sort({ date: -1 }).limit(500)
      return res.json({ count: logs.length, logs })
    }

    // Fallback: return all in-memory logs
    let logs = memLogs.filter(l => l.userId === req.params.userId)
    if (!logs.length) {
      // return demo data
      logs = generateDemoLogs(req.params.userId, parseInt(days))
    }
    res.json({ count: logs.length, logs })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/usage/:id
router.delete('/:id', async (req, res) => {
  try {
    if (UsageLog) {
      await UsageLog.findByIdAndDelete(req.params.id)
      return res.json({ deleted: true })
    }
    memLogs = memLogs.filter(l => l._id !== req.params.id)
    res.json({ deleted: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Helper: generate demo logs
function generateDemoLogs(userId, days) {
  const apps = ['Instagram', 'YouTube', 'WhatsApp', 'Twitter', 'Reddit', 'Netflix']
  const times = ['morning', 'afternoon', 'evening', 'night']
  const logs = []
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    apps.slice(0, 3).forEach(app => {
      logs.push({
        _id: `demo_${i}_${app}`,
        userId,
        app,
        minutes: Math.floor(Math.random() * 90) + 15,
        timeOfDay: times[Math.floor(Math.random() * times.length)],
        date: date.toISOString(),
        flags: { isNightUse: false, isOveruse: false }
      })
    })
  }
  return logs
}

module.exports = router
