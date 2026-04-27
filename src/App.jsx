import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { seedAll } from './scripts/seedData'
import './index.css'

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard'
import ReportDetail from './pages/Admin/ReportDetail'
import VolunteerMatch from './pages/Admin/VolunteerMatch'

function Home() {
  const [isSeeding, setIsSeeding] = useState(false)

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
    <div className="home-wrapper">
      <div className="home" style={{ maxWidth: '540px', width: '100%', textAlign: 'center', background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
        <h1 className="gradient-text" style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>KindConnect</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', fontSize: '1.05rem' }}>
          Smart Resource Allocation & Volunteer Coordination
        </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
        <Link to="/admin" style={roleBtnStyle} className="role-btn">
          <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>👨‍💼</div>
          <div>Admin / NGO Manager</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 'normal', marginTop: '0.4rem' }}>Manage reports, assign tasks, track progress</div>
        </Link>
        <div style={{...roleBtnStyle, opacity: 0.4, cursor: 'not-allowed'}}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📱</div>
          <div>Field Worker (Coming Soon)</div>
        </div>
        <div style={{...roleBtnStyle, opacity: 0.4, cursor: 'not-allowed'}}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🤝</div>
          <div>Volunteer (Coming Soon)</div>
        </div>
      </div>

      <button 
        onClick={handleSeed} 
        disabled={isSeeding}
        style={{
          background: 'rgba(255,255,255,0.05)',
          color: 'var(--text-dim)',
          border: '1px solid var(--border)',
          padding: '0.8rem 1.5rem',
          borderRadius: '8px',
          cursor: isSeeding ? 'not-allowed' : 'pointer',
          fontSize: '0.9rem'
        }}
      >
        {isSeeding ? '🌱 Seeding Test Data...' : '🌱 Seed Test Data'}
      </button>
      </div>
    </div>
  )
}

const roleBtnStyle = {
  background: 'var(--card-bg)',
  backdropFilter: 'blur(12px)',
  border: '1px solid var(--border)',
  padding: '1.5rem',
  borderRadius: '16px',
  color: 'var(--text-main)',
  textDecoration: 'none',
  fontSize: '1.1rem',
  fontWeight: '600',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: 'var(--shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/report/:id" element={<ReportDetail />} />
        <Route path="/admin/report/:id/match" element={<VolunteerMatch />} />
      </Routes>
    </Router>
  )
}

export default App
