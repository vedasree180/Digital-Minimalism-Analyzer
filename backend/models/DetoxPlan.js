const mongoose = require('mongoose')

const detoxBlockSchema = new mongoose.Schema({
  time: String,
  label: String,
  desc: String,
  emoji: String,
  done: { type: Boolean, default: false }
})

const detoxPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  blocks: [detoxBlockSchema],
  completedBlocks: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
}, { timestamps: true })

module.exports = mongoose.model('DetoxPlan', detoxPlanSchema)
