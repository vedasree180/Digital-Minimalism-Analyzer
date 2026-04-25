export const APP_COLORS = {
  Instagram: '#2E7D6B',
  YouTube: '#4FC3A1',
  WhatsApp: '#86C8B2',
  Twitter: '#76B9A9',
  Facebook: '#5AA68F',
  TikTok: '#447867',
  Snapchat: '#C7E8E1',
  Reddit: '#7DAF9B',
  Netflix: '#3B7A69',
  Spotify: '#4FC3A1',
  LinkedIn: '#5FA98A',
  Games: '#2E7D6B',
  News: '#7EC9B5',
  Other: '#889D93',
}

export const APPS = Object.keys(APP_COLORS)

export const generateMockLogs = (days = 7) => {
  const logs = []
  const today = new Date()
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const numApps = Math.floor(Math.random() * 5) + 2
    const appsUsed = [...APPS].sort(() => Math.random() - 0.5).slice(0, numApps)
    appsUsed.forEach(app => {
      const minutes = Math.floor(Math.random() * 120) + 10
      const hour = Math.floor(Math.random() * 24)
      logs.push({
        _id: `mock_${i}_${app}`,
        app,
        minutes,
        timeOfDay: hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening',
        date: date.toISOString(),
        hour,
      })
    })
  }
  return logs
}

export const computeStats = (logs) => {
  if (!logs.length) return null

  const byDay = {}
  const byApp = {}
  let nightUsageCount = 0
  let totalMinutes = 0

  logs.forEach(log => {
    const day = log.date?.split('T')[0] || new Date().toISOString().split('T')[0]
    byDay[day] = (byDay[day] || 0) + log.minutes
    byApp[log.app] = (byApp[log.app] || 0) + log.minutes
    totalMinutes += log.minutes
    if (log.timeOfDay === 'night' || log.hour >= 23 || log.hour < 5) nightUsageCount++
  })

  const avgDaily = totalMinutes / Object.keys(byDay).length
  const topApp = Object.entries(byApp).sort((a, b) => b[1] - a[1])[0]

  let riskLevel = 'Low'
  let riskScore = 20
  if (avgDaily > 240) { riskLevel = 'High'; riskScore = 80 }
  else if (avgDaily > 120) { riskLevel = 'Medium'; riskScore = 50 }
  if (nightUsageCount > 5) riskScore = Math.min(100, riskScore + 20)

  return {
    totalMinutes,
    avgDaily: Math.round(avgDaily),
    nightUsageCount,
    topApp: topApp?.[0],
    topAppMinutes: topApp?.[1],
    riskLevel,
    riskScore,
    byDay,
    byApp,
    totalSessions: logs.length,
  }
}
