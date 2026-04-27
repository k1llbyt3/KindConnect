import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { db, updateReport } from '../../firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReport = async () => {
      const docRef = doc(db, 'reports', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setReport({ id: docSnap.id, ...docSnap.data() })
      } else {
        console.error("No such report!")
      }
      setLoading(false)
    }
    fetchReport()
  }, [id])

  if (loading) return <div>Loading report...</div>
  if (!report) return <div>Report not found.</div>

  return (
    <div className="report-detail page-container" style={{ maxWidth: '900px' }}>
      <Link to="/admin" style={{ color: 'var(--text-dim)', textDecoration: 'none', marginBottom: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }}>
        <span>&larr;</span> Back to Dashboard
      </Link>
      
      <div className="card" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
          <div>
            <h1 className="gradient-text" style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Report Details</h1>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>ID: {report.id}</div>
          </div>
          <span className="status-tag" style={{ 
            background: `var(--${report.urgencyLevel?.toLowerCase() || 'text-dim'})`,
            boxShadow: `0 0 15px var(--${report.urgencyLevel?.toLowerCase() || 'text-dim'})40`,
            color: 'white'
          }}>
            {report.urgencyLevel || 'Scoring...'} Score: {report.urgencyScore ?? 'N/A'}
          </span>
        </div>

        <div style={gridStyle}>
          <div><strong>Type:</strong> {report.issueType?.toUpperCase()}</div>
          <div><strong>Location:</strong> {report.location}</div>
          <div><strong>Status:</strong> {report.status}</div>
          <div><strong>Affected Count:</strong> {report.affectedCount}</div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <strong>Description:</strong>
          <p style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '4px', marginTop: '0.5rem' }}>
            {report.description}
          </p>
        </div>

        <div style={{ marginTop: '2rem', background: 'rgba(129, 140, 248, 0.05)', border: '1px solid var(--accent-primary)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 0 20px rgba(129, 140, 248, 0.1)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span> AI Analysis
          </h3>
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            <div><strong style={{ color: 'var(--text-dim)' }}>Summary:</strong> <span style={{ color: 'var(--text-main)' }}>{report.aiSummary || 'Pending...'}</span></div>
            <div><strong style={{ color: 'var(--text-dim)' }}>Action Category:</strong> <span style={{ color: 'var(--accent-secondary)', fontWeight: 'bold' }}>{report.aiActionCategory || 'Pending...'}</span></div>
            <div><strong style={{ color: 'var(--text-dim)' }}>Reasoning:</strong> <span style={{ fontStyle: 'italic' }}>{report.aiReason || 'Pending...'}</span></div>
          </div>
        </div>

        {report.status !== 'assigned' && report.status !== 'resolved' && (
          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <button 
              onClick={() => navigate(`/admin/report/${id}/match`)}
              style={{...btnStyle, padding: '1rem 2.5rem', fontSize: '1.1rem', background: 'var(--accent-gradient)'}}
            >
              Find Volunteers &rarr;
            </button>
          </div>
        )}

        {(report.status === 'assigned' || report.status === 'resolved') && (
          <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(82, 196, 26, 0.1)', border: '1px solid var(--low)', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--low)', fontSize: '1.5rem' }}>✅ Task Assigned</h3>
            <p style={{ margin: 0, fontSize: '1.1rem' }}>This report is currently being handled by <strong style={{ color: 'white' }}>{report.assignedVolunteerName || 'a volunteer'}</strong>.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const cardStyle = {
  background: 'var(--card-bg)',
  padding: '2rem',
  borderRadius: '8px',
  border: '1px solid var(--border)'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
  marginTop: '1rem'
}

const btnStyle = {
  background: 'var(--accent-primary)',
  color: 'white',
  border: 'none',
  padding: '0.8rem 1.5rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1rem'
}
