import React from 'react';
import { getUrgencyColor } from '../utils/urgencyHelpers';

export default function UrgencyBadge({ level, score }) {
  if (!level) return (
    <span style={{ 
      padding: '0.25rem 0.5rem', 
      borderRadius: '9999px', 
      fontSize: '0.875rem', 
      fontWeight: 'bold', 
      backgroundColor: '#9ca3af', 
      color: 'white' 
    }}>
      Pending
    </span>
  );
  
  const bgColor = getUrgencyColor(level);
  return (
    <span style={{ 
      backgroundColor: bgColor, 
      color: 'white', 
      padding: '0.25rem 0.75rem', 
      borderRadius: '9999px', 
      fontSize: '0.875rem', 
      fontWeight: 'bold',
      display: 'inline-block'
    }}>
      {level} {score !== undefined && score !== null ? score : ''}
    </span>
  );
}
