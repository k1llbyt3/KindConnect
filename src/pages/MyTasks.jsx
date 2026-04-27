import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasksForVolunteer, updateTask, updateReport } from '../firebase';
import TaskCard from '../components/TaskCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const volunteerId = localStorage.getItem('volunteerId');
    console.log("Volunteer ID:", volunteerId);
    
    if (!volunteerId) {
      navigate('/register');
      return;
    }

    const unsubscribe = getTasksForVolunteer(volunteerId, (fetchedTasks) => {
      console.log("Fetched Tasks:", fetchedTasks);
      setTasks(fetchedTasks || []);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigate]);

  const handleUpdateStatus = async (taskId, newStatus, reportId, extraFields = {}) => {
    try {
      await updateTask(taskId, { status: newStatus, ...extraFields });
      
      if (newStatus === 'completed' && reportId) {
        await updateReport(reportId, { status: 'completed' });
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status. Please check your connection.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Tasks</h2>
        <p style={{ color: 'var(--text-dim)' }}>Manage and update your assigned missions</p>
      </div>
      
      {(tasks || []).length === 0 ? (
        <div className="card" style={{ 
          padding: '4rem 2rem', 
          textAlign: 'center', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '3.5rem', opacity: 0.6 }}>🎯</div>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.75rem' }}>No active tasks</h3>
          <p style={{ color: 'var(--text-dim)', margin: 0, maxWidth: '450px', lineHeight: '1.6' }}>
            You haven't been assigned any tasks yet. Stay tuned—when a report needs your specific skills, it will automatically appear here.
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gap: '1.5rem', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' 
        }}>
          {(tasks || []).map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onUpdateStatus={handleUpdateStatus} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
