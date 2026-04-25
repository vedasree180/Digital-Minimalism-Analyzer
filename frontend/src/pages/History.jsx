import React, { useState, useEffect } from 'react'
import { generateMockLogs, APP_COLORS } from '../utils/mockData'

export default function History() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('dma_logs') || '[]')
    const all = stored.length > 0 ? stored : generateMockLogs(14)
    setLogs(all)
  }, [])

  const clearAll = () => {
    if (window.confirm('Clear all logs? This cannot be undone.')) {
      localStorage.removeItem('dma_logs')
      setLogs(generateMockLogs(14))
    }
  }

  const filtered = logs.filter(l => {
    if (filter === 'all') return true
    if (filter === 'night') return l.timeOfDay === 'night'
    if (filter === 'flagged') return l.minutes > 60
    return true
  }).sort((a, b) => {
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date)
    if (sortBy === 'minutes') return b.minutes - a.minutes
    return a.app.localeCompare(b.app)
  })

  const totalHours = Math.floor(logs.reduce((s, l) => s + l.minutes, 0) / 60)
  const nightCount = logs.filter(l => l.timeOfDay === 'night').length
  const flaggedCount = logs.filter(l => l.minutes > 60).length

  return (
    <div>
      <div className="page-header fade-up">
        <h2>◇ Usage History</h2>
        <p>Your complete screen time record — {logs.length} total entries</p>
      </div>

      <div className="grid-3 fade-up" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent-primary)' }}>
          <div className="stat-label">Total Tracked</div>
          <div className="stat-value">{logs.length}</div>
          <div className="stat-sub">app sessions logged</div>
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent-secondary)' }}>
          <div className="stat-label">Total Screen Time</div>
          <div className="stat-value">{totalHours}h</div>
          <div className="stat-sub">across all sessions</div>
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent-danger)' }}>
          <div className="stat-label">Flagged Sessions</div>
          <div className="stat-value">{flaggedCount}</div>
          <div className="stat-sub">60+ min single sessions</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card fade-up fade-up-delay-1" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Filter:</span>
          {[
            { v: 'all', label: `All (${logs.length})` },
            { v: 'night', label: `🌙 Night (${nightCount})` },
            { v: 'flagged', label: `⚠ Flagged (${flaggedCount})` },
          ].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              style={{
                padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                border: '1px solid', fontFamily: 'var(--font-display)',
                borderColor: filter === f.v ? 'var(--accent-primary)' : 'var(--border)',
                background: filter === f.v ? 'rgba(46,125,107,0.12)' : 'transparent',
                color: filter === f.v ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}>{f.label}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sort:</span>
            <select className="form-select" style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
              value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date">Date</option>
              <option value="minutes">Duration</option>
              <option value="app">App Name</option>
            </select>
            <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: 12 }} onClick={clearAll}>
              🗑 Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card fade-up fade-up-delay-2">
        <table className="data-table">
          <thead>
            <tr>
              <th>App</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Time of Day</th>
              <th>Note</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map(log => {
              const flagged = log.minutes > 60
              const isNight = log.timeOfDay === 'night'
              return (
                <tr key={log._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: APP_COLORS[log.app] || '#2E7D6B', flexShrink: 0 }} />
                      <span style={{ fontWeight: 500 }}>{log.app}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(log.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', color: flagged ? 'var(--accent-danger)' : 'var(--text-primary)', fontWeight: flagged ? 700 : 400 }}>
                      {log.minutes}m
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 13 }}>
                      {log.timeOfDay === 'morning' ? '🌅' : log.timeOfDay === 'afternoon' ? '☀️' : log.timeOfDay === 'evening' ? '🌆' : '🌙'}{' '}
                      {log.timeOfDay}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {log.note || '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {flagged && <span className="stat-badge badge-danger">Excess</span>}
                      {isNight && <span className="stat-badge badge-warning">Night</span>}
                      {!flagged && !isNight && <span className="stat-badge badge-success">OK</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No entries match the current filter.
          </div>
        )}
        {filtered.length > 100 && (
          <p style={{ textAlign: 'center', padding: '16px', fontSize: 12, color: 'var(--text-muted)' }}>
            Showing 100 of {filtered.length} entries
          </p>
        )}
      </div>
    </div>
  )
}
