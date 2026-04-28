import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  return (
    <nav style={{
      padding: '1rem 0.75rem',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      pointerEvents: 'none'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', pointerEvents: 'auto' }}>
        <img src="/logo.png" alt="KindConnect Logo" style={{ height: '70px', width: 'auto' }} />
      </Link>
      
      <div style={{ pointerEvents: 'auto' }}>
        <ThemeToggle />
      </div>
    </nav>
  );
}
