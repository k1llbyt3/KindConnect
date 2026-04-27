import React, { useState, useEffect } from 'react';
import { getTasksForVolunteer, updateTask, updateReport } from '../firebase';
import { arrayUnion, serverTimestamp } from 'firebase/firestore';
import TaskCard from '../components/TaskCard';
import { useToast } from '../components/ToastContext';

export default function MyTasks() {
  const { showToast } = useToast();
  const [volunteerId, setVolunteerId] = useState(localStorage.getItem('volunteerIdNGO') || '');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState('');

  const loadTasks = async (id) => {
    try {
      const data = await getTasksForVolunteer(id);
      
      // Sort tasks: put completed at bottom, else newest first
      data.sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
      });
      
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (volunteerId) {
      setLoading(true);
      loadTasks(volunteerId).then(() => setLoading(false));

      const intervalId = setInterval(() => {
        loadTasks(volunteerId);
      }, 10000);
      
      return () => clearInterval(intervalId);
    }
  }, [volunteerId]);

  const handleSetId = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      localStorage.setItem('volunteerIdNGO', manualId.trim());
      setVolunteerId(manualId.trim());
    }
  };

  const handleStatusUpdate = async (taskId, newStatus, note) => {
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, completionNote: note } : t));

    try {
      const task = originalTasks.find(t => t.id === taskId);
      if (!task) return;

      const updateData = { 
        status: newStatus,
        statusHistory: arrayUnion({ status: newStatus, at: serverTimestamp() })
      };
      
      if (newStatus === 'completed') {
        updateData.completionNote = note || '';
        await updateReport(task.reportId, { status: 'completed' });
      }

      await updateTask(taskId, updateData);
      showToast(`Task marked as ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      console.error("Failed to update task status:", err);
      showToast('Failed to update task status. Please check connection.', 'error');
      setTasks(originalTasks);
    }
  };

  if (!volunteerId) {
    return (
      <div style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center', backgroundColor: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#111827' }}>Volunteer Login</h2>
        <p style={{ color: '#4b5563', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Enter your Volunteer ID to access your assigned tasks.</p>
        <form onSubmit={handleSetId} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            value={manualId} 
            onChange={e => setManualId(e.target.value)} 
            placeholder="e.g. 7fK2x..." 
            style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', width: '100%', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            Load My Tasks
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#111827', margin: 0 }}>My Assigned Tasks</h1>
        <button 
          onClick={() => { localStorage.removeItem('volunteerIdNGO'); setVolunteerId(''); }}
          style={{ padding: '0.5rem 1rem', backgroundColor: 'transparent', border: '1px solid #d1d5db', borderRadius: '4px', color: '#6b7280', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Change Volunteer ID
        </button>
      </div>

      {loading && tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading your tasks...</div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '8px', color: '#6b7280', border: '1px solid #e5e7eb' }}>
          No tasks assigned to you yet.
        </div>
      ) : (
        <div>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onStatusUpdate={handleStatusUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
