const mongoose = require('mongoose')

const usageLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  app: { type: String, required: true, trim: true },
  minutes: { type: Number, required: true, min: 1, max: 720 },
  timeOfDay: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night'],
    required: true
  },
  hour: { type: Number, min: 0, max: 23 },
  date: { type: Date, default: Date.now },
  note: { type: String, trim: true, maxlength: 200 },
  flags: {
    isOveruse: { type: Boolean, default: false },     // > 60 min single session
    isNightUse: { type: Boolean, default: false },    // after 11 PM
    isExcessDaily: { type: Boolean, default: false }, // day total > 240 min
  }
}, { timestamps: true })

// Auto-flag on save
usageLogSchema.pre('save', function (next) {
  this.flags.isNightUse = this.timeOfDay === 'night' || this.hour >= 23 || this.hour < 5
  this.flags.isOveruse = this.minutes > 60
  next()
})

// Indexes
usageLogSchema.index({ userId: 1, date: -1 })
usageLogSchema.index({ userId: 1, app: 1 })

module.exports = mongoose.model('UsageLog', usageLogSchema)
