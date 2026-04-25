require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')

const usageRoutes = require('./routes/usage')
const userRoutes = require('./routes/users')
const analysisRoutes = require('./routes/analysis')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Digital Minimalism API running', timestamp: new Date() })
})

// Routes
app.use('/api/users', userRoutes)
app.use('/api/usage', usageRoutes)
app.use('/api/analysis', analysisRoutes)

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || 'Internal Server Error' })
})

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/digital-minimalism')
    console.log('✅ MongoDB connected')
  } catch (err) {
    console.warn('⚠️  MongoDB not available — running without database (demo mode)')
  }
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`)
    console.log(`📊 API docs: http://localhost:${PORT}/api/health`)
  })
})
