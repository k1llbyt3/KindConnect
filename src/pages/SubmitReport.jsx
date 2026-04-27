import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addReport, updateReport } from '../firebase';
import { scoreUrgency } from '../gemini';
import LoadingSpinner from '../components/LoadingSpinner';

const inputStyle = {
  width: '100%',
  padding: '0.85rem',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg-dark)',
  color: 'var(--text-main)',
  fontSize: '1rem',
  boxSizing: 'border-box'
};

const errorStyle = {
  color: '#f87171', // critical red
  fontSize: '0.85rem',
  display: 'block',
  marginTop: '0.4rem'
};

export default function SubmitReport() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    issueType: '',
    description: '',
    location: '',
    severityRaw: '',
    affectedCount: '',
    photo: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const issueTypesList = ['water', 'food', 'medical', 'shelter', 'safety', 'infrastructure', 'other'];

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.issueType) newErrors.issueType = 'Issue type is required';
    if (!formData.description.trim() || formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    if (formData.description.trim().length > 800) {
      newErrors.description = 'Description must be under 800 characters';
    }
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.severityRaw) newErrors.severityRaw = 'Severity is required';
    if (!formData.affectedCount || Number(formData.affectedCount) < 1) {
      newErrors.affectedCount = 'Must be a positive integer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const reportPayload = {
        submittedBy: formData.name.trim(),
        issueType: formData.issueType,
        description: formData.description.trim(),
        location: formData.location.trim(),
        severityRaw: Number(formData.severityRaw),
        affectedCount: Number(formData.affectedCount),
        photoUrl: null, 
        aiStatus: 'pending',
        status: 'open'
      };

      const docId = await addReport(reportPayload);

      setSubmitSuccess(true);
      setIsSubmitting(false);

      // Async AI processing without blocking the UI
      scoreUrgency(reportPayload).then(aiResult => {
        if (aiResult) {
          updateReport(docId, {
            aiStatus: 'done',
            urgencyScore: aiResult.urgencyScore,
            urgencyLevel: aiResult.urgencyLevel,
            aiSummary: aiResult.aiSummary,
            aiActionCategory: aiResult.aiActionCategory,
            aiReason: aiResult.aiReason
          });
        }
      }).catch(err => {
        console.error("AI scoring failed, fallback will be handled separately:", err);
      });

    } catch (err) {
      console.error("Error adding report:", err);
      alert("Failed to submit report. Please check your network.");
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '', issueType: '', description: '', location: '', severityRaw: '', affectedCount: '', photo: null
    });
    setErrors({});
    setSubmitSuccess(false);
  };

  if (submitSuccess) {
    return (
      <div className="page-container" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem' }}>
        <h2 style={{ color: '#4ade80', marginBottom: '1rem', fontSize: '2rem' }}>Report Submitted Successfully!</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
          Your report has been received. Our AI is currently analyzing the urgency.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Back to Home
          </button>
          <button 
            onClick={handleReset} 
            style={{ background: 'var(--accent-gradient)', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 className="gradient-text" style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>Submit Report</h2>
        <p style={{ color: 'var(--text-dim)', margin: 0 }}>Report an emergency or resource request from the field.</p>
      </div>

      <div className="card" style={{ padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>Your Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} placeholder="Your full name" />
            {errors.name && <span style={errorStyle}>{errors.name}</span>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>Issue Type *</label>
            <select name="issueType" value={formData.issueType} onChange={handleChange} style={inputStyle}>
              <option value="">Select an issue type</option>
              {issueTypesList.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            {errors.issueType && <span style={errorStyle}>{errors.issueType}</span>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>Description *</label>
            <textarea name="description" value={formData.description} onChange={handleChange} style={{...inputStyle, minHeight: '120px', resize: 'vertical'}} placeholder="Provide details about the situation (min 20 chars)" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
              {errors.description ? <span style={errorStyle}>{errors.description}</span> : <span />}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{formData.description.trim().length}/800</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>Location *</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} style={inputStyle} placeholder="Specific location details" />
            {errors.location && <span style={errorStyle}>{errors.location}</span>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>Severity *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {[1, 2, 3, 4, 5].map(val => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                  <input type="radio" name="severityRaw" value={val} checked={formData.severityRaw === String(val)} onChange={handleChange} style={{ cursor: 'pointer' }}/>
                  {val} {val === 1 ? '(Minor)' : val === 5 ? '(Critical)' : ''}
                </label>
              ))}
            </div>
            {errors.severityRaw && <span style={errorStyle}>{errors.severityRaw}</span>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>People Affected *</label>
            <input type="number" name="affectedCount" value={formData.affectedCount} onChange={handleChange} style={inputStyle} min="1" placeholder="Number of people affected" />
            {errors.affectedCount && <span style={errorStyle}>{errors.affectedCount}</span>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>Photo (Optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setFormData(prev => ({...prev, photo: e.target.files[0]}))} style={inputStyle} />
          </div>

          <button type="submit" disabled={isSubmitting} style={{
            background: isSubmitting ? 'var(--bg-dark)' : 'var(--accent-gradient)',
            color: isSubmitting ? 'var(--text-dim)' : 'white', 
            border: isSubmitting ? '1px solid var(--border)' : 'none', 
            padding: '1rem', 
            borderRadius: '8px',
            fontSize: '1.1rem', 
            fontWeight: 'bold', 
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginTop: '1rem',
            transition: 'all 0.2s ease'
          }}>
            {isSubmitting ? <><LoadingSpinner /> Submitting...</> : 'Submit Report'}
          </button>

        </form>
      </div>
    </div>
  );
}
