import React from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function RoleSelector({ setRole }) {
  const navigate = useNavigate();

  const handleSelectRole = (role, path) => {
    if (setRole) setRole(role);
    navigate(path);
  };

  return (
    <div className="home-wrapper">
      <div className="page-container" style={{ textAlign: 'center', maxWidth: '1000px', padding: '1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Smart Resource Allocation</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1rem', marginBottom: '1.5rem' }}>Select your role to continue</p>
          <button 
            onClick={async () => {
              try {
                await addDoc(collection(db, 'tasks'), {
                  issueType: 'medical', reportLocation: 'Northside Clinic', volunteerName: 'Dr. Sarah Jenkins',
                  status: 'completed', urgencyLevel: 'Critical', affectedCount: 45, hoursToComplete: 1.5,
                  impactStatement: 'On today, volunteer Dr. Sarah Jenkins provided emergency medical triage at Northside Clinic, stabilizing 45 critically injured patients.',
                  createdAt: serverTimestamp(), completedAt: serverTimestamp()
                });
                await addDoc(collection(db, 'clusters'), {
                  issueType: 'shelter', location: 'Downtown Evacuation Center', combinedAffectedCount: 320,
                  urgencyLevel: 'Critical', clusterReason: 'Multiple reports of displaced families arriving at the downtown center without basic supplies.',
                  createdAt: serverTimestamp(), status: 'open',
                  predictedResources: [
                    { item: 'Emergency Blankets', quantity: 320, unit: 'Pieces', importance: 'High' },
                    { item: 'Drinking Water', quantity: 960, unit: 'Liters', importance: 'High' },
                    { item: 'First Aid Kits', quantity: 30, unit: 'Kits', importance: 'Medium' }
                  ]
                });
                alert('Demo data seeded successfully! Check the Live Impact Feed and Funding tabs.');
              } catch (e) {
                alert('Error seeding data: ' + e.message);
                console.error(e);
              }
            }}
            style={{ background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 'bold' }}
          >
            🌱 Seed Demo Data
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '1.5rem' 
        }}>
          <div 
            className="card"
            style={{ padding: '1.5rem 1.2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={() => handleSelectRole('field_worker', '/submit')}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Field Worker</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>Submit community issue reports from the field</p>
          </div>

          <div 
            className="card"
            style={{ padding: '1.5rem 1.2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={() => handleSelectRole('admin', '/dashboard')}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Admin / Manager</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>View dashboard, assign volunteers, track tasks</p>
          </div>

          <div 
            className="card"
            style={{ padding: '1.5rem 1.2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={() => handleSelectRole('volunteer', '/register')}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🙋</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Volunteer</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>See your assigned tasks and update progress</p>
          </div>

          <div 
            className="card"
            style={{ padding: '1.5rem 1.2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={() => handleSelectRole(null, '/verify-task')}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Verify Task</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>Independently submit proof for a completed task</p>
          </div>

          <div 
            className="card"
            style={{ padding: '1.5rem 1.2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={() => handleSelectRole('public', '/impact-feed')}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌍</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Live Impact Feed</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>View real-time crisis resolutions and community impact</p>
          </div>

          <div 
            className="card"
            style={{ padding: '1.5rem 1.2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={() => handleSelectRole('partner', '/partner')}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤝</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Partner NGO</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>Coordinate resources and collaborate on large-scale clusters</p>
          </div>

          <div 
            className="card"
            style={{ padding: '1.5rem 1.2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
            onClick={() => handleSelectRole(null, '/funding')}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💰</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#10b981' }}>Requirements & Funding</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>View predictive resource needs and generate micro-grants</p>
          </div>
        </div>
      </div>
    </div>
  );
}
