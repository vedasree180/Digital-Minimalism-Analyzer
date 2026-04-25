const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  createdAt: { type: Date, default: Date.now },
  settings: {
    dailyLimit: { type: Number, default: 120 }, // minutes
    nightCutoff: { type: Number, default: 22 }, // hour (10PM)
    detoxGoal: { type: Number, default: 60 }, // minutes per day
  },
  riskProfile: {
    level: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    score: { type: Number, default: 0 },
    lastUpdated: Date,
    cluster: String,
  }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
