import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToTasks } from '../firebase';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LiveImpactFeed() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToTasks(data => {
      setTasks(data || []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const impactTasks = tasks.filter(t => t.status === 'completed' && t.impactStatement)
    .sort((a, b) => {
      const timeA = a.completedAt?.toMillis?.() || new Date(a.completedAt).getTime() || 0;
      const timeB = b.completedAt?.toMillis?.() || new Date(b.completedAt).getTime() || 0;
      return timeB - timeA;
    });

  return (
    <div className="page-container">
      <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌍 Live Impact Feed</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Real-time verified impact from our global community</p>
        <Link to="/" style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
          &larr; Back to Home
        </Link>
      </header>

      {loading ? <LoadingSpinner /> : (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {impactTasks.length === 0 ? (
             <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>No verified impacts recorded yet.</p>
             </div>
          ) : (
            impactTasks.map(t => (
              <div key={t.id} className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--low)' }}>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                  "{t.impactStatement}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  <span>🦸 Volunteer: {t.volunteerName || 'Anonymous'}</span>
                  <span>📍 {t.reportLocation || 'Unknown'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
