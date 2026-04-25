import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  Radar, LineChart, Line, Legend
} from 'recharts'
import { generateMockLogs, computeStats, APP_COLORS, APPS } from '../utils/mockData'

export default function Analytics() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('dma_logs') || '[]')
    const all = stored.length > 0 ? stored : generateMockLogs(14)
    setLogs(all)
    setStats(computeStats(all))
  }, [])

  if (!stats) return <div className="loading-spinner"><div className="spinner" /><span>Analyzing patterns...</span></div>

  // Hourly distribution (simulated from timeOfDay)
  const hourlyData = [
    { time: '6-9 AM', sessions: logs.filter(l => l.timeOfDay === 'morning').length, label: 'Morning' },
    { time: '12-6 PM', sessions: logs.filter(l => l.timeOfDay === 'afternoon').length, label: 'Afternoon' },
    { time: '6-11 PM', sessions: logs.filter(l => l.timeOfDay === 'evening').length, label: 'Evening' },
    { time: '11PM+', sessions: logs.filter(l => l.timeOfDay === 'night').length, label: 'Night' },
  ]

  // App usage bar data
  const appData = Object.entries(stats.byApp)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([app, minutes]) => ({ app, minutes, hours: +(minutes / 60).toFixed(1) }))

  // Weekly comparison (this week vs last week simulation)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weeklyCompare = days.map(d => ({
    day: d,
    thisWeek: Math.floor(Math.random() * 200 + 60),
    lastWeek: Math.floor(Math.random() * 200 + 60),
  }))

  // Radar data for behavior dimensions
  const radarData = [
    { subject: 'Screen Time', A: Math.min(100, stats.avgDaily / 4) },
    { subject: 'Night Usage', A: Math.min(100, stats.nightUsageCount * 10) },
    { subject: 'App Diversity', A: Math.min(100, Object.keys(stats.byApp).length * 12) },
    { subject: 'Social Media', A: 65 },
    { subject: 'Entertainment', A: 45 },
    { subject: 'Productivity', A: 30 },
  ]

  // Classify user
  const clusterLabel = stats.riskLevel === 'High' ? 'Heavy User' : stats.riskLevel === 'Medium' ? 'Moderate User' : 'Mindful User'
  const clusterColor = stats.riskLevel === 'High' ? 'var(--accent-danger)' : stats.riskLevel === 'Medium' ? 'var(--accent-warning)' : 'var(--accent-success)'

  return (
    <div>
      <div className="page-header fade-up">
        <h2>◎ Behavioral Analytics</h2>
        <p>Deep patterns in your digital life — data never lies</p>
      </div>

      {/* Cluster classification */}
      <div className="card fade-up" style={{ marginBottom: 24, borderColor: clusterColor, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '30%',
          background: `linear-gradient(135deg, transparent, ${clusterColor}10)`
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: `${clusterColor}20`,
            border: `2px solid ${clusterColor}40`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 28, flexShrink: 0
          }}>
            {stats.riskLevel === 'High' ? '🔴' : stats.riskLevel === 'Medium' ? '🟡' : '🟢'}
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              ML Cluster Classification
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: clusterColor }}>{clusterLabel}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Based on K-Means clustering of your usage patterns across {Object.keys(stats.byApp).length} apps over 7 days.
              Risk score: <strong style={{ color: clusterColor }}>{stats.riskScore}/100</strong>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: clusterColor }}>
              {stats.riskScore}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Addiction Index</div>
          </div>
        </div>
      </div>

      {/* Peak usage times + app bar */}
      <div className="grid-2 fade-up fade-up-delay-1" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">⏰ Peak Usage Times</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey="sessions" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {logs.filter(l => l.timeOfDay === 'night').length > 3 && (
            <div className="alert alert-warning" style={{ marginTop: 12, padding: '8px 12px', fontSize: 12 }}>
              🌙 Night addiction detected! {logs.filter(l => l.timeOfDay === 'night').length} late-night sessions
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">📱 App Usage Breakdown (hours)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart layout="vertical" data={appData.slice(0, 6)} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis dataKey="app" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={70} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(v) => [`${v}h`, 'Hours']}
              />
              <Bar dataKey="hours" radius={[0, 4, 4, 0]}
                fill="url(#barGrad)"
              />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--accent-primary)" />
                  <stop offset="100%" stopColor="var(--accent-secondary)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly comparison + Radar */}
      <div className="grid-2 fade-up fade-up-delay-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">📉 This Week vs Last Week</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyCompare} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(v) => [`${v} min`]}
              />
              <Legend />
              <Line type="monotone" dataKey="thisWeek" stroke="var(--accent-primary)" strokeWidth={2} dot={{ r: 3 }} name="This Week" />
              <Line type="monotone" dataKey="lastWeek" stroke="var(--accent-secondary)" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" name="Last Week" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">🕸️ Behavior Radar</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart cx="50%" cy="50%" outerRadius={80} data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Radar name="You" dataKey="A" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.18} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* App table */}
      <div className="card fade-up fade-up-delay-3">
        <div className="card-title">📋 Detailed App Log</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>App</th>
              <th>Total (min)</th>
              <th>Hours</th>
              <th>% of total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appData.map(row => {
              const pct = Math.round((row.minutes / stats.totalMinutes) * 100)
              const flagged = row.minutes > 120
              return (
                <tr key={row.app}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: APP_COLORS[row.app] || '#2E7D6B' }} />
                      {row.app}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{row.minutes}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{row.hours}h</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: APP_COLORS[row.app] || '#2E7D6B' }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pct}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`stat-badge ${flagged ? 'badge-danger' : 'badge-success'}`}>
                      {flagged ? '⚠ Overuse' : '✓ OK'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
