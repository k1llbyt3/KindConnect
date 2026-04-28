import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

export default function VerifyTask() {
  const navigate = useNavigate();
  const [taskId, setTaskId] = useState('');
  const [completionNote, setCompletionNote] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!taskId.trim()) {
      setError('Task ID is required');
      return;
    }
    if (!photoFile) {
      setError('A proof photo is required');
      return;
    }

    setLoading(true);

    try {
      // 1. Check if task exists
      const taskRef = doc(db, 'tasks', taskId.trim());
      const taskSnap = await getDoc(taskRef);

      if (!taskSnap.exists()) {
        setError('Invalid Task ID. Please check and try again.');
        setLoading(false);
        return;
      }

      // 2. Upload photo
      const storage = getStorage();
      const photoRef = ref(storage, `task-completions/${taskSnap.id}-${Date.now()}.jpg`);
      await uploadBytes(photoRef, photoFile);
      const photoUrl = await getDownloadURL(photoRef);

      // 3. Update task
      await updateDoc(taskRef, {
        status: 'completed',
        completionNote: completionNote.trim() || '',
        completionPhotoUrl: photoUrl
      });

      // 4. Update related report
      const taskData = taskSnap.data();
      if (taskData.reportId) {
        const reportRef = doc(db, 'reports', taskData.reportId);
        await updateDoc(reportRef, {
          status: 'completed'
        });
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error verifying task:', err);
      setError('An error occurred during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-container" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem' }}>
        <h2 style={{ color: '#10b981', marginBottom: '1rem', fontSize: '2rem' }}>✅ Task verified successfully</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
          The task and its associated report have been marked as completed.
        </p>
        <Link 
          to="/" 
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.8rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', position: 'relative', minHeight: '60px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ position: 'absolute', left: '0', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
        >
          <span>&larr;</span> Back
        </button>
        <div style={{ width: '100%', textAlign: 'center' }}>
          <h2 className="gradient-text" style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Verify Task</h2>
          <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.95rem' }}>Provide a Task ID and proof photo to mark it as completed.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          <div style={{ gridColumn: '1 / 2' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Task ID *</label>
            <input 
              type="text" 
              value={taskId} 
              onChange={(e) => setTaskId(e.target.value)} 
              disabled={loading}
              style={{
                width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)',
                background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '1rem', boxSizing: 'border-box'
              }} 
              placeholder="Paste Task ID here" 
            />
          </div>

          <div style={{ gridColumn: '2 / 3' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Proof Photo *</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              disabled={loading}
              style={{
                width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)',
                background: 'var(--bg-dark)', color: 'var(--text-main)', boxSizing: 'border-box'
              }} 
            />
            {photoPreview && (
              <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', height: '120px', border: '1px solid var(--border)' }}>
                <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>

          <div style={{ gridColumn: '1 / 3' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Completion Note (Optional)</label>
            <textarea 
              value={completionNote} 
              onChange={(e) => setCompletionNote(e.target.value)} 
              disabled={loading}
              style={{
                width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)',
                background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '1rem', minHeight: '80px',
                resize: 'vertical', boxSizing: 'border-box'
              }} 
              placeholder="Add any extra details..." 
            />
          </div>

          {error && <div style={{ gridColumn: '1 / 3', color: '#f87171', fontSize: '0.9rem', background: 'rgba(248, 113, 113, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            gridColumn: '1 / 3',
            background: loading ? 'var(--bg-dark)' : 'var(--accent-gradient)',
            color: loading ? 'var(--text-dim)' : 'white', 
            border: loading ? '1px solid var(--border)' : 'none', 
            padding: '0.85rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', 
            cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', 
            alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', transition: 'all 0.2s ease'
          }}>
            {loading ? <><LoadingSpinner /> Verifying...</> : 'Verify Task'}
          </button>

        </form>
      </div>
    </div>
  );
}
