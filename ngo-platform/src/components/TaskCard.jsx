import React, { useState } from 'react';
import UrgencyBadge from './UrgencyBadge';
import StatusBadge from './StatusBadge';

export default function TaskCard({ task, onStatusUpdate }) {
  const [note, setNote] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  const handleUpdate = (status) => {
    if (status === 'completed' && !showCompleteForm) {
      setShowCompleteForm(true);
      return;
    }
    onStatusUpdate(task.id, status, status === 'completed' ? note : null);
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <UrgencyBadge level={task.urgencyLevel} />
          <h3 style={{ margin: 0, textTransform: 'capitalize', fontSize: '1.25rem', color: '#111827' }}>{task.issueType}</h3>
        </div>
        <StatusBadge status={task.status} />
      </div>
      
      <div style={{ color: '#4b5563', marginBottom: '0.75rem' }}>
        <strong>Location:</strong> {task.reportLocation}
      </div>
      
      <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', color: '#374151', border: '1px solid #f3f4f6' }}>
        {task.reportSummary}
      </div>

      {task.status === 'completed' && task.completionNote && (
        <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem', borderLeft: '4px solid #10b981' }}>
          <strong>Completion Note:</strong> {task.completionNote}
        </div>
      )}

      {task.status === 'assigned' && (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => handleUpdate('accepted')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            Accept Task
          </button>
          <button onClick={() => alert("Task declined locally (prototype implementation)")} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            Decline
          </button>
        </div>
      )}

      {task.status === 'accepted' && (
        <button onClick={() => handleUpdate('in_progress')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f97316', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
          Mark In Progress
        </button>
      )}

      {task.status === 'in_progress' && (
        <div>
          {showCompleteForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.875rem', color: '#111827' }}>Completion Note (optional)</label>
              <textarea 
                value={note} 
                onChange={e => setNote(e.target.value)} 
                placeholder="Briefly describe what was done..."
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical' }} 
                rows={3} 
              />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button onClick={() => handleUpdate('completed')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Submit Completion
                </button>
                <button onClick={() => setShowCompleteForm(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#4b5563', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => handleUpdate('completed')} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              Mark Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
