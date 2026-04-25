import React, { useState, useEffect } from 'react'
import { generateMockLogs, computeStats } from '../utils/mockData'

const STATIC_RECS = {
  High: [
    {
      icon: '🚨',
      title: 'Immediate Digital Detox Required',
      body: 'You\'re in the high-risk zone. Start with a 2-hour phone-free window daily — ideally 8 PM to 10 PM.',
      category: 'Critical',
      color: 'var(--accent-primary)',
      bg: 'rgba(46,125,107,0.10)',
      priority: 1,
    },
    {
      icon: '🌙',
      title: 'Stop Late-Night Scrolling',
      body: 'Night usage disrupts melatonin. Enable Do Not Disturb or grayscale mode after 10 PM. Put your phone in another room.',
      category: 'Sleep',
      color: 'var(--accent-secondary)',
      bg: 'rgba(79,195,161,0.10)',
      priority: 2,
    },
    {
      icon: '📵',
      title: 'Delete Top 2 Time-Wasting Apps',
      body: 'Your top apps are consuming 70%+ of your screen time. Try a 7-day deletion challenge — you\'ll survive, we promise.',
      category: 'Action',
      color: 'var(--accent-primary)',
      bg: 'rgba(46,125,107,0.10)',
      priority: 3,
    },
    {
      icon: '⏱️',
      title: 'Use App Timers',
      body: 'Set strict 30-minute daily limits on social media apps. Use built-in Screen Time (iOS) or Digital Wellbeing (Android).',
      category: 'Habit',
      color: 'var(--accent-warning)',
      bg: 'rgba(126,201,181,0.10)',
      priority: 4,
    },
  ],
  Medium: [
    {
      icon: '🎯',
      title: 'Reduce Peak Distraction Hours',
      body: 'Your peak distraction window is 8–10 PM. Use this time for a walk, reading, or a hobby instead.',
      category: 'Routine',
      color: 'var(--accent-warning)',
      bg: 'rgba(126,201,181,0.10)',
      priority: 1,
    },
    {
      icon: '📱',
      title: 'Batch Your App Checks',
      body: 'Instead of checking apps constantly, schedule 3 specific times per day (e.g. 9AM, 1PM, 6PM). Reduces context switching.',
      category: 'Productivity',
      color: 'var(--accent-primary)',
      bg: 'rgba(46,125,107,0.10)',
      priority: 2,
    },
    {
      icon: '🌅',
      title: 'Phone-Free Mornings',
      body: 'Don\'t check your phone for the first 30 minutes after waking. Start with journaling, stretching, or breakfast instead.',
      category: 'Habit',
      color: 'var(--accent-secondary)',
      bg: 'rgba(79,195,161,0.10)',
      priority: 3,
    },
    {
      icon: '🔔',
      title: 'Turn Off Non-Essential Notifications',
      body: 'Notifications are dopamine traps. Keep only calls and urgent messages. Disable social media notifications entirely.',
      category: 'Tech',
      color: 'var(--accent-warning)',
      bg: 'rgba(126,201,181,0.10)',
      priority: 4,
    },
  ],
  Low: [
    {
      icon: '🏆',
      title: 'Maintain Your Balance',
      body: 'You\'re doing great! Keep your screen time under 2 hours/day and maintain your healthy digital habits.',
      category: 'Praise',
      color: 'var(--accent-secondary)',
      bg: 'rgba(79,195,161,0.10)',
      priority: 1,
    },
    {
      icon: '📚',
      title: 'Explore Analog Alternatives',
      body: 'Replace one digital habit with an analog one. Read physical books, write in a journal, or rediscover a board game.',
      category: 'Lifestyle',
      color: 'var(--accent-primary)',
      bg: 'rgba(46,125,107,0.10)',
      priority: 2,
    },
    {
      icon: '🧘',
      title: 'Weekly Digital Sabbath',
      body: 'Consider one day per week of minimal device use. Studies show this dramatically reduces stress and improves creativity.',
      category: 'Wellbeing',
      color: 'var(--accent-secondary)',
      bg: 'rgba(79,195,161,0.10)',
      priority: 3,
    },
  ],
}

const TIPS = [
  "Every hour you reclaim from screens can become an hour of sleep, exercise, or real conversation.",
  "The average person checks their phone 96 times per day. That's every 10 minutes.",
  "Social media is designed by PhD-level experts to keep you scrolling. It's not your fault — but it is your responsibility.",
  "After 30 days of reduced screen time, users report better sleep, focus, and emotional regulation.",
  "Grayscale mode reduces screen appeal by 40% in most users. Try it tonight.",
  "Replace the habit, don't just remove it. For every deleted app, add a physical activity.",
]

