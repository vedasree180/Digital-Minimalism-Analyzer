import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { generateMockLogs, computeStats, APP_COLORS } from '../utils/mockData'

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {name}
    </text>
  )
}

export default function Dashboard() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [period, setPeriod] = useState(7)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('dma_logs') || '[]')
    const all = stored.length > 0 ? stored : generateMockLogs(14)
    if (stored.length === 0) localStorage.setItem('dma_logs', JSON.stringify(all))
    setLogs(all)
    setStats(computeStats(all.slice(0, period * 3)))
  }, [period])

  if (!stats) return <div className="loading-spinner"><div className="spinner" /><span>Loading your data...</span></div>

  // Build daily area chart data
  const dailyData = Object.entries(stats.byDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-period)
    .map(([date, minutes]) => ({
      date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      minutes,
      hours: +(minutes / 60).toFixed(1),
    }))

  // Pie data
  const pieData = Object.entries(stats.byApp)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }))

  const riskColor = stats.riskLevel === 'High' ? 'var(--accent-danger)'
    : stats.riskLevel === 'Medium' ? 'var(--accent-warning)' : 'var(--accent-success)'

  const riskClass = stats.riskLevel === 'High' ? 'badge-danger'
    : stats.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'

  return (
    <div>
      <div className="page-header fade-up">
        <h2>📊 Overview Dashboard</h2>
        <p>Your digital habits at a glance — {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {stats.riskLevel === 'High' && (
        <div className="alert alert-danger fade-up">
          ⚠️ High risk detected! You're averaging {Math.round(stats.avgDaily / 60)}h {stats.avgDaily % 60}m per day. Take action now.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid-4 fade-up fade-up-delay-1" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent-primary)' }}>
          <div className="stat-label">Avg Daily Usage</div>
          <div className="stat-value">{Math.floor(stats.avgDaily / 60)}h {stats.avgDaily % 60}m</div>
          <div className="stat-sub">per day this week</div>
        </div>
        <div className="stat-card" style={{ '--accent-color': riskColor }}>
          <div className="stat-label">Risk Level</div>
          <div className="stat-value" style={{ fontSize: 24, color: riskColor }}>{stats.riskLevel}</div>
          <div>
            <span className={`stat-badge ${riskClass}`}>Score: {stats.riskScore}/100</span>
          </div>
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent-danger)' }}>
          <div className="stat-label">Night Sessions</div>
          <div className="stat-value">{stats.nightUsageCount}</div>
          <div className="stat-sub">after 11 PM sessions</div>
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent-secondary)' }}>
          <div className="stat-label">Top App</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{stats.topApp}</div>
          <div className="stat-sub">{Math.round(stats.topAppMinutes / 60)}h total usage</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2 fade-up fade-up-delay-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">
            📈 Daily Usage Trend
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {[7, 14].map(d => (
                <button key={d} onClick={() => setPeriod(d)}
                  style={{
                    background: period === d ? 'var(--accent-primary)' : 'transparent',
                    border: '1px solid var(--border)', borderRadius: 6,
                    color: period === d ? '#fff' : 'var(--text-muted)',
                    padding: '3px 10px', fontSize: 12, cursor: 'pointer'
                  }}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--text-primary)' }}
                itemStyle={{ color: 'var(--accent-primary)' }}
                formatter={(v) => [`${v} min`, 'Usage']}
              />
              <Area type="monotone" dataKey="minutes" stroke="var(--accent-primary)" fill="url(#usageGrad)" strokeWidth={2} dot={{ fill: 'var(--accent-primary)', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">🍕 App Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={APP_COLORS[entry.name] || '#2E7D6B'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(v) => [`${v} min`, 'Time spent']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk score visual */}
      <div className="card fade-up fade-up-delay-3">
        <div className="card-title">🎯 Addiction Risk Score</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Risk Score</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: riskColor, fontWeight: 700 }}>{stats.riskScore}/100</span>
            </div>
            <div className="risk-bar">
              <div className={`risk-fill risk-${stats.riskLevel.toLowerCase()}`} style={{ width: `${stats.riskScore}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--accent-success)' }}>Low</span>
              <span style={{ fontSize: 11, color: 'var(--accent-warning)' }}>Medium</span>
              <span style={{ fontSize: 11, color: 'var(--accent-danger)' }}>High</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Avg > 4h/day', active: stats.avgDaily > 240, icon: '⏱️' },
              { label: 'Night usage', active: stats.nightUsageCount > 3, icon: '🌙' },
              { label: '5+ apps daily', active: Object.keys(stats.byApp).length > 5, icon: '📱' },
              { label: 'Compulsive use', active: stats.riskScore > 60, icon: '🔁' },
            ].map(f => (
              <div key={f.label} style={{
                padding: '10px 14px', borderRadius: 10,
                background: f.active ? 'rgba(248,113,113,0.1)' : 'var(--bg-primary)',
                border: `1px solid ${f.active ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
                textAlign: 'center', minWidth: 100
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
                <div style={{ fontSize: 11, color: f.active ? 'var(--accent-danger)' : 'var(--text-muted)' }}>{f.label}</div>
                <div style={{ fontSize: 10, marginTop: 2, color: f.active ? 'var(--accent-danger)' : 'var(--accent-success)', fontWeight: 700 }}>
                  {f.active ? '● FLAGGED' : '● OK'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
