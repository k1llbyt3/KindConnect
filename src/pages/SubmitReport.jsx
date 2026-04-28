import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addReport, updateReport, getReports, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { scoreUrgency, detectReportCluster } from '../gemini';
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
    photo: null,
    customIssueType: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const issueTypesList = ['water', 'food', 'medical', 'shelter', 'safety', 'infrastructure', 'other'];

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.issueType) newErrors.issueType = 'Issue type is required';
    if (formData.issueType === 'other' && !formData.customIssueType.trim()) {
      newErrors.customIssueType = 'Please specify the issue type';
    }
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
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      ...(name === 'issueType' && value !== 'other' ? { customIssueType: '' } : {})
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    if (name === 'issueType' && errors.customIssueType) setErrors(prev => ({ ...prev, customIssueType: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const reportPayload = {
        submittedBy: formData.name.trim(),
        issueType: formData.issueType === 'other' ? formData.customIssueType.trim() : formData.issueType,
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
      (async () => {
        try {
          const aiResult = await scoreUrgency(reportPayload);
          let finalUpdate = {
            aiStatus: 'done',
            ...(aiResult || {})
          };

          // USP 2: Report Clustering
          try {
            const allReports = await getReports();
            const recentOpen = allReports.filter(r => r.status === 'open' && r.id !== docId);
            const reportWithId = { id: docId, ...reportPayload, ...finalUpdate };
            const clusterRes = await detectReportCluster(reportWithId, recentOpen);
            
            if (clusterRes && clusterRes.matchedReportIds && clusterRes.matchedReportIds.length > 0) {
              const clusterPayload = {
                createdAt: serverTimestamp(),
                reportIds: [docId, ...clusterRes.matchedReportIds],
                combinedAffectedCount: clusterRes.combinedAffectedCount,
                issueType: reportPayload.issueType,
                location: reportPayload.location,
                urgencyLevel: aiResult?.urgencyLevel || 'Medium',
                clusterReason: clusterRes.clusterReason,
                status: 'open'
              };
              const clusterRef = await addDoc(collection(db, 'clusters'), clusterPayload);
              const clusterId = clusterRef.id;

              finalUpdate.clusterId = clusterId;
              finalUpdate.isClusterPrimary = true;
              finalUpdate.combinedAffectedCount = clusterRes.combinedAffectedCount;

              // Update matched reports
              for (const matchedId of clusterRes.matchedReportIds) {
                await updateReport(matchedId, {
                  clusterId: clusterId,
                  isClusterPrimary: false
                });
              }
            }
          } catch (e) {
            console.error("Clustering failed", e);
          }

          await updateReport(docId, finalUpdate);
        } catch (err) {
          console.error("AI processing failed:", err);
          await updateReport(docId, { aiStatus: 'done' });
        }
      })();

    } catch (err) {
      console.error("Error adding report:", err);
      alert("Failed to submit report. Please check your network.");
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '', issueType: '', description: '', location: '', severityRaw: '', affectedCount: '', photo: null, customIssueType: ''
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
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', position: 'relative', minHeight: '60px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ position: 'absolute', left: '0', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
        >
          <span>&larr;</span> Back
        </button>
        <div style={{ width: '100%', textAlign: 'center' }}>
          <h2 className="gradient-text" style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Submit Report</h2>
          <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.95rem' }}>Report an emergency or resource request from the field.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          <div style={{ gridColumn: '1 / 2' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Your Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} placeholder="Your full name" />
            {errors.name && <span style={errorStyle}>{errors.name}</span>}
          </div>

          <div style={{ gridColumn: '2 / 3' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Issue Type *</label>
            <select name="issueType" value={formData.issueType} onChange={handleChange} style={inputStyle}>
              <option value="">Select an issue type</option>
              {issueTypesList.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            {errors.issueType && <span style={errorStyle}>{errors.issueType}</span>}
          </div>

          {formData.issueType === 'other' && (
            <div style={{ gridColumn: '1 / 3' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Specify Issue Type *</label>
              <input 
                type="text" 
                name="customIssueType" 
                value={formData.customIssueType} 
                onChange={handleChange} 
                style={inputStyle} 
                placeholder="What is the type of emergency?" 
              />
              {errors.customIssueType && <span style={errorStyle}>{errors.customIssueType}</span>}
            </div>
          )}

          <div style={{ gridColumn: '1 / 3' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Description *</label>
            <textarea name="description" value={formData.description} onChange={handleChange} style={{...inputStyle, minHeight: '100px', resize: 'vertical'}} placeholder="Provide details about the situation (min 20 chars)" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
              {errors.description ? <span style={errorStyle}>{errors.description}</span> : <span />}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{formData.description.trim().length}/800</span>
            </div>
          </div>

          <div style={{ gridColumn: '1 / 2' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Location *</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} style={inputStyle} placeholder="Specific location details" />
            {errors.location && <span style={errorStyle}>{errors.location}</span>}
          </div>

          <div style={{ gridColumn: '2 / 3' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>People Affected *</label>
            <input type="number" name="affectedCount" value={formData.affectedCount} onChange={handleChange} style={inputStyle} min="1" placeholder="Number of people affected" />
            {errors.affectedCount && <span style={errorStyle}>{errors.affectedCount}</span>}
          </div>

          <div style={{ gridColumn: '1 / 3' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Severity *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', padding: '0.5rem 0' }}>
              {[1, 2, 3, 4, 5].map(val => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  <input type="radio" name="severityRaw" value={val} checked={formData.severityRaw === String(val)} onChange={handleChange} style={{ cursor: 'pointer', transform: 'scale(1.2)' }}/>
                  {val} {val === 1 ? '(Minor)' : val === 5 ? '(Critical)' : ''}
                </label>
              ))}
            </div>
            {errors.severityRaw && <span style={errorStyle}>{errors.severityRaw}</span>}
          </div>

          <div style={{ gridColumn: '1 / 3' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Photo (Optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setFormData(prev => ({...prev, photo: e.target.files[0]}))} style={inputStyle} />
          </div>

          <button type="submit" disabled={isSubmitting} style={{
            gridColumn: '1 / 3',
            background: isSubmitting ? 'var(--bg-dark)' : 'var(--accent-gradient)',
            color: isSubmitting ? 'var(--text-dim)' : 'white', 
            border: isSubmitting ? '1px solid var(--border)' : 'none', 
            padding: '0.85rem', 
            borderRadius: '8px',
            fontSize: '1rem', 
            fontWeight: 'bold', 
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginTop: '0.5rem',
            transition: 'all 0.2s ease'
          }}>
            {isSubmitting ? <><LoadingSpinner /> Submitting...</> : 'Submit Report'}
          </button>

        </form>
      </div>
    </div>
  );
}
