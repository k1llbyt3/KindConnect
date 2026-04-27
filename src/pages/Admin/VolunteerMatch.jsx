import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { db, updateReport, getVolunteers, addTask } from '../../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { matchVolunteers, simpleMatch } from '../../gemini'

export default function VolunteerMatch() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [assigningId, setAssigningId] = useState(null)

  useEffect(() => {
    const fetchAndMatch = async () => {
      try {
        const docRef = doc(db, 'reports', id)
        const docSnap = await getDoc(docRef)
        
        if (!docSnap.exists()) {
          setError("Report not found.")
          setLoading(false)
          return
        }
        
        const reportData = { id: docSnap.id, ...docSnap.data() }
        setReport(reportData)

        // Get all volunteers
        const allVolunteers = await getVolunteers()
        
        if (allVolunteers.length === 0) {
          setError("No volunteers registered yet.")
          setLoading(false)
          return
        }

        // Run matching
        let matched = await matchVolunteers(reportData, allVolunteers)
        if (!matched || matched.length === 0) {
          console.warn("AI Match failed or returned empty. Using simple fallback.")
          matched = simpleMatch(reportData, allVolunteers)
        }
        
        setMatches(matched)
      } catch (err) {
        console.error("Matching error:", err)
        setError("Error while finding matches.")
      } finally {
        setLoading(false)
      }
    }
    fetchAndMatch()
  }, [id])

  const handleAssign = async (match) => {
    setAssigningId(match.volunteerId)
    try {
      // 1. Create a task for the volunteer
      const taskId = await addTask({
        reportId: report.id,
        volunteerId: match.volunteerId,
        volunteerName: match.volunteerName,
        issueType: report.issueType,
        location: report.location,
        description: report.description,
        urgencyLevel: report.urgencyLevel,
        status: 'assigned'
      })

      // 2. Update the report to assigned
      await updateReport(report.id, {
        status: 'assigned',
        assignedTaskId: taskId,
        assignedVolunteerId: match.volunteerId,
        assignedVolunteerName: match.volunteerName
      })

      alert(`✅ Task assigned to ${match.volunteerName}!`)
      navigate('/admin')
    } catch (err) {
      console.error("Assignment failed:", err)
      alert("Failed to assign volunteer. Check console.")
      setAssigningId(null)
    }
  }

  if (loading) return <div>AI is finding the best volunteers... ✨</div>
  if (error) return (
    <div>
      <p>{error}</p>
      <Link to={`/admin/report/${id}`}>Back to Report</Link>
    </div>
  )

  return (
    <div className="volunteer-match page-container" style={{ maxWidth: '900px' }}>
      <Link to={`/admin/report/${id}`} style={{ color: 'var(--text-dim)', textDecoration: 'none', marginBottom: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'color 0.2s' }}>
        <span>&larr;</span> Back to Report
      </Link>

      <div style={{ marginBottom: '3rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <h1 className="gradient-text" style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem' }}>Match Volunteers</h1>
        <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '1.1rem' }}>
          Finding best matches for: <strong style={{ color: 'var(--text-main)' }}>{report?.issueType?.toUpperCase()}</strong> at <strong style={{ color: 'var(--text-main)' }}>{report?.location}</strong>
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>No available volunteers found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {matches.map((m, index) => (
            <div key={m.volunteerId} className="card match-card" style={matchCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>
                      {m.volunteerName}
                    </h3>
                    <span style={{ 
                      background: 'var(--accent-gradient)', 
                      color: 'white', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      boxShadow: 'var(--shadow-glow)'
                    }}>
                      {m.matchScore}% Match
                    </span>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-dim)', fontSize: '0.95rem', fontStyle: 'italic', display: 'flex', gap: '0.5rem' }}>
                    <span>✨</span> {m.matchReason}
                  </p>
                </div>
                
                <div style={{ marginLeft: '2rem' }}>
                  <button 
                    onClick={() => handleAssign(m)}
                    disabled={assigningId === m.volunteerId}
                    style={btnStyle}
                  >
                    {assigningId === m.volunteerId ? 'Assigning...' : 'Assign Task'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const matchCardStyle = {
  padding: '1.5rem 2rem',
  border: '1px solid var(--border)',
  transition: 'all 0.3s ease',
}

const btnStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  border: '1px solid var(--border)',
  padding: '0.8rem 1.5rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '1rem'
}
