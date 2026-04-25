import React, { useState, useEffect } from 'react'

const DEFAULT_BLOCKS = [
  { id: 1, time: '6:00 AM – 7:00 AM', label: 'Morning Ritual', desc: 'No phones — stretch, hydrate, breakfast', emoji: '🌅', done: false },
  { id: 2, time: '12:00 PM – 12:30 PM', label: 'Midday Walk', desc: 'Offline break, step outside', emoji: '🚶', done: false },
  { id: 3, time: '6:00 PM – 7:00 PM', label: 'Wind Down', desc: 'Offline dinner, family time', emoji: '🍽️', done: false },
  { id: 4, time: '10:00 PM – 7:00 AM', label: 'Night Detox', desc: 'No screens 1hr before bed', emoji: '🌙', done: false },
]

const CHALLENGES = [
  { id: 'c1', title: '1-Hour Daily Detox', desc: 'Go 1 hour without any screen each day for 7 days', icon: '⏰', days: 7, progress: 3 },
  { id: 'c2', title: 'No Social Media Morning', desc: 'Don\'t check social media until 10 AM for 14 days', icon: '🌅', days: 14, progress: 5 },
  { id: 'c3', title: 'Phone-Free Bedroom', desc: 'No phone in bedroom for 30 days', icon: '🛏️', days: 30, progress: 10 },
  { id: 'c4', title: 'Delete & Reinstall', desc: 'Delete your top app for 7 days to break the habit loop', icon: '🗑️', days: 7, progress: 0 },
]

export default function DetoxPlanner() {
  const [blocks, setBlocks] = useState(() => {
    const saved = localStorage.getItem('dma_detox')
    return saved ? JSON.parse(saved) : DEFAULT_BLOCKS
  })
  const [challenges, setChallenges] = useState(CHALLENGES)
  const [streak, setStreak] = useState(0)
  const [newBlock, setNewBlock] = useState({ time: '', label: '', desc: '', emoji: '🧘' })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    localStorage.setItem('dma_detox', JSON.stringify(blocks))
    setStreak(blocks.filter(b => b.done).length)
  }, [blocks])

  const toggle = (id) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, done: !b.done } : b))
  }

  const addBlock = () => {
    if (!newBlock.time || !newBlock.label) return
    setBlocks(prev => [...prev, { ...newBlock, id: Date.now(), done: false }])
    setNewBlock({ time: '', label: '', desc: '', emoji: '🧘' })
    setAdding(false)
  }

  const removeBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  const completedPct = Math.round((blocks.filter(b => b.done).length / blocks.length) * 100)

  return (
    <div>
      <div className="page-header fade-up">
        <h2>◉ Digital Detox Planner</h2>
        <p>Schedule your offline time — protect your focus and mental health</p>
      </div>

      {/* Progress overview */}
      <div className="grid-3 fade-up" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent-success)' }}>
          <div className="stat-label">Today's Progress</div>
          <div className="stat-value" style={{ color: 'var(--accent-success)' }}>{completedPct}%</div>
          <div className="risk-bar" style={{ marginTop: 8 }}>
            <div className="risk-fill risk-low" style={{ width: `${completedPct}%` }} />
          </div>
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent-primary)' }}>
          <div className="stat-label">Blocks Completed</div>
          <div className="stat-value">{blocks.filter(b => b.done).length}/{blocks.length}</div>
          <div className="stat-sub">scheduled detox blocks</div>
        </div>
        <div className="stat-card" style={{ '--accent-color': 'var(--accent-warning)' }}>
          <div className="stat-label">Current Streak</div>
          <div className="stat-value">🔥 {streak}</div>
          <div className="stat-sub">blocks done today</div>
        </div>
      </div>

      <div className="grid-2 fade-up fade-up-delay-1">
        {/* Daily detox blocks */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              📅 Today's Detox Blocks
            </h3>
            <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setAdding(a => !a)}>
              + Add Block
            </button>
          </div>

          {adding && (
            <div className="card" style={{ marginBottom: 12, borderColor: 'var(--accent-primary)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="form-input" placeholder="Time range (e.g. 3:00 PM – 4:00 PM)" value={newBlock.time} onChange={e => setNewBlock(p => ({ ...p, time: e.target.value }))} />
                <input className="form-input" placeholder="Block name" value={newBlock.label} onChange={e => setNewBlock(p => ({ ...p, label: e.target.value }))} />
                <input className="form-input" placeholder="Description" value={newBlock.desc} onChange={e => setNewBlock(p => ({ ...p, desc: e.target.value }))} />
                <div style={{ display: 'flex', gap: 8 }}>
                  {['🧘', '🏃', '📖', '🎨', '🌿', '💤'].map(e => (
                    <button key={e} onClick={() => setNewBlock(p => ({ ...p, emoji: e }))}
                      style={{
                        fontSize: 20, padding: 6, borderRadius: 8, cursor: 'pointer', border: '1px solid',
                        borderColor: newBlock.emoji === e ? 'var(--accent-primary)' : 'var(--border)',
                        background: newBlock.emoji === e ? 'rgba(46,125,107,0.12)' : 'transparent'
                      }}>{e}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: 13 }} onClick={addBlock}>Add Block</button>
                  <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => setAdding(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {blocks.map((b, i) => (
            <div key={b.id} className={`detox-block ${b.done ? 'completed' : ''}`}
              style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{b.emoji}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{b.label}</div>
                  <div className="detox-time">{b.time}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{b.desc}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div className={`toggle-switch ${b.done ? 'on' : ''}`} onClick={() => toggle(b.id)}>
                  <div className="toggle-knob" />
                </div>
                <button onClick={() => removeBlock(b.id)} style={{
                  background: 'transparent', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', fontSize: 14, padding: 2
                }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Challenges */}
        <div>
          <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            🏆 Challenges
          </h3>
          {challenges.map((c, i) => {
            const pct = Math.round((c.progress / c.days) * 100)
            return (
              <div key={c.id} className="card" style={{ marginBottom: 12, animation: `fadeUp 0.3s ease ${i * 0.07}s both` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 28 }}>{c.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>{c.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="risk-bar" style={{ flex: 1, margin: 0 }}>
                        <div style={{
                          width: `${pct}%`, height: '100%', borderRadius: 4,
                          background: pct === 100 ? 'var(--accent-success)' : 'var(--accent-primary)',
                          transition: 'width 0.8s ease'
                        }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {c.progress}/{c.days}d
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Tips */}
          <div className="card" style={{ marginTop: 4, background: 'linear-gradient(135deg, rgba(79,195,161,0.08), rgba(46,125,107,0.12))', borderColor: 'rgba(79,195,161,0.2)' }}>
            <div className="card-title">🔬 The Science</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <p>• It takes <strong style={{ color: 'var(--accent-secondary)' }}>21+ days</strong> to break a phone habit loop</p>
              <p>• <strong style={{ color: 'var(--accent-secondary)' }}>Batch checking</strong> apps reduces anxiety by 40%</p>
              <p>• Phone-free mornings improve <strong style={{ color: 'var(--accent-secondary)' }}>focus for 4+ hours</strong></p>
              <p>• <strong style={{ color: 'var(--accent-secondary)' }}>Grayscale mode</strong> cuts usage by ~20% avg</p>
              <p>• Distance from phone = better sleep quality</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
