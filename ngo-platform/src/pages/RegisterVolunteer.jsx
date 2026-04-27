import React, { useState } from 'react';
import { addVolunteer } from '../firebase';
import { SKILL_OPTIONS } from '../utils/constants';
import { useToast } from '../components/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RegisterVolunteer() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    skills: [],
    available: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredId, setRegisteredId] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (formData.skills.length === 0) newErrors.skills = 'Select at least one skill';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckboxChange = (skill) => {
    setFormData(prev => {
      if (prev.skills.includes(skill)) {
        return { ...prev, skills: prev.skills.filter(s => s !== skill) };
      }
      return { ...prev, skills: [...prev.skills, skill] };
    });
    if (errors.skills) setErrors(prev => ({ ...prev, skills: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }
    setIsSubmitting(true);
    
    try {
      const docId = await addVolunteer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        skills: formData.skills,
        available: formData.available,
        tasksCompleted: 0,
        reliabilityScore: 50
      });
      
      localStorage.setItem('volunteerIdNGO', docId);
      setRegisteredId(docId);
    } catch (err) {
      console.error(err);
      showToast('Failed to register. Please check your connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredId) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', backgroundColor: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#10b981', marginBottom: '1rem' }}>You're registered!</h2>
        <p style={{ color: '#4b5563', marginBottom: '1rem' }}>Your volunteer ID is:</p>
        <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', wordBreak: 'break-all', border: '1px dashed #d1d5db' }}>
          {registeredId}
        </div>
        <p style={{ color: '#6b7280' }}>It's been saved to this browser so you can access your tasks.</p>
        <button onClick={() => window.location.href='/tasks'} style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
          Go to My Tasks
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#111827' }}>Register as a Volunteer</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} noValidate>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Name *</label>
          <input type="text" value={formData.name} onChange={e => { setFormData({...formData, name: e.target.value}); setErrors({...errors, name: null}) }} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }} />
          {errors.name && <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.name}</div>}
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Phone (optional)</label>
          <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Location / Area *</label>
          <input type="text" value={formData.location} placeholder="e.g. Koramangala, Bengaluru" onChange={e => { setFormData({...formData, location: e.target.value}); setErrors({...errors, location: null}) }} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }} />
          {errors.location && <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.location}</div>}
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.75rem', color: '#374151' }}>Skills *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
            {SKILL_OPTIONS.map(skill => (
              <label key={skill} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#4b5563' }}>
                <input type="checkbox" checked={formData.skills.includes(skill)} onChange={() => handleCheckboxChange(skill)} />
                {skill.charAt(0).toUpperCase() + skill.slice(1)}
              </label>
            ))}
          </div>
          {errors.skills && <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.skills}</div>}
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold', cursor: 'pointer', color: '#111827' }}>
            <input type="checkbox" checked={formData.available} onChange={e => setFormData({...formData, available: e.target.checked})} style={{ width: '1.25rem', height: '1.25rem' }} />
            Currently available for tasks
          </label>
        </div>

        <button type="submit" disabled={isSubmitting} style={{ padding: '0.875rem', backgroundColor: isSubmitting ? '#9ca3af' : '#2563eb', color: 'white', fontWeight: 'bold', fontSize: '1rem', borderRadius: '4px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? <><LoadingSpinner /> Registering...</> : 'Complete Registration'}
        </button>
      </form>
    </div>
  );
}
