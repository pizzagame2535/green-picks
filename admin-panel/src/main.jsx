import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp';   // ใช้ default import
import './admin.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
