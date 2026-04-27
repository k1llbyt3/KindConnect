import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import RoleSelector from './pages/RoleSelector';
import SubmitReport from './pages/SubmitReport';
import Dashboard from './pages/Dashboard';
import ReportDetail from './pages/ReportDetail';
import VolunteerMatch from './pages/VolunteerMatch';
import MyTasks from './pages/MyTasks';
import RegisterVolunteer from './pages/RegisterVolunteer';
import { ToastProvider } from './components/ToastContext';

const navStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem 2rem',
  backgroundColor: '#1f2937',
  color: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const navBrandStyle = {
  fontWeight: 'bold',
  fontSize: '1.25rem',
  textDecoration: 'none',
  color: 'white'
};

const navActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const badgeStyle = {
  backgroundColor: '#3b82f6',
  padding: '0.25rem 0.75rem',
  borderRadius: '9999px',
  fontSize: '0.875rem',
  fontWeight: '600',
  textTransform: 'uppercase'
};

const linkStyle = {
  color: '#9ca3af',
  textDecoration: 'none',
  fontSize: '0.875rem',
  cursor: 'pointer'
};

const Layout = ({ role, setRole, children }) => {
  if (!role) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', backgroundColor: '#f3f4f6' }}>
      <nav style={navStyle}>
        <Link to="/" style={navBrandStyle}>NGO Platform</Link>
        <div style={navActionsStyle}>
          {role && <span style={badgeStyle}>{role.replace('_', ' ')}</span>}
          <Link to="/" onClick={() => setRole(null)} style={linkStyle}>
            Switch Role
          </Link>
        </div>
      </nav>
      <main style={{ flex: 1, padding: '2rem' }}>
        {children}
      </main>
      <footer style={{ backgroundColor: '#1f2937', color: '#9ca3af', textAlign: 'center', padding: '1.5rem', fontSize: '0.875rem' }}>
        Smart Resource Allocation Platform — Prototype v1.0
      </footer>
    </div>
  );
};

export default function App() {
  const [role, setRole] = useState(null);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleSelector setRole={setRole} />} />
          
          <Route path="/submit" element={<Layout role={role} setRole={setRole}><SubmitReport /></Layout>} />
          <Route path="/dashboard" element={<Layout role={role} setRole={setRole}><Dashboard /></Layout>} />
          <Route path="/report/:id" element={<Layout role={role} setRole={setRole}><ReportDetail /></Layout>} />
          <Route path="/report/:id/match" element={<Layout role={role} setRole={setRole}><VolunteerMatch /></Layout>} />
          <Route path="/tasks" element={<Layout role={role} setRole={setRole}><MyTasks /></Layout>} />
          <Route path="/register" element={<Layout role={role} setRole={setRole}><RegisterVolunteer /></Layout>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
