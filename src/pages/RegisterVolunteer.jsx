import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addVolunteer } from '../firebase';

export default function RegisterVolunteer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    skills: '',
    available: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const volunteerData = {
        name: formData.name,
        location: formData.location,
        skills: skillsArray,
        available: formData.available
      };

      // addVolunteer from firebase.js handles registeredAt, tasksCompleted, reliabilityScore
      const volunteerId = await addVolunteer(volunteerData);
      
      localStorage.setItem('volunteerId', volunteerId);
      
      // Navigate to tasks page
      navigate('/tasks');
    } catch (error) {
      console.error('Error registering volunteer:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          Join the Force
        </h2>
        <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginBottom: '2.5rem' }}>
          Register as a volunteer to start helping your community in times of need.
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: '500' }}>
              Full Name
            </label>
            <input 
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              style={{ 
                width: '100%', padding: '0.875rem', borderRadius: '8px', 
                border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', 
                color: 'var(--text-main)', fontSize: '1rem', boxSizing: 'border-box',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: '500' }}>
              Location
            </label>
            <input 
              type="text"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              style={{ 
                width: '100%', padding: '0.875rem', borderRadius: '8px', 
                border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', 
                color: 'var(--text-main)', fontSize: '1rem', boxSizing: 'border-box',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              placeholder="City, Neighborhood or Zip Code"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: '500' }}>
              Skills (comma separated)
            </label>
            <input 
              type="text"
              name="skills"
              required
              value={formData.skills}
              onChange={handleChange}
              style={{ 
                width: '100%', padding: '0.875rem', borderRadius: '8px', 
                border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', 
                color: 'var(--text-main)', fontSize: '1rem', boxSizing: 'border-box',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              placeholder="e.g. First Aid, Driving, Translation"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <input 
              type="checkbox"
              name="available"
              id="available"
              checked={formData.available}
              onChange={handleChange}
              style={{ 
                width: '1.25rem', height: '1.25rem', accentColor: 'var(--accent-primary)', cursor: 'pointer' 
              }}
            />
            <label htmlFor="available" style={{ color: 'var(--text-dim)', cursor: 'pointer', userSelect: 'none' }}>
              I am currently available to receive task assignments
            </label>
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--accent-gradient)',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '1.5rem',
              boxShadow: '0 4px 14px 0 rgba(129, 140, 248, 0.39)',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>
      </div>
      
      <style>{`
        input:focus {
          outline: none;
          border-color: var(--accent-primary) !important;
          box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.2) !important;
        }
      `}</style>
    </div>
  );
}
