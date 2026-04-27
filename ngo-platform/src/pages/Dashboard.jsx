import React, { useState, useEffect } from 'react';
import { subscribeToReports } from '../firebase';
import { ISSUE_TYPES } from '../utils/constants';
import ReportCard from '../components/ReportCard';

const statCardStyle = {
  backgroundColor: 'white',
  padding: '1.5rem',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb'
};

const statLabelStyle = {
  fontSize: '0.875rem',
  color: '#6b7280',
  textTransform: 'uppercase',
  fontWeight: 'bold',
  marginBottom: '0.5rem'
};

const statValueStyle = {
  fontSize: '2rem',
  fontWeight: 'bold',
  color: '#111827'
};

const selectStyle = {
  padding: '0.5rem',
  borderRadius: '4px',
  border: '1px solid #d1d5db',
  width: '100%',
  backgroundColor: 'white'
};

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterIssue, setFilterIssue] = useState('All');
  const [filterUrgency, setFilterUrgency] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    const unsubscribe = subscribeToReports((data) => {
      setReports(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading reports...</div>;
  }

  // Derived Stats
  const totalReports = reports.length;
  const criticalReports = reports.filter(r => r.urgencyScore >= 80).length;
  const openReports = reports.filter(r => r.status === 'open').length;
  const inProgressReports = reports.filter(r => r.status === 'in_progress').length;

  // Filter Logic
  let filtered = reports.filter(r => {
    if (filterIssue !== 'All' && r.issueType !== filterIssue) return false;
    if (filterUrgency !== 'All' && r.urgencyLevel !== filterUrgency) return false;
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    return true;
  });

  // Sort Logic:
  // 1. aiStatus 'pending' at bottom
  // 2. urgencyScore desc
  // 3. ties broken by createdAt desc
  filtered.sort((a, b) => {
    if (a.aiStatus === 'pending' && b.aiStatus !== 'pending') return 1;
    if (a.aiStatus !== 'pending' && b.aiStatus === 'pending') return -1;
    
    const scoreA = a.urgencyScore || 0;
    const scoreB = b.urgencyScore || 0;
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
    return timeB - timeA;
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#111827' }}>Admin Dashboard</h1>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Total Reports</div>
          <div style={statValueStyle}>{totalReports}</div>
        </div>
        <div style={{ ...statCardStyle, borderLeft: '4px solid #dc2626' }}>
          <div style={statLabelStyle}>Critical</div>
          <div style={{ ...statValueStyle, color: '#dc2626' }}>{criticalReports}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Open</div>
          <div style={statValueStyle}>{openReports}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>In Progress</div>
          <div style={statValueStyle}>{inProgressReports}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151' }}>Issue Type</label>
          <select value={filterIssue} onChange={e => setFilterIssue(e.target.value)} style={selectStyle}>
            <option value="All">All Types</option>
            {ISSUE_TYPES.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151' }}>Urgency</label>
          <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)} style={selectStyle}>
            <option value="All">All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151' }}>Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
            <option value="All">All</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '8px', color: '#6b7280', border: '1px solid #e5e7eb' }}>
            No reports found matching your criteria.
          </div>
        ) : (
          filtered.map(report => (
            <ReportCard key={report.id} report={report} />
          ))
        )}
      </div>
    </div>
  );
}
