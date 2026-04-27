import React from 'react';

export default function LoadingSpinner() {
  return (
    <span style={{ 
      display: 'inline-block', 
      width: '1em', 
      height: '1em', 
      border: '0.15em solid rgba(0,0,0,0.1)', 
      borderRadius: '50%', 
      borderTopColor: 'currentColor', 
      animation: 'spin 1s linear infinite',
      verticalAlign: 'middle',
      marginRight: '0.5rem'
    }}>
      <style>
        {`@keyframes spin { to { transform: rotate(360deg); } }`}
      </style>
    </span>
  );
}
