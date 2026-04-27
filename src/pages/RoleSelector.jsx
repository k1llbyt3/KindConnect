import React from 'react';
import { useNavigate } from 'react-router-dom';

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#f3f4f6',
  fontFamily: 'sans-serif',
  padding: '2rem'
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '3rem'
};

const titleStyle = {
  fontSize: '2.5rem',
  color: '#111827',
  marginBottom: '0.5rem',
  fontWeight: 'bold'
};

const subtitleStyle = {
  fontSize: '1.125rem',
  color: '#6b7280'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '1.5rem',
  width: '100%',
  maxWidth: '1000px'
};

const cardStyle = {
  backgroundColor: 'white',
  padding: '2rem',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  border: '1px solid #e5e7eb'
};

const iconStyle = {
  fontSize: '3rem',
  marginBottom: '1rem'
};

const cardTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '600',
  color: '#111827',
  marginBottom: '0.5rem'
};

const cardDescStyle = {
  color: '#4b5563',
  lineHeight: '1.5'
};

export default function RoleSelector({ setRole }) {
  const navigate = useNavigate();

  const handleSelectRole = (role, path) => {
    if (setRole) setRole(role);
    navigate(path);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Smart Resource Allocation Platform</h1>
        <p style={subtitleStyle}>Select your role to continue</p>
      </div>

      <div style={gridStyle}>
        <div 
          style={cardStyle}
          onClick={() => handleSelectRole('field_worker', '/submit')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
          }}
        >
          <div style={iconStyle}>📋</div>
          <h2 style={cardTitleStyle}>Field Worker</h2>
          <p style={cardDescStyle}>Submit community issue reports from the field</p>
        </div>

        <div 
          style={cardStyle}
          onClick={() => handleSelectRole('admin', '/dashboard')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
          }}
        >
          <div style={iconStyle}>📊</div>
          <h2 style={cardTitleStyle}>Admin / NGO Manager</h2>
          <p style={cardDescStyle}>View dashboard, assign volunteers, track tasks</p>
        </div>

        <div 
          style={cardStyle}
          onClick={() => handleSelectRole('volunteer', '/register')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
          }}
        >
          <div style={iconStyle}>🙋</div>
          <h2 style={cardTitleStyle}>Volunteer</h2>
          <p style={cardDescStyle}>See your assigned tasks and update progress</p>
        </div>

        <div 
          style={cardStyle}
          onClick={() => handleSelectRole(null, '/verify-task')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
          }}
        >
          <div style={iconStyle}>✅</div>
          <h2 style={cardTitleStyle}>Verify Task</h2>
          <p style={cardDescStyle}>Independently submit proof for a completed task</p>
        </div>
      </div>
    </div>
  );
}
