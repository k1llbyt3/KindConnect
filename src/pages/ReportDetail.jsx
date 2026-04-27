import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { db, updateReport } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { predictImpact } from '../gemini'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [impactPrediction, setImpactPrediction] = useState(null)
  const [predicting, setPredicting] = useState(false)

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

  useEffect(() => {
    if (report && !impactPrediction && !predicting) {
      setPredicting(true)
      predictImpact(report).then(res => {
        setImpactPrediction(res || { error: true })
        setPredicting(false)
      })
    }
  }, [report, impactPrediction, predicting])

  if (loading) return <LoadingSpinner />
  if (!report) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h2 style={{ color: 'var(--text-main)' }}>Report Not Found</h2>
      <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>This report may have been deleted or does not exist.</p>
      <Link to="/dashboard" style={btnStyle}>Back to Dashboard</Link>
    </div>
  )

  return (
    <div className="report-detail page-container" style={{ maxWidth: '800px' }}>
      <Link to="/dashboard" style={{ color: 'var(--text-dim)', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'color 0.2s', fontSize: '0.9rem' }}>
        <span>&larr;</span> Back to Dashboard
      </Link>
      
      <div className="card" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div>
            <h1 className="gradient-text" style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>Report Details</h1>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>ID: {report.id}</div>
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
          <div style={{ fontSize: '0.9rem' }}><strong>Type:</strong> {report.issueType?.toUpperCase()}</div>
          <div style={{ fontSize: '0.9rem' }}><strong>Location:</strong> {report.location}</div>
          <div style={{ fontSize: '0.9rem' }}><strong>Status:</strong> {report.status}</div>
          <div style={{ fontSize: '0.9rem' }}><strong>Affected Count:</strong> {report.affectedCount}</div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <strong>Description:</strong>
          <p style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '4px', marginTop: '0.5rem' }}>
            {report.description}
          </p>
        </div>

        <div style={{ marginTop: '1.5rem', background: 'rgba(129, 140, 248, 0.05)', border: '1px solid var(--accent-primary)', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 0 15px rgba(129, 140, 248, 0.08)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <span style={{ fontSize: '1.25rem' }}>✨</span> AI Analysis
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong style={{ color: 'var(--text-dim)' }}>Summary:</strong> <span style={{ color: 'var(--text-main)' }}>{report.aiSummary || 'Pending...'}</span></div>
            <div><strong style={{ color: 'var(--text-dim)' }}>Action Category:</strong> <span style={{ color: 'var(--accent-secondary)', fontWeight: 'bold' }}>{report.aiActionCategory || 'Pending...'}</span></div>
            <div><strong style={{ color: 'var(--text-dim)' }}>Reasoning:</strong> <span style={{ fontStyle: 'italic' }}>{report.aiReason || 'Pending...'}</span></div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', background: 'rgba(236, 72, 153, 0.05)', border: '1px solid #ec4899', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 0 15px rgba(236, 72, 153, 0.08)' }}>
          <h3 style={{ marginTop: 0, color: '#ec4899', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔮</span> Future Impact Prediction
          </h3>
          <div style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
            {predicting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)' }}>
                <LoadingSpinner /> Analyzing 24-48 hour risk...
              </div>
            ) : impactPrediction?.error ? (
              <div style={{ color: 'var(--text-dim)' }}>Prediction unavailable</div>
            ) : impactPrediction ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <strong style={{ color: 'var(--text-dim)' }}>Risk Level:</strong>{' '}
                  <span style={{ color: impactPrediction.riskLevel === 'Severe' || impactPrediction.riskLevel === 'High' ? 'var(--critical)' : impactPrediction.riskLevel === 'Medium' ? 'var(--medium)' : 'var(--low)', fontWeight: 'bold' }}>
                    {impactPrediction.riskLevel}
                  </span>
                </div>
                <div><strong style={{ color: 'var(--text-dim)' }}>Predicted Impact:</strong> <span style={{ color: 'var(--text-main)' }}>{impactPrediction.predictedImpact}</span></div>
              </div>
            ) : null}
          </div>
        </div>

        {report.status !== 'assigned' && report.status !== 'resolved' && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button 
              onClick={() => navigate(`/match/${id}`)}
              style={{...btnStyle, padding: '0.75rem 2rem', fontSize: '1rem', background: 'var(--accent-gradient)'}}
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
  padding: '1.5rem',
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
