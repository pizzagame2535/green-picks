import React, { useState } from 'react';
import './admin.css';
import AdminSectionGames from './AdminSectionGames.jsx';
import AdminSectionFootball from './AdminSectionFootball.jsx';
import AdminSectionLottery from './AdminSectionLottery.jsx';

// ใช้ URL backend จาก .env ถ้าไม่มีให้ fallback เป็น localhost เวลา dev
export const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function AdminApp() {
  const [tab, setTab] = useState('GAMES');

  return (
    <div className="admin-root">
      <header className="admin-header">
        <h1 className="admin-title">Green Picks Admin Panel</h1>
        <p className="admin-subtitle">จัดการเกมแตกดี • ทีเด็ดบอล • เลขเด็ด</p>
      </header>

      <nav className="admin-tabs">
        <button
          className={`admin-tab ${tab === 'GAMES' ? 'active' : ''}`}
          onClick={() => setTab('GAMES')}
        >
          🎰 เกมแตกดี
        </button>
        <button
          className={`admin-tab ${tab === 'FOOTBALL' ? 'active' : ''}`}
          onClick={() => setTab('FOOTBALL')}
        >
          ⚽ ทีเด็ดบอล
        </button>
        <button
          className={`admin-tab ${tab === 'LOTTERY' ? 'active' : ''}`}
          onClick={() => setTab('LOTTERY')}
        >
          🔢 เลขเด็ด
        </button>
      </nav>

      <main className="admin-main">
        {tab === 'GAMES' && <AdminSectionGames apiBase={API_BASE} />}
        {tab === 'FOOTBALL' && <AdminSectionFootball apiBase={API_BASE} />}
        {tab === 'LOTTERY' && <AdminSectionLottery apiBase={API_BASE} />}
      </main>
    </div>
  );
}

// 👇 ตรงนี้แหละสำคัญ: default export
export default AdminApp;
