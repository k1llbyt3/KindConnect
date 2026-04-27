import React, { useState } from 'react';
import { ISSUE_TYPES } from '../utils/constants';
import { addReport, updateReport } from '../firebase';
import { scoreUrgency } from '../gemini';
import { fallbackUrgencyScore } from '../utils/fallbackScore';
import { getUrgencyLevel } from '../utils/urgencyHelpers';
import { useToast } from '../components/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: 'white',
  padding: '2rem',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const labelStyle = {
  display: 'block',
  fontWeight: '600',
  marginBottom: '0.5rem',
  color: '#374151'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '1rem',
  boxSizing: 'border-box'
};

const errorStyle = {
  color: '#dc2626',
  fontSize: '0.875rem',
  marginTop: '0.25rem'
};

const buttonStyle = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer'
};

const disabledButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#9ca3af',
  cursor: 'not-allowed'
};

export default function SubmitReport() {
  const { showToast } = useToast();
  const initialFormState = {
    name: '',
    issueType: '',
    description: '',
    location: '',
    severity: '',
    affectedCount: '',
    photo: null
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validate = () => {
    const newErrors = {};
    const tName = formData.name.trim();
    const tDesc = formData.description.trim();
    const tLoc = formData.location.trim();

    if (!tName) newErrors.name = 'Name is required';
    if (!formData.issueType) newErrors.issueType = 'Issue type is required';
    
    if (!tDesc) {
      newErrors.description = 'Description is required';
    } else if (tDesc.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    if (!tLoc) newErrors.location = 'Location is required';
    if (!formData.severity) newErrors.severity = 'Severity is required';
    
    if (!formData.affectedCount) {
      newErrors.affectedCount = 'Affected count is required';
    } else if (isNaN(formData.affectedCount) || Number(formData.affectedCount) < 1) {
      newErrors.affectedCount = 'Must be a positive integer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, photo: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const reportPayload = {
        name: formData.name.trim(),
        issueType: formData.issueType,
        description: formData.description.trim(),
        location: formData.location.trim(),
        severityRaw: Number(formData.severity),
        affectedCount: Number(formData.affectedCount),
        photoUrl: null, // TODO: Implement Firebase Storage upload later
        status: 'open',
        aiStatus: 'pending',
        urgencyScore: null
      };

      const docId = await addReport(reportPayload);

      setSubmitSuccess(true);
      setIsSubmitting(false);

      // Background AI Processing with 8-second timeout limit
      const scorePromise = scoreUrgency(reportPayload);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 8000)
      );

      Promise.race([scorePromise, timeoutPromise])
        .then(aiResult => {
          updateReport(docId, {
            aiStatus: 'done',
            urgencyScore: aiResult.urgencyScore,
            urgencyLevel: aiResult.urgencyLevel,
            aiSummary: aiResult.aiSummary,
            aiActionCategory: aiResult.aiActionCategory,
            aiReason: aiResult.aiReason
          });
        })
        .catch(err => {
          console.error("AI scoring failed:", err);
          if (err.message === 'TIMEOUT') {
            showToast('AI scoring took too long — basic score used.', 'error');
          } else {
            showToast('Using fallback scoring', 'error');
          }
          
          const fallbackScore = fallbackUrgencyScore(
            reportPayload.severityRaw,
            reportPayload.affectedCount,
            reportPayload.issueType
          );
          updateReport(docId, {
            aiStatus: 'failed',
            urgencyScore: fallbackScore,
            urgencyLevel: getUrgencyLevel(fallbackScore)
          });
        });

    } catch (err) {
      console.error("Error adding report:", err);
      showToast("Failed to submit report. Please check your network.", "error");
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setErrors({});
    setSubmitSuccess(false);
  };

  if (submitSuccess) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h2 style={{ color: '#16a34a', marginBottom: '1rem' }}>Report submitted!</h2>
        <p style={{ color: '#4b5563', marginBottom: '2rem' }}>AI is analyzing urgency...</p>
        <button onClick={handleReset} style={buttonStyle}>
          Submit Another Report
        </button>
      </div>
    );
  }

  const descLength = formData.description.trim().length;
  const isDescInvalid = descLength > 0 && descLength < 20;

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#111827' }}>Submit Field Report</h2>
      <form onSubmit={handleSubmit} style={formStyle} noValidate>
        
        {/* Name */}
        <div>
          <label style={labelStyle}>Your Name *</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            style={inputStyle} 
          />
          {errors.name && <div style={errorStyle}>{errors.name}</div>}
        </div>

        {/* Issue Type */}
        <div>
          <label style={labelStyle}>Issue Type *</label>
          <select 
            name="issueType" 
            value={formData.issueType} 
            onChange={handleChange} 
            style={inputStyle}
          >
            <option value="">Select issue type</option>
            {ISSUE_TYPES.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          {errors.issueType && <div style={errorStyle}>{errors.issueType}</div>}
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description *</label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
            maxLength={800}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            {errors.description ? (
              <span style={errorStyle}>{errors.description}</span>
            ) : (
              <span />
            )}
            <span style={{ fontSize: '0.875rem', color: isDescInvalid ? '#dc2626' : '#6b7280' }}>
              {descLength}/800 {isDescInvalid && '(min 20)'}
            </span>
          </div>
        </div>

        {/* Location */}
        <div>
          <label style={labelStyle}>Location *</label>
          <input 
            type="text" 
            name="location" 
            value={formData.location} 
            onChange={handleChange} 
            placeholder="e.g. Village near KR Puram, Bengaluru"
            style={inputStyle} 
          />
          {errors.location && <div style={errorStyle}>{errors.location}</div>}
        </div>

        {/* Severity */}
        <div>
          <label style={labelStyle}>Severity *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
            {[
              { val: 1, label: '1=Minor' },
              { val: 2, label: '2=Low' },
              { val: 3, label: '3=Moderate' },
              { val: 4, label: '4=Severe' },
              { val: 5, label: '5=Life-threatening' }
            ].map(item => (
              <label key={item.val} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="severity" 
                  value={item.val} 
                  checked={formData.severity === String(item.val)} 
                  onChange={handleChange} 
                />
                {item.label}
              </label>
            ))}
          </div>
          {errors.severity && <div style={errorStyle}>{errors.severity}</div>}
        </div>

        {/* Affected Count */}
        <div>
          <label style={labelStyle}>Estimated people affected *</label>
          <input 
            type="number" 
            name="affectedCount" 
            value={formData.affectedCount} 
            onChange={handleChange} 
            min="1"
            style={inputStyle} 
          />
          {errors.affectedCount && <div style={errorStyle}>{errors.affectedCount}</div>}
        </div>

        {/* Photo */}
        <div>
          <label style={labelStyle}>Photo (optional)</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            style={inputStyle} 
          />
        </div>

        {/* Submit */}
        <button 
          type="submit" 
          disabled={isSubmitting} 
          style={isSubmitting ? disabledButtonStyle : buttonStyle}
        >
          {isSubmitting ? <><LoadingSpinner /> Submitting report...</> : 'Submit Report'}
        </button>

      </form>
    </div>
  );
}
