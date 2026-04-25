const express = require('express')
const router = express.Router()

// In-memory fallback if MongoDB not connected
const memUsers = []
let useDB = true

let User
try { User = require('../models/User') } catch { useDB = false }

// POST /api/users — get or create user
router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    if (useDB && User) {
      let user = await User.findOne({ name })
      if (!user) user = await User.create({ name, email })
      return res.json(user)
    }

    // Fallback in-memory
    let user = memUsers.find(u => u.name === name)
    if (!user) {
      user = { _id: `user_${Date.now()}`, name, email, createdAt: new Date() }
      memUsers.push(user)
    }
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    if (useDB && User) {
      const user = await User.findById(req.params.id)
      if (!user) return res.status(404).json({ error: 'User not found' })
      return res.json(user)
    }
    const user = memUsers.find(u => u._id === req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/users/:id/settings
router.put('/:id/settings', async (req, res) => {
  try {
    if (useDB && User) {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { settings: req.body },
        { new: true }
      )
      return res.json(user)
    }
    res.json({ message: 'Settings saved (demo mode)' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
