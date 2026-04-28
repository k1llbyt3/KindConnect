import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PartnerNGO() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'clusters'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setClusters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error(err);
      if (err.message.includes('index')) {
        alert('⚠️ Firestore index required for Clusters! Please check the console link.');
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="page-container">
      <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🤝 Partner NGO Portal</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Collaborate on large-scale crisis clusters</p>
        <Link to="/" style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
          &larr; Back to Home
        </Link>
      </header>

      {loading ? <LoadingSpinner /> : (
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gap: '1.5rem' }}>
          {clusters.length === 0 ? (
             <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>No crisis clusters currently active.</p>
             </div>
          ) : (
            clusters.map(c => (
              <div key={c.id} className="card" style={{ padding: '1.5rem', border: '1px solid var(--high)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>
                      {c.issueType?.toUpperCase()} CLUSTER — {c.location}
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                      <span>🔴 Urgency: {c.urgencyLevel}</span>
                      <span>👥 Affected: {c.combinedAffectedCount}</span>
                      <span>📑 Reports: {c.reportIds?.length || 0}</span>
                    </div>
                  </div>
                  <button style={{
                    background: 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}>
                    Offer Resources
                  </button>
                </div>
                <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                  <strong style={{ color: 'var(--high)' }}>AI Cluster Analysis:</strong> {c.clusterReason}
                </div>

                {c.predictedResources && c.predictedResources.length > 0 && (
                  <div style={{ marginTop: '1rem', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📦 AI Predictive Resource Requirements
                    </h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                      Estimated needs for the first 48 hours for {c.combinedAffectedCount} affected individuals.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                      {c.predictedResources.map((res, i) => (
                        <div key={i} style={{ background: 'var(--card-bg)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '0.8rem', color: res.importance === 'High' ? '#f87171' : 'var(--accent-secondary)', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                            {res.importance?.toUpperCase()} PRIORITY
                          </div>
                          <div style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{res.item}</div>
                          <div style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                            {res.quantity} <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>{res.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
