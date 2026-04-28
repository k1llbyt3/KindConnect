import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { db, updateReport, getVolunteers, getTasks, updateVolunteer, addTask } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { matchVolunteers, simpleMatch, checkVolunteerWellbeing } from '../gemini'
import LoadingSpinner from '../components/LoadingSpinner'

export default function VolunteerMatch() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [assigningId, setAssigningId] = useState(null)
  const [assignedTask, setAssignedTask] = useState(null) // { taskId, volunteerName }

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
        const allTasks = await getTasks()
        
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

        // USP 3: Volunteer Burnout & Fatigue Check
        for (const m of matched) {
          const vol = allVolunteers.find(v => v.id === String(m.volunteerId))
          if (vol) {
            const recentTasks = allTasks
              .filter(t => String(t.volunteerId) === String(m.volunteerId) && t.status === 'completed')
              .sort((a, b) => {
                const atA = a.completedAt?.toMillis?.() || new Date(a.completedAt).getTime() || 0;
                const atB = b.completedAt?.toMillis?.() || new Date(b.completedAt).getTime() || 0;
                return atB - atA;
              });

            const wellbeing = await checkVolunteerWellbeing(vol, recentTasks, updateVolunteer);
            m.wellbeingStatus = wellbeing.wellbeingStatus;
            m.wellbeingReason = wellbeing.reason;
          } else {
            m.wellbeingStatus = 'Green';
            m.wellbeingReason = 'Volunteer profile not found for wellbeing check.';
          }
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
        volunteerId: String(match.volunteerId),
        volunteerName: match.volunteerName,
        reportSummary: report.aiSummary || report.description || 'Assigned task',
        reportLocation: report.location,
        urgencyLevel: report.urgencyLevel || 'Medium',
        status: 'assigned'
      })

      // 2. Update the report to assigned
      await updateReport(report.id, {
        status: 'assigned',
        assignedTaskId: taskId,
        assignedVolunteerId: match.volunteerId,
        assignedVolunteerName: match.volunteerName
      })

      // 3. Show Task ID on screen instead of navigating away
      setAssignedTask({ taskId, volunteerName: match.volunteerName })
    } catch (err) {
      console.error("Assignment failed:", err)
      alert("Failed to assign volunteer. Check console.")
      setAssigningId(null)
    }
  }

  // ─── SUCCESS SCREEN ─────────────────────────────────────────
  if (assignedTask) {
    return (
      <div className="page-container" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 1rem' }}>
        <div className="card" style={{ padding: '2.5rem', borderRadius: '16px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: '#10b981', margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>Task Assigned!</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>
            Successfully assigned to <strong style={{ color: 'var(--text-main)' }}>{assignedTask.volunteerName}</strong>.
          </p>

          <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>🔑 Task ID (Share with Volunteer)</p>
            <p style={{
              fontFamily: 'monospace',
              fontSize: '1.1rem',
              color: 'var(--accent-primary)',
              wordBreak: 'break-all',
              margin: 0,
              userSelect: 'all',
              background: 'rgba(99, 102, 241, 0.05)',
              padding: '0.75rem',
              borderRadius: '8px',
              cursor: 'text'
            }}>
              {assignedTask.taskId}
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '0.75rem', marginBottom: 0 }}>
              The volunteer uses this ID on the Verify Task page to submit proof of completion.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => { navigator.clipboard.writeText(assignedTask.taskId); alert('Task ID copied!'); }}
              style={{ background: 'var(--accent-gradient)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Copy Task ID
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingSpinner />
  if (error) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <p style={{ color: 'var(--critical)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>{error}</p>
      <Link to={`/report/${id}`} className="btn-link" style={btnStyle}>Back to Report</Link>
    </div>
  )

  return (
    <div className="volunteer-match page-container" style={{ maxWidth: '900px', marginTop: '2rem' }}>
      <Link to={`/report/${id}`} style={{ color: 'var(--text-dim)', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'color 0.2s', fontSize: '0.9rem' }}>
        <span>&larr;</span> Back to Report
      </Link>

      <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <h1 className="gradient-text" style={{ margin: '0 0 0.25rem 0', fontSize: '1.75rem' }}>Match Volunteers</h1>
        <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.95rem' }}>
          Finding best matches for: <strong style={{ color: 'var(--text-main)' }}>{report?.issueType?.toUpperCase()}</strong> at <strong style={{ color: 'var(--text-main)' }}>{report?.location}</strong>
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>No available volunteers found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {(matches || []).map((m, index) => (
            <div key={m.volunteerId} className="card match-card" style={matchCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                      {m.volunteerName}
                    </h3>
                    <span style={{ 
                      background: 'var(--accent-gradient)', 
                      color: 'white', 
                      padding: '0.15rem 0.6rem', 
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      boxShadow: 'var(--shadow-glow)'
                    }}>
                      {m.matchScore}% Match
                    </span>
                    {m.wellbeingStatus && (
                      <span className="status-tag" style={{
                        background: m.wellbeingStatus === 'Red' ? 'var(--critical-bg)' : m.wellbeingStatus === 'Yellow' ? 'var(--high-bg)' : 'var(--low-bg)',
                        color: m.wellbeingStatus === 'Red' ? 'var(--critical)' : m.wellbeingStatus === 'Yellow' ? 'var(--high)' : 'var(--low)',
                        border: `1px solid ${m.wellbeingStatus === 'Red' ? 'var(--critical)' : m.wellbeingStatus === 'Yellow' ? 'var(--high)' : 'var(--low)'}20`
                      }}>
                        {m.wellbeingStatus === 'Red' ? '🔴 Overworked' : m.wellbeingStatus === 'Yellow' ? '🟡 Heavy Load' : '🟢 Available'}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dim)', fontSize: '0.85rem', fontStyle: 'italic', display: 'flex', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1rem' }}>✨</span> {m.matchReason}
                  </p>
                  {m.wellbeingStatus && m.wellbeingStatus !== 'Green' && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: m.wellbeingStatus === 'Red' ? 'var(--critical-bg)' : 'var(--high-bg)', borderRadius: '8px', borderLeft: `4px solid ${m.wellbeingStatus === 'Red' ? 'var(--critical)' : 'var(--high)'}` }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: m.wellbeingStatus === 'Red' ? 'var(--critical)' : 'var(--high)', fontWeight: '500' }}>
                        <strong>Warning:</strong> {m.wellbeingReason}
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <button 
                    onClick={() => handleAssign(m)}
                    disabled={assigningId === m.volunteerId}
                    style={{...btnStyle, whiteSpace: 'nowrap'}}
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
  padding: '1rem 1.25rem',
  border: '1px solid var(--border)',
  transition: 'all 0.3s ease',
}

const btnStyle = {
  background: 'var(--bg-dark)',
  color: 'var(--text-main)',
  border: '1px solid var(--border)',
  padding: '0.6rem 1.2rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '0.9rem'
}
