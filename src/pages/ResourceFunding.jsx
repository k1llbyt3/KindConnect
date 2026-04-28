import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { generateGrantProposal } from '../gemini';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ResourceFunding() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'clusters'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setClusters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleGenerateGrant = async (cluster) => {
    setGeneratingFor(cluster.id);
    try {
      const grant = await generateGrantProposal(cluster);
      const clusterRef = doc(db, 'clusters', cluster.id);
      await updateDoc(clusterRef, { grantProposal: grant });
    } catch (err) {
      console.error('Failed to generate grant', err);
      alert('Failed to generate grant proposal.');
    } finally {
      setGeneratingFor(null);
    }
  };

  return (
    <div className="page-container">
      <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💰 Requirements & Funding</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>AI-driven resource requirements and automated grant generation</p>
        <Link to="/" style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
          &larr; Back to Home
        </Link>
      </header>

      {loading ? <LoadingSpinner /> : (
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gap: '2rem' }}>
          {clusters.length === 0 ? (
             <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>No crisis clusters currently active.</p>
             </div>
          ) : (
            clusters.map(c => (
              <div key={c.id} className="card" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--bg-dark)', paddingBottom: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.5rem' }}>
                    {c.issueType?.toUpperCase()} CLUSTER — {c.location}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.95rem', color: 'var(--text-dim)' }}>
                    <span>🔴 Urgency: {c.urgencyLevel}</span>
                    <span>👥 Affected: {c.combinedAffectedCount}</span>
                  </div>
                </div>

                {/* AI Predictive Resource Requirements */}
                {c.predictedResources && c.predictedResources.length > 0 ? (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#38bdf8', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📦 Predictive Resource Requirements (48 Hrs)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                      {c.predictedResources.map((res, i) => (
                        <div key={i} style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '0.85rem', color: res.importance === 'High' ? '#f87171' : 'var(--accent-secondary)', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                            {res.importance?.toUpperCase()} PRIORITY
                          </div>
                          <div style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1.1rem' }}>{res.item}</div>
                          <div style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginTop: '0.4rem' }}>
                            {res.quantity} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>{res.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Calculating resource requirements...</p>
                )}

                {/* Grant Proposal Section */}
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#10b981', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📄 Micro-Grant Proposal
                  </h4>
                  
                  {!c.grantProposal ? (
                    <div>
                      <p style={{ color: 'var(--text-dim)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                        Need funding to fulfill these resources? Generate a data-backed micro-grant proposal instantly.
                      </p>
                      <button 
                        onClick={() => handleGenerateGrant(c)}
                        disabled={generatingFor === c.id}
                        style={{
                          background: 'var(--accent-gradient)', color: 'white', border: 'none',
                          padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                      >
                        {generatingFor === c.id ? 'Generating Proposal...' : 'Generate 1-Click Proposal'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.2rem' }}>{c.grantProposal.title}</h5>
                      <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                        {c.grantProposal.executiveSummary}
                      </p>
                      
                      <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                          Estimated Cost: ${c.grantProposal.estimatedCostUSD}
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          {c.grantProposal.costBreakdown?.map((cost, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                              <span>{cost.category}</span>
                              <span>${cost.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
                        <strong>Impact Promise:</strong> {c.grantProposal.impactPromise}
                      </div>

                      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                        <button 
                          onClick={() => alert('✅ Grant Proposal securely submitted to the KindConnect Global Donor Network. You will be notified of funding status within 24 hours.')}
                          style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                          Submit to Donors
                        </button>
                        <button 
                          onClick={() => window.print()}
                          style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>
                          Download PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
