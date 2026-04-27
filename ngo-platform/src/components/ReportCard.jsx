import React from 'react';
import { useNavigate } from 'react-router-dom';
import UrgencyBadge from './UrgencyBadge';
import StatusBadge from './StatusBadge';
import LoadingSpinner from './LoadingSpinner';
import { timeAgo } from '../utils/urgencyHelpers';

const cardStyle = {
  backgroundColor: 'white',
  padding: '1.5rem',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb',
  marginBottom: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  cursor: 'pointer',
  transition: 'box-shadow 0.2s'
};

const topRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
};

export default function ReportCard({ report }) {
  const navigate = useNavigate();
  
  const isCritical = report.urgencyLevel === 'Critical';
  const isPending = report.aiStatus === 'pending';
  
  const handleCardClick = () => {
    navigate(`/report/${report.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      style={{
        ...cardStyle,
        borderLeft: isCritical ? '4px solid #dc2626' : cardStyle.borderLeft
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
    >
      <style>
        {`@keyframes pulse-urgency { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}
      </style>

      <div style={topRowStyle}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ animation: isPending ? 'pulse-urgency 1.5s infinite ease-in-out' : 'none' }}>
            <UrgencyBadge level={report.urgencyLevel} score={report.urgencyScore} />
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '1.125rem', color: '#111827', textTransform: 'capitalize' }}>
            {report.issueType}
          </span>
        </div>
        <StatusBadge status={report.status} />
      </div>

      <div style={{ color: '#4b5563', fontSize: '0.875rem' }}>
        <strong>Location:</strong> {report.location}
      </div>

      <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '4px', border: '1px solid #f3f4f6' }}>
        {isPending ? (
          <span style={{ color: '#6b7280', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
            <LoadingSpinner /> AI Analysis in progress...
          </span>
        ) : (
          <span style={{ color: '#374151' }}>{report.aiSummary || report.description}</span>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
        <span>👥 {report.affectedCount} people affected</span>
        <span>{timeAgo(report.createdAt)}</span>
      </div>
      
      <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/report/${report.id}`); }}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}
