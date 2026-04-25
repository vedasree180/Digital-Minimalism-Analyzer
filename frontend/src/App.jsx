import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import LogUsage from './pages/LogUsage'
import Analytics from './pages/Analytics'
import Recommendations from './pages/Recommendations'
import DetoxPlanner from './pages/DetoxPlanner'
import History from './pages/History'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '◈', exact: true },
  { to: '/log', label: 'Log Usage', icon: '✦' },
  { to: '/analytics', label: 'Analytics', icon: '◎' },
  { to: '/recommendations', label: 'Insights', icon: '◆' },
  { to: '/detox', label: 'Detox Plan', icon: '◉' },
  { to: '/history', label: 'History', icon: '◇' },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">🧠</div>
            <h1>Digital Minimalism</h1>
            <span>Analyzer v1.0</span>
          </div>
          <nav className="nav-section">
            <div className="nav-section-label">Main</div>
            {NAV.slice(0, 3).map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.exact}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span style={{ fontSize: 16 }}>{n.icon}</span>
                <span>{n.label}</span>
              </NavLink>
            ))}
            <div className="nav-section-label">Tools</div>
            {NAV.slice(3).map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span style={{ fontSize: 16 }}>{n.icon}</span>
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              📍 Hyderabad, IN<br />
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                v1.0.0
              </span>
            </p>
          </div>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/log" element={<LogUsage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/detox" element={<DetoxPlanner />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
