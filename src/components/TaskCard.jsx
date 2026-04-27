import React, { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import LoadingSpinner from './LoadingSpinner';

export default function TaskCard({ task, onUpdateStatus }) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Graceful handling of missing fields in case data is incomplete
  const { 
    id, 
    reportSummary = 'No summary available', 
    reportLocation = 'Location not provided', 
    urgencyLevel = 'low', 
    status = 'assigned',
    reportId = null
  } = task || {};

  // Cleanup object URLs for preview to prevent memory leaks
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleNextStatus = () => {
    if (!id) return;
    
    if (status === 'assigned') {
      onUpdateStatus(id, 'accepted', reportId);
    } else if (status === 'accepted') {
      onUpdateStatus(id, 'in_progress', reportId);
    } else if (status === 'in_progress') {
      setIsCompleting(true); // Open the photo verification form
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompletionPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const submitCompletion = async () => {
    if (!completionPhoto) {
      setError('A proof photo is required to complete this task.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const storage = getStorage();
      const photoRef = ref(storage, `task-completions/${id}-${Date.now()}`);
      
      await uploadBytes(photoRef, completionPhoto);
      const photoUrl = await getDownloadURL(photoRef);
      
      // Pass the extra completion fields to the handler
      await onUpdateStatus(id, 'completed', reportId, {
        completionNote,
        completionPhotoUrl: photoUrl
      });
      
      setIsCompleting(false);
    } catch (err) {
      console.error('Failed to complete task:', err);
      setError('Failed to upload proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'assigned': 
        return { label: 'Accept Task', btnColor: 'var(--accent-primary)', btnText: 'white', badgeBg: 'rgba(129, 140, 248, 0.2)', badgeColor: '#818cf8' };
      case 'accepted': 
        return { label: 'Start Task', btnColor: '#f59e0b', btnText: 'white', badgeBg: 'rgba(245, 158, 11, 0.2)', badgeColor: '#fbbf24' };
      case 'in_progress': 
        return { label: 'Complete Task', btnColor: '#3b82f6', btnText: 'white', badgeBg: 'rgba(59, 130, 246, 0.2)', badgeColor: '#60a5fa' };
      case 'completed': 
        return { label: 'Completed', btnColor: 'transparent', btnText: 'var(--text-dim)', badgeBg: 'rgba(16, 185, 129, 0.2)', badgeColor: '#34d399' };
      default: 
        return { label: 'Unknown', btnColor: 'var(--border)', btnText: 'white', badgeBg: 'var(--border)', badgeColor: 'var(--text-dim)' };
    }
  };

  const config = getStatusConfig();
  
  const getUrgencyColor = () => {
    const level = urgencyLevel?.toLowerCase();
    if (level === 'critical') return { bg: 'rgba(220, 38, 38, 0.2)', text: '#f87171' };
    if (level === 'high') return { bg: 'rgba(234, 88, 12, 0.2)', text: '#fb923c' };
    if (level === 'medium') return { bg: 'rgba(202, 138, 4, 0.2)', text: '#facc15' };
    return { bg: 'rgba(22, 163, 74, 0.2)', text: '#4ade80' };
  };

  const urgencyConfig = getUrgencyColor();

  return (
    <div className="card" style={{
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    }}>
      {status === 'completed' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: '#10b981'
        }} />
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', lineHeight: '1.4', flex: 1 }}>
          {reportSummary}
        </h3>
        <span style={{
          background: urgencyConfig.bg,
          color: urgencyConfig.text,
          padding: '0.35rem 0.65rem',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap'
        }}>
          {urgencyLevel}
        </span>
      </div>

      <div style={{ color: 'var(--text-dim)', marginBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <span style={{ opacity: 0.7 }}>📍</span>
        <span style={{ lineHeight: '1.5' }}>{reportLocation}</span>
      </div>

      <div style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ opacity: 0.7 }}>🔑</span>
        <span style={{ userSelect: 'all', background: 'rgba(0,0,0,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace' }}>
          {id}
        </span>
      </div>

      {isCompleting && status === 'in_progress' ? (
        <div style={{ 
          marginTop: 'auto', 
          paddingTop: '1rem', 
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem' }}>Submit Proof of Completion</h4>
          
          <div>
            <textarea 
              placeholder="Add an optional completion note..."
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-dark)',
                color: 'var(--text-main)',
                minHeight: '60px',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>Proof Photo (Required) *</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-dark)',
                color: 'var(--text-main)',
                boxSizing: 'border-box'
              }}
            />
            {photoPreview && (
              <div style={{ marginTop: '0.5rem', borderRadius: '6px', overflow: 'hidden', height: '120px', border: '1px solid var(--border)' }}>
                <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            {error && <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</div>}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button 
              onClick={() => { setIsCompleting(false); setError(''); setPhotoPreview(null); setCompletionPhoto(null); }}
              disabled={uploading}
              style={{
                flex: 1,
                padding: '0.6rem',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                borderRadius: '6px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={submitCompletion}
              disabled={uploading}
              style={{
                flex: 2,
                padding: '0.6rem',
                background: uploading ? 'var(--bg-dark)' : 'var(--accent-gradient)',
                border: uploading ? '1px solid var(--border)' : 'none',
                color: uploading ? 'var(--text-dim)' : 'white',
                borderRadius: '6px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {uploading ? <><LoadingSpinner /> Uploading...</> : 'Confirm Completion'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: 'auto', 
          paddingTop: '1rem', 
          borderTop: '1px solid var(--border)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Status:</span>
            <span style={{
              background: config.badgeBg,
              color: config.badgeColor,
              padding: '0.35rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              {status?.replace('_', ' ')}
            </span>
          </div>

          {status === 'completed' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <span>✅</span> With Proof
            </div>
          )}

          {status !== 'completed' && (
            <button 
              onClick={handleNextStatus}
              style={{
                background: config.btnColor,
                color: config.btnText,
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.85rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              {config.label}
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
