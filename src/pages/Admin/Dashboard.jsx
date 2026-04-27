import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { subscribeToReports } from '../../firebase'

export default function AdminDashboard() {
  const [reports, setReports] = useState([])
  const [filterType, setFilterType] = useState('All')
  const [filterUrgency, setFilterUrgency] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')

  useEffect(() => {
    const unsub = subscribeToReports(setReports)
    return () => unsub()
  }, [])

  const filteredReports = reports.filter(r => {
    if (filterType !== 'All' && r.issueType !== filterType) return false
    if (filterUrgency !== 'All' && r.urgencyLevel !== filterUrgency) return false
    if (filterStatus !== 'All' && r.status !== filterStatus) return false
    return true
  })

  // Ensure they are sorted by urgency score (highest first)
  const sortedReports = [...filteredReports].sort((a, b) => {
    const scoreA = a.urgencyScore ?? -1
    const scoreB = b.urgencyScore ?? -1
    return scoreB - scoreA
  })

  return (
    <div className="admin-dashboard page-container">
      <header className="header" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gradient-text" style={{ margin: 0, fontSize: '1.75rem' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-dim)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>Monitor and assign incoming community reports</p>
        </div>
        <Link to="/" style={{ color: 'var(--text-dim)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>&larr;</span> Change Role
        </Link>
      </header>

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
              <th style={thStyle}>Score</th>
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
            {sortedReports.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tdStyle}>{r.urgencyScore ?? 'N/A'}</td>
                <td style={{...tdStyle, color: `var(--${r.urgencyLevel?.toLowerCase() || 'text-main'})`}}>
                  {r.urgencyLevel || 'Scoring...'}
                </td>
                <td style={tdStyle}>{r.issueType?.toUpperCase()}</td>
                <td style={tdStyle}>{r.location}</td>
                <td style={tdStyle}>{r.affectedCount}</td>
                <td style={tdStyle}>{r.aiSummary || r.description?.substring(0, 50) + '...'}</td>
                <td style={tdStyle}>
                  {r.status}
                  {r.assignedVolunteerName && <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{r.assignedVolunteerName}</div>}
                </td>
                <td style={tdStyle}>
                  <Link to={`/admin/report/${r.id}`} className="btn-link" style={linkStyle}>
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

const linkStyle = {
  background: 'var(--accent-primary)',
  color: 'white',
  padding: '0.4rem 0.8rem',
  borderRadius: '4px',
  textDecoration: 'none',
  fontSize: '0.9rem'
}
