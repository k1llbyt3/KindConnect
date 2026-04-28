import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { subscribeToReports, subscribeToTasks, subscribeToInsights, db } from '../firebase'
import { collection, addDoc } from 'firebase/firestore'
import { generateWeeklyInsight } from '../gemini'
import LoadingSpinner from '../components/LoadingSpinner'
import { seedAll } from '../scripts/seedData'

export default function AdminDashboard() {
  const [reports, setReports] = useState([])
  const [tasks, setTasks] = useState([])
  const [insights, setInsights] = useState([])
  const [filterType, setFilterType] = useState('All')
  const [filterUrgency, setFilterUrgency] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [insightCooldown, setInsightCooldown] = useState(false)
  const [cooldownMinutes, setCooldownMinutes] = useState(0)
  const [showSeedModal, setShowSeedModal] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedStep, setSeedStep] = useState('')

  useEffect(() => {
    const unsubReports = subscribeToReports(data => setReports(data || []))
    const unsubTasks = subscribeToTasks(data => setTasks(data || []))
    const unsubInsights = subscribeToInsights(data => setInsights(data || []))
    return () => { unsubReports(); unsubTasks(); unsubInsights(); }
  }, [])

  const filteredReports = (reports || []).filter(r => {
    if (filterType !== 'All' && r.issueType !== filterType) return false
    if (filterUrgency !== 'All' && r.urgencyLevel !== filterUrgency) return false
    if (filterStatus !== 'All' && r.status !== filterStatus) return false
    // Also only show primary reports if clustered
    if (r.clusterId && !r.isClusterPrimary) return false
    return true
  })

  const sortedReports = [...filteredReports].sort((a, b) => {
    const scoreA = a.urgencyScore ?? -1
    const scoreB = b.urgencyScore ?? -1
    return scoreB - scoreA
  })

  const sortedImpactTasks = tasks
    .filter(t => t.status === 'completed' && t.impactStatement)
    .sort((a, b) => {
      const timeA = a.completedAt?.toMillis?.() || new Date(a.completedAt).getTime() || 0;
      const timeB = b.completedAt?.toMillis?.() || new Date(b.completedAt).getTime() || 0;
      return timeB - timeA;
    });

  const displayImpacts = [];
  const seenStatements = new Set();
  for (const t of sortedImpactTasks) {
    if (!seenStatements.has(t.impactStatement)) {
      displayImpacts.push(t);
      seenStatements.add(t.impactStatement);
    }
  }
  const completedTasksWithImpact = displayImpacts.slice(0, 8);
  const latestInsight = insights[0]

  const handleGenerateInsight = async () => {
    setInsightCooldown(true)
    let remaining = 60
    setCooldownMinutes(remaining)
    const interval = setInterval(() => {
      remaining -= 1
      setCooldownMinutes(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        setInsightCooldown(false)
      }
    }, 60000)

    try {
      const insight = await generateWeeklyInsight(reports, tasks)
      if (insight) {
        await addDoc(collection(db, 'insights'), insight)
      } else {
        setInsightCooldown(false)
        clearInterval(interval)
        alert("Not enough data to generate insight (requires at least 3 completed tasks).")
      }
    } catch (err) {
      console.error(err)
      setInsightCooldown(false)
      clearInterval(interval)
      alert("Failed to generate insight.")
    }
  }

  const exportImpactReport = () => {
    const lines = [
      'IMPACT REPORT — CRUX Platform',
      `Generated: ${new Date().toLocaleDateString()}`,
      '─'.repeat(50),
      '',
      ...completedTasksWithImpact.map((t, i) => `${i + 1}. ${t.impactStatement}`)
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `impact-report-${Date.now()}.txt`
    a.click()
  }

  return (
    <div className="admin-dashboard page-container">
      <header className="header" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gradient-text" style={{ margin: 0, fontSize: '1.75rem' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-dim)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>Monitor and assign incoming community reports</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => setShowSeedModal(true)} 
            style={{ ...linkStyle, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.85rem' }}
          >
            🌱 Seed Demo Data
          </button>
          <Link to="/" style={{ color: 'var(--text-dim)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>&larr;</span> Change Role
          </Link>
        </div>
      </header>

      {/* COOL SEED MODAL */}
      {showSeedModal && (
        <div style={modalOverlayStyle}>
          <div className="card glass-card" style={modalContentStyle}>
            <h2 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              {isSeeding ? '🌱 Rejuvenating Database...' : 'Ready to Seed?'}
            </h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {isSeeding 
                ? `Current Step: ${seedStep}`
                : 'This will clear all current reports, tasks, and volunteers and replace them with fresh, AI-clustered demo data. Perfect for presentations!'}
            </p>
            
            {isSeeding && (
              <div style={progressBarContainerStyle}>
                <div style={progressBarStyle} className="pulse-animation"></div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              {!isSeeding && (
                <button onClick={() => setShowSeedModal(false)} style={btnSecondaryStyle}>Cancel</button>
              )}
              <button 
                onClick={async () => {
                  setIsSeeding(true)
                  setSeedStep('Clearing collections...')
                  try {
                    // We wrap the seedAll to update the UI steps
                    // Note: Since seedAll is a black box, we'll just simulate steps for UI polish
                    setTimeout(() => setSeedStep('Generating Volunteers...'), 2000)
                    setTimeout(() => setSeedStep('Processing Reports & AI Clustering...'), 4000)
                    await seedAll()
                    setSeedStep('Finalizing...')
                    setTimeout(() => {
                      setIsSeeding(false)
                      setShowSeedModal(false)
                    }, 1000)
                  } catch (e) {
                    alert("Seeding failed")
                    setIsSeeding(false)
                  }
                }} 
                disabled={isSeeding}
                style={isSeeding ? btnDisabledStyle : btnPrimaryStyle}
              >
                {isSeeding ? 'Working...' : 'Go Live!'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
        <div className="main-content">
          <div className="filters" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
              <option value="All">All Types</option>
              <option value="water">💧 Water</option>
              <option value="food">🍱 Food</option>
              <option value="medical">⚕️ Medical</option>
              <option value="shelter">⛺ Shelter</option>
              <option value="safety">🛡️ Safety</option>
            </select>
            <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)} style={selectStyle}>
              <option value="All">All Urgencies</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
              <option value="All">All Statuses</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="reports-table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Urgency</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Affected</th>
                  <th style={thStyle}>Summary</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(sortedReports || []).map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', background: r.clusterId ? 'rgba(255, 165, 0, 0.05)' : 'transparent' }}>
                    <td style={tdStyle}>
                      <span className="status-tag" style={{ 
                        background: `var(--${r.urgencyLevel?.toLowerCase()}-bg, var(--bg-dark))`, 
                        color: `var(--${r.urgencyLevel?.toLowerCase()}, var(--text-main))` 
                      }}>
                        {r.urgencyLevel || 'Scoring...'}
                      </span>
                      <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem', paddingLeft: '0.5rem' }}>Score: {r.urgencyScore ?? 'N/A'}</div>
                    </td>
                    <td style={tdStyle}>
                      {r.issueType?.toUpperCase()}
                      {r.clusterId && <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginTop: '2px' }}>⚠️ CRISIS CLUSTER</div>}
                    </td>
                    <td style={tdStyle}>{r.location}</td>
                    <td style={tdStyle}>
                      {r.clusterId ? (
                        <strong style={{ color: 'var(--text-main)' }}>{r.combinedAffectedCount} (Combined)</strong>
                      ) : (
                        r.affectedCount
                      )}
                    </td>
                    <td style={tdStyle}>{r.aiSummary || r.description?.substring(0, 50) + '...'}</td>
                    <td style={tdStyle}>
                      {r.status}
                      {r.assignedVolunteerName && <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{r.assignedVolunteerName}</div>}
                    </td>
                    <td style={tdStyle}>
                      <Link to={`/report/${r.id}`} className="btn-link" style={linkStyle}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedReports.length === 0 && <p style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>No reports found.</p>}
          </div>
        </div>

        <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* USP 5: WEEKLY INSIGHT */}
          <div className="panel" style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>📊 Weekly Insight</h3>
              <button 
                onClick={handleGenerateInsight} 
                disabled={insightCooldown}
                style={{ ...linkStyle, fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: insightCooldown ? 'var(--bg-secondary)' : 'var(--accent-primary)', color: insightCooldown ? 'var(--text-dim)' : 'white', border: 'none', cursor: insightCooldown ? 'not-allowed' : 'pointer' }}
              >
                {insightCooldown ? `Wait ${cooldownMinutes}m` : 'Generate'}
              </button>
            </div>
            
            {latestInsight ? (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <p style={{ fontStyle: 'italic', marginBottom: '1rem', color: 'var(--text-main)' }}>"{latestInsight.headline}"</p>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>🔴 Top Crisis:</span>
                    <span>{latestInsight.topCrisisType}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>📍 Hotspot:</span>
                    <span style={{ textAlign: 'right' }}>{latestInsight.hotspotArea}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>⚡ Response:</span>
                    <span>{latestInsight.responseEfficiency}</span>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                  <div style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>💡 KEY INSIGHT</div>
                  <div>{latestInsight.keyInsight}</div>
                </div>
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(0, 200, 83, 0.1)', borderRadius: '4px', border: '1px solid rgba(0, 200, 83, 0.2)' }}>
                  <div style={{ color: '#00c853', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>✅ RECOMMENDATION</div>
                  <div>{latestInsight.recommendation}</div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', textAlign: 'center', margin: '2rem 0' }}>No insights generated yet.</p>
            )}
          </div>

          {/* USP 1: IMPACT FEED */}
          <div className="panel" style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>✅ Impact Feed</h3>
              <button onClick={exportImpactReport} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
                Export
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              {completedTasksWithImpact.length > 0 ? (
                completedTasksWithImpact.map(t => (
                  <div key={t.id} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.85rem', lineHeight: '1.4', borderLeft: '3px solid var(--accent-primary)' }}>
                    {t.impactStatement}
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', textAlign: 'center', margin: '2rem 0' }}>No completed tasks with impact statements yet.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

const selectStyle = {
  padding: '0.5rem',
  background: 'var(--card-bg)',
  color: 'var(--text-main)',
  border: '1px solid var(--border)',
  borderRadius: '4px'
}

const thStyle = { padding: '0.75rem 0.5rem', color: 'var(--text-dim)', fontSize: '0.8rem' }
const tdStyle = { padding: '0.75rem 0.5rem', fontSize: '0.85rem' }

const panelStyle = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '1.25rem',
  boxShadow: 'var(--shadow-sm)'
}

const linkStyle = {
  background: 'var(--accent-primary)',
  color: 'white',
  padding: '0.4rem 0.8rem',
  borderRadius: '4px',
  textDecoration: 'none',
  fontSize: '0.9rem',
  display: 'inline-block',
  cursor: 'pointer'
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(8px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem'
}

const modalContentStyle = {
  maxWidth: '450px',
  width: '100%',
  padding: '2rem',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 0 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.02)',
  animation: 'slideIn 0.3s ease-out'
}

const progressBarContainerStyle = {
  width: '100%',
  height: '6px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '10px',
  overflow: 'hidden',
  marginBottom: '1.5rem'
}

const progressBarStyle = {
  height: '100%',
  width: '70%', // Simulated progress
  background: 'var(--accent-gradient)',
  borderRadius: '10px',
  transition: 'width 0.5s ease'
}

const btnPrimaryStyle = {
  background: 'var(--accent-gradient)',
  color: 'white',
  border: 'none',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
}

const btnSecondaryStyle = {
  background: 'transparent',
  color: 'var(--text-dim)',
  border: '1px solid var(--border)',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer'
}

const btnDisabledStyle = {
  ...btnPrimaryStyle,
  opacity: 0.5,
  cursor: 'not-allowed'
}
