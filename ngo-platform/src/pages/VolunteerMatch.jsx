import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getReport, getVolunteers, addTask, updateReport } from '../firebase';
import { matchVolunteers } from '../gemini';
import UrgencyBadge from '../components/UrgencyBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContext';

export default function VolunteerMatch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [report, setReport] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noVolunteers, setNoVolunteers] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    async function loadAndMatch() {
      try {
        const rep = await getReport(id);
        if (!rep) return;
        setReport(rep);

        // Guard clause: stop if already assigned
        if (rep.status !== 'open') {
          setLoading(false);
          return;
        }

        const vols = await getVolunteers();
        if (vols.length === 0) {
          setNoVolunteers(true);
          setLoading(false);
          return;
        }

        const topMatches = await matchVolunteers(rep, vols);
        
        const enrichedMatches = topMatches.map(m => {
          const original = vols.find(v => v.id === m.volunteerId);
          return {
            ...m,
            skills: original?.skills || [],
            location: original?.location || 'Location unknown'
          };
        });
        
        setMatches(enrichedMatches);
      } catch (err) {
        console.error("Matching error:", err);
        showToast("Failed to run AI volunteer matching. Using fallback.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadAndMatch();
  }, [id, showToast]);

  const handleAssign = async (volunteer) => {
    setAssigningId(volunteer.volunteerId);
    try {
      const taskId = await addTask({
        status: 'assigned',
        reportId: report.id,
        volunteerId: volunteer.volunteerId,
        volunteerName: volunteer.volunteerName,
        reportSummary: report.aiSummary || report.description,
        reportLocation: report.location,
        issueType: report.issueType,
        urgencyLevel: report.urgencyLevel
      });

      await updateReport(report.id, {
        status: 'assigned',
        assignedTaskId: taskId
      });

      showToast(`Task assigned to ${volunteer.volunteerName}`, 'success');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error(err);
      showToast("Failed to assign task. Check your connection.", "error");
      setAssigningId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#4b5563', fontSize: '1.25rem' }}>
        <LoadingSpinner /> AI is finding the best volunteers...
      </div>
    );
  }

  if (report && report.status !== 'open') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '8px', maxWidth: '600px', margin: '0 auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#111827', marginBottom: '1rem' }}>This report has already been assigned.</h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Task ID: {report.assignedTaskId}</p>
        <Link to="/dashboard" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (noVolunteers) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '8px', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#111827', marginBottom: '1rem' }}>No volunteers registered yet</h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>You need volunteers in the system before AI can match them to reports.</p>
        <Link to="/register" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
          Register a Volunteer
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {report && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <UrgencyBadge level={report.urgencyLevel} score={report.urgencyScore} />
            <h2 style={{ margin: 0, textTransform: 'capitalize', fontSize: '1.5rem', color: '#111827' }}>{report.issueType} Issue</h2>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem', color: '#4b5563' }}>
            <div><strong style={{ color: '#374151' }}>Location:</strong> {report.location}</div>
            <div><strong style={{ color: '#374151' }}>Action Needed:</strong> {report.aiActionCategory || report.description}</div>
          </div>
        </div>
      )}

      <h3 style={{ marginBottom: '1.5rem', color: '#111827', fontSize: '1.25rem' }}>Top Volunteer Matches</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {matches.map((match, index) => (
          <div key={match.volunteerId} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: index === 0 ? '0 4px 6px -1px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
            
            {index === 0 && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#3b82f6' }} />
            )}

            <div style={{ flex: 1, paddingLeft: index === 0 ? '0.5rem' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>{match.volunteerName}</h4>
                <div style={{ backgroundColor: '#dbeafe', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 'bold', color: '#1d4ed8' }}>
                  Score: {match.matchScore}
                </div>
              </div>
              
              <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: '#4b5563' }}>
                📍 {match.location}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {match.skills && match.skills.map(skill => (
                  <span key={skill} style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', color: '#374151', fontWeight: '600', textTransform: 'capitalize' }}>
                    {skill}
                  </span>
                ))}
              </div>

              <p style={{ color: '#4b5563', margin: 0, fontSize: '0.9rem', fontStyle: 'italic', backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '4px', borderLeft: '2px solid #d1d5db' }}>
                "{match.matchReason}"
              </p>
            </div>
            
            <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                onClick={() => handleAssign(match)}
                disabled={!!assigningId}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  backgroundColor: assigningId === match.volunteerId ? '#10b981' : '#2563eb', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  fontWeight: 'bold', 
                  cursor: assigningId ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                {assigningId === match.volunteerId ? <><LoadingSpinner/> Assigning...</> : 'Assign This Volunteer'}
              </button>
            </div>
          </div>
        ))}
        {matches.length === 0 && !loading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', backgroundColor: 'white', borderRadius: '8px' }}>
            No suitable matches found for this report.
          </div>
        )}
      </div>
    </div>
  );
}
