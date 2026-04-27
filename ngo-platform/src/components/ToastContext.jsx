import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'error' ? '#dc2626' : '#3b82f6',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '4px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 9999,
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};
