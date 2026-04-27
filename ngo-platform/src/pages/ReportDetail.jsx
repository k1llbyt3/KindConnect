import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReport } from '../firebase';
import UrgencyBadge from '../components/UrgencyBadge';
import StatusBadge from '../components/StatusBadge';
import { timeAgo } from '../utils/urgencyHelpers';

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReport(id).then(data => {
      setReport(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading report details...</div>;
  if (!report) return <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>Report not found</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Report Details</h1>
        <StatusBadge status={report.status} />
      </div>

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem', color: '#374151' }}>
        <div><strong>Issue Type:</strong> <span style={{ textTransform: 'capitalize' }}>{report.issueType}</span></div>
        <div><strong>Location:</strong> {report.location}</div>
        <div><strong>Severity (Self-reported):</strong> {report.severityRaw}/5</div>
        <div><strong>People Affected:</strong> {report.affectedCount}</div>
        <div><strong>Submitted By:</strong> {report.name}</div>
        <div><strong>Time:</strong> {timeAgo(report.createdAt)}</div>
        <div>
          <strong>Description:</strong>
          <p style={{ marginTop: '0.5rem', color: '#4b5563', lineHeight: '1.5', whiteSpace: 'pre-wrap', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '4px', border: '1px solid #f3f4f6' }}>
            {report.description}
          </p>
        </div>
      </div>

      {report.photoUrl && (
        <div style={{ marginBottom: '2rem' }}>
          <strong>Photo:</strong>
          <img src={report.photoUrl} alt="Report evidence" style={{ display: 'block', maxWidth: '100%', marginTop: '0.5rem', borderRadius: '4px' }} />
        </div>
      )}

      <div style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', marginTop: 0 }}>AI Analysis</h2>
        {report.aiStatus === 'pending' && <p style={{ fontStyle: 'italic', color: '#6b7280', margin: 0 }}>⚙️ AI analysis in progress...</p>}
        {report.aiStatus === 'failed' && (
          <p style={{ color: '#dc2626', margin: 0 }}>
            AI scoring failed — fallback score used: <UrgencyBadge level={report.urgencyLevel} score={report.urgencyScore} />
          </p>
        )}
        {report.aiStatus === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', lineHeight: 1 }}>{report.urgencyScore}</span>
              <UrgencyBadge level={report.urgencyLevel} />
            </div>
            <div><strong style={{ color: '#111827' }}>Summary:</strong> <span style={{ color: '#4b5563' }}>{report.aiSummary}</span></div>
            <div><strong style={{ color: '#111827' }}>Action Needed:</strong> <span style={{ color: '#4b5563' }}>{report.aiActionCategory}</span></div>
            <div><strong style={{ color: '#111827' }}>Reasoning:</strong> <span style={{ color: '#4b5563' }}>{report.aiReason}</span></div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        {report.status === 'open' ? (
          <button 
            onClick={() => navigate(`/report/${id}/match`)}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Find Matching Volunteers
          </button>
        ) : (
          <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block' }}>
            Already assigned — View Task (ID: {report.assignedTaskId})
          </div>
        )}
      </div>
    </div>
  );
}
