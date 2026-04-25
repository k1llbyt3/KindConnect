import { useState, useEffect } from 'react'
import { subscribeToReports, getVolunteers } from './firebase'
import { seedAll } from './scripts/seedData'
import './index.css'

function App() {
  const [reports, setReports] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    // Real-time listener for reports
    const unsub = subscribeToReports(setReports)
    // One-time fetch for volunteers
    getVolunteers().then(setVolunteers)
    return () => unsub()
  }, [])

  const handleSeed = async () => {
    setIsSeeding(true)
    try {
      await seedAll()
      alert('✅ Seeding complete! Check your console for details.')
    } catch (err) {
      console.error("❌ Seed failed:", err);
      if (err.message.includes("Database '(default)' not found")) {
        alert("⚠️ FIRESTORE NOT INITIALIZED: Please go to Firebase Console and click 'Create Database' first.");
      } else if (err.code === 'permission-denied') {
        alert("⚠️ PERMISSION DENIED: Check your Firestore Rules. Make sure they allow writes.");
      } else {
        alert("❌ Error: " + err.message);
      }
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="header">
        <h1>KindConnect <span style={{fontSize: '1rem', color: 'var(--text-dim)'}}>— Base Dashboard</span></h1>
        <button 
          className="btn-seed" 
          onClick={handleSeed} 
          disabled={isSeeding}
        >
          {isSeeding ? '🌱 Seeding...' : '🌱 Seed Test Data'}
        </button>
      </header>

      <div className="grid">
        <section>
          <h2 className="section-title">Reports ({reports.length})</h2>
          <div className="reports-list">
            {reports.map(r => (
              <div key={r.id} className="report-card" style={{borderLeft: `4px solid var(--${r.urgencyLevel?.toLowerCase() || 'border'})`}}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <strong>{r.issueType.toUpperCase()}</strong>
                  <span>{r.urgencyLevel || 'Scoring...'}</span>
                </div>
                <p style={{margin: '10px 0', color: 'var(--text-dim)'}}>{r.description}</p>
                <div style={{fontSize: '0.8rem'}}>📍 {r.location}</div>
              </div>
            ))}
          </div>
        </section>

        <aside>
          <div className="volunteers-panel">
            <h2 className="section-title">Volunteers ({volunteers.length})</h2>
            {volunteers.map(v => (
              <div key={v.id} style={{padding: '10px 0', borderBottom: '1px solid var(--border)'}}>
                <div>{v.name}</div>
                <div style={{fontSize: '0.7rem', color: 'var(--accent-secondary)'}}>{v.skills.join(', ')}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App
