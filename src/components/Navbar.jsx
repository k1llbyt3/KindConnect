import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav style={{
      padding: '1.5rem 2rem',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 1000,
      pointerEvents: 'none'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', pointerEvents: 'auto' }}>
        <img src="/logo.png" alt="KindConnect Logo" style={{ height: '70px', width: 'auto' }} />
      </Link>
    </nav>
  );
}