export default function Recommendations() {
  const [stats, setStats] = useState(null)
  const [dismissed, setDismissed] = useState([])
  const [tip, setTip] = useState(0)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('dma_logs') || '[]')
    const all = stored.length > 0 ? stored : generateMockLogs(14)
    setStats(computeStats(all))
    const interval = setInterval(() => setTip(t => (t + 1) % TIPS.length), 6000)
    return () => clearInterval(interval)
  }, [])

  if (!stats) return <div className="loading-spinner"><div className="spinner" /><span>Generating insights...</span></div>

  const recs = STATIC_RECS[stats.riskLevel] || STATIC_RECS.Medium
  const activeRecs = recs.filter(r => !dismissed.includes(r.title))

  const appSpecific = []
  if (stats.topApp) {
    appSpecific.push({
      icon: '📊',
      title: `Reduce ${stats.topApp} Usage`,
      body: `${stats.topApp} is your #1 time drain at ${Math.round(stats.topAppMinutes / 60)}h total. Set a 30-minute daily limit. Try the "one less scroll" technique.`,
      category: 'App-Specific',
      color: 'var(--accent-warning)',
      bg: 'rgba(126,201,181,0.10)',
    })
  }

  if (stats.nightUsageCount > 3) {
    appSpecific.push({
      icon: '🌙',
      title: `Stop ${stats.topApp || 'Apps'} After 10 PM`,
      body: `You've had ${stats.nightUsageCount} late-night sessions. Blue light after dark suppresses melatonin. Your brain deserves to wind down.`,
      category: 'Night Habit',
      color: 'var(--accent-secondary)',
      bg: 'rgba(79,195,161,0.10)',
    })
  }

  return (
    <div>
      <div className="page-header fade-up">
        <h2>◆ Smart Recommendations</h2>
        <p>Personalized insights based on your actual usage patterns</p>
      </div>

      {/* Tip rotator */}
      <div className="card fade-up" style={{
        marginBottom: 24, background: 'linear-gradient(135deg, rgba(46,125,107,0.10), rgba(79,195,161,0.08))',
        borderColor: 'rgba(79,195,161,0.18)'
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 24 }}>💡</span>
          <div>
            <div style={{ fontSize: 11, color: 'var(--accent-primary)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
              Did You Know?
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{TIPS[tip]}</p>
          </div>
        </div>
      </div>

      {/* Risk summary */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Risk Level', value: stats.riskLevel, color: stats.riskLevel === 'High' ? 'badge-danger' : stats.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success' },
          { label: 'Avg Daily', value: `${Math.floor(stats.avgDaily / 60)}h ${stats.avgDaily % 60}m`, color: 'badge-info' },
          { label: 'Night Sessions', value: stats.nightUsageCount, color: stats.nightUsageCount > 3 ? 'badge-danger' : 'badge-success' },
          { label: 'Top App', value: stats.topApp, color: 'badge-info' },
        ].map(s => (
          <div key={s.label} style={{ padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
            <span className={`stat-badge ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* App-specific recs */}
      {appSpecific.length > 0 && (
        <div className="fade-up fade-up-delay-1" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            🎯 Personalized for You
          </h3>
          {appSpecific.map(r => (
            <div key={r.title} className="rec-card" style={{ borderColor: r.color + '30', background: r.bg }}>
              <div className="rec-icon" style={{ background: r.color + '20' }}>{r.icon}</div>
              <div className="rec-body">
                <h4>{r.title}</h4>
                <p>{r.body}</p>
              </div>
              <span className="stat-badge badge-warning" style={{ flexShrink: 0 }}>{r.category}</span>
            </div>
          ))}
        </div>
      )}

      {/* General recs */}
      <div className="fade-up fade-up-delay-2">
        <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          📋 Action Plan ({activeRecs.length} items)
        </h3>
        {activeRecs.map((r, i) => (
          <div key={r.title} className="rec-card" style={{
            borderColor: r.color + '30', background: r.bg,
            animation: `fadeUp 0.4s ease ${i * 0.06}s both`
          }}>
            <div className="rec-icon" style={{ background: r.color + '20' }}>{r.icon}</div>
            <div className="rec-body" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h4>{r.title}</h4>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: r.color + '20', color: r.color }}>
                  #{r.priority}
                </span>
              </div>
              <p>{r.body}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              <span className="stat-badge badge-info">{r.category}</span>
              <button
                onClick={() => setDismissed(d => [...d, r.title])}
                style={{ fontSize: 11, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Done ✓
              </button>
            </div>
          </div>
        ))}

        {activeRecs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <p>You've completed all recommendations! Refresh to get new ones.</p>
          </div>
        )}
      </div>

      {/* Resources */}
      <div className="card fade-up fade-up-delay-3" style={{ marginTop: 24 }}>
        <div className="card-title">📚 Further Reading</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Digital Minimalism by Cal Newport', tag: 'Book' },
            { title: 'How to Break Up with Your Phone', tag: 'Book' },
            { title: 'r/nosurf Community', tag: 'Community' },
            { title: 'Center for Humane Technology', tag: 'Website' },
          ].map(r => (
            <div key={r.title} style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.title}</span>
              <span className="stat-badge badge-info">{r.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
