import React, { useState } from 'react';
import AdminSectionGames from './AdminSectionGames.jsx';
import AdminSectionFootball from './AdminSectionFootball.jsx';
import AdminSectionLottery from './AdminSectionLottery.jsx';

export const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function AdminApp() {
  const [tab, setTab] = useState('GAMES');

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span className="admin-logo-main">Back Office</span>
        </div>

        <nav className="admin-nav">
          <button
            className={tab === 'GAMES' ? 'active' : ''}
            onClick={() => setTab('GAMES')}
          >
            🎰 เกมแตกดี
          </button>
          <button
            className={tab === 'FOOTBALL' ? 'active' : ''}
            onClick={() => setTab('FOOTBALL')}
          >
            ⚽ ทีเด็ดบอล
          </button>
          <button
            className={tab === 'LOTTERY' ? 'active' : ''}
            onClick={() => setTab('LOTTERY')}
          >
            🔢 เลขดัง
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <span>LSM Project • {new Date().getFullYear()}</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>จัดการเกมแตกดี • ทีเด็ดบอล • เลขเด็ด</h1>
        </header>

        <section className="admin-content">
          {tab === 'GAMES' && <AdminSectionGames />}
          {tab === 'FOOTBALL' && <AdminSectionFootball />}
          {tab === 'LOTTERY' && <AdminSectionLottery />}
        </section>
      </main>
    </div>
  );
}
