import React from 'react';

export default function StatusBadge({ status }) {
  let bgColor = '#9ca3af'; // default gray
  if (status === 'open') bgColor = '#ef4444'; // red
  if (status === 'assigned') bgColor = '#3b82f6'; // blue
  if (status === 'accepted') bgColor = '#8b5cf6'; // purple
  if (status === 'in_progress') bgColor = '#f97316'; // orange
  if (status === 'completed') bgColor = '#10b981'; // green

  return (
    <span style={{ 
      backgroundColor: bgColor, 
      color: 'white', 
      padding: '0.25rem 0.5rem', 
      borderRadius: '4px', 
      fontSize: '0.75rem', 
      fontWeight: 'bold',
      textTransform: 'uppercase'
    }}>
      {status ? status.replace(/_/g, ' ') : 'UNKNOWN'}
    </span>
  );
}
