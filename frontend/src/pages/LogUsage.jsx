import React, { useState } from 'react'
import { APPS, APP_COLORS } from '../utils/mockData'

const TIME_SLOTS = ['morning', 'afternoon', 'evening', 'night']

const INITIAL = {
  app: '',
  customApp: '',
  minutes: '',
  timeOfDay: 'evening',
  date: new Date().toISOString().split('T')[0],
  note: '',
}

export default function LogUsage() {
  const [form, setForm] = useState(INITIAL)
  const [entries, setEntries] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const addEntry = () => {
    const appName = form.app === 'custom' ? form.customApp : form.app
    if (!appName) { setError('Please select or enter an app name'); return }
    if (!form.minutes || form.minutes < 1) { setError('Please enter valid minutes (at least 1)'); return }
    setError('')
    setEntries(p => [...p, { ...form, app: appName, id: Date.now() }])
    setForm(p => ({ ...p, app: '', customApp: '', minutes: '', note: '' }))
  }

  const removeEntry = (id) => setEntries(p => p.filter(e => e.id !== id))

  const handleSubmit = () => {
    if (!entries.length) { setError('Add at least one app entry'); return }
    const stored = JSON.parse(localStorage.getItem('dma_logs') || '[]')
    const newLogs = entries.map(e => ({
      ...e,
      _id: `log_${Date.now()}_${Math.random()}`,
      minutes: parseInt(e.minutes),
      date: new Date(e.date).toISOString(),
      hour: e.timeOfDay === 'morning' ? 9 : e.timeOfDay === 'afternoon' ? 14 : e.timeOfDay === 'evening' ? 19 : 23,
    }))
    localStorage.setItem('dma_logs', JSON.stringify([...newLogs, ...stored]))
    setSubmitted(true)
    setEntries([])
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <div>
      <div className="page-header fade-up">
        <h2>✦ Log App Usage</h2>
        <p>Record your screen time manually — be honest with yourself 🙏</p>
      </div>

      {submitted && (
        <div className="alert alert-success fade-up">
          ✅ Usage logged successfully! Check your Dashboard for updated analytics.
        </div>
      )}
      {error && (
        <div className="alert alert-warning fade-up">⚠️ {error}</div>
      )}

      <div className="grid-2 fade-up fade-up-delay-1">
        {/* Form */}
        <div className="card">
          <div className="card-title">📝 Add Entry</div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={form.date}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => set('date', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">App / Platform</label>
            <select className="form-select" value={form.app} onChange={e => set('app', e.target.value)}>
              <option value="">— Select App —</option>
              {APPS.map(a => <option key={a} value={a}>{a}</option>)}
              <option value="custom">+ Custom App</option>
            </select>
          </div>

          {form.app === 'custom' && (
            <div className="form-group">
              <label className="form-label">Custom App Name</label>
              <input
                className="form-input"
                placeholder="e.g. Swiggy, Zomato, BGMI..."
                value={form.customApp}
                onChange={e => set('customApp', e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Time Spent (minutes)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 45"
              min="1"
              max="720"
              value={form.minutes}
              onChange={e => set('minutes', e.target.value)}
            />
            {form.minutes > 0 && (
              <p style={{ fontSize: 12, color: 'var(--accent-secondary)', marginTop: 6 }}>
                = {Math.floor(form.minutes / 60)}h {form.minutes % 60}m
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Time of Day</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {TIME_SLOTS.map(t => (
                <button key={t}
                  onClick={() => set('timeOfDay', t)}
                  style={{
                    flex: 1, padding: '10px 4px', borderRadius: 8, cursor: 'pointer',
                    border: '1px solid', fontSize: 12, fontWeight: 600,
                    borderColor: form.timeOfDay === t ? 'var(--accent-primary)' : 'var(--border)',
                    background: form.timeOfDay === t ? 'rgba(46,125,107,0.12)' : 'var(--bg-primary)',
                    color: form.timeOfDay === t ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}>
                  {t === 'morning' ? '🌅' : t === 'afternoon' ? '☀️' : t === 'evening' ? '🌆' : '🌙'}
                  <br />{t}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input
              className="form-input"
              placeholder="e.g. Doomscrolling after work..."
              value={form.note}
              onChange={e => set('note', e.target.value)}
            />
          </div>

          <button className="btn btn-outline" style={{ width: '100%' }} onClick={addEntry}>
            + Add to List
          </button>
        </div>

        {/* Entry list */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">📋 Today's Entries ({entries.length})</div>

            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
                <p style={{ fontSize: 14 }}>No entries yet.<br />Add apps you used today.</p>
              </div>
            ) : (
              <div>
                {entries.map(e => (
                  <div key={e.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0', borderBottom: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: APP_COLORS[e.app] || 'var(--accent-primary)'
                      }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{e.app}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {e.minutes} min · {e.timeOfDay}
                          {e.note && ` · ${e.note}`}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeEntry(e.id)} style={{
                      background: 'transparent', border: 'none', color: 'var(--text-muted)',
                      cursor: 'pointer', fontSize: 16, padding: 4
                    }}>✕</button>
                  </div>
                ))}

                <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg-primary)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total time:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      {Math.floor(entries.reduce((s, e) => s + Number(e.minutes), 0) / 60)}h{' '}
                      {entries.reduce((s, e) => s + Number(e.minutes), 0) % 60}m
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {entries.length > 0 && (
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSubmit}>
              💾 Save Today's Usage Log
            </button>
          )}

          {/* Quick tips */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">💡 Logging Tips</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <p>• Be honest — tracking only works if accurate</p>
              <p>• Include all passive scrolling time</p>
              <p>• Log immediately after use for accuracy</p>
              <p>• Night = after 11 PM, when willpower is lowest</p>
              <p>• Even 10 min sessions add up fast</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
