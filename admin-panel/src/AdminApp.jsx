// src/AdminApp.jsx
import React, { useState } from 'react';
import AdminSectionGames from './AdminSectionGames.jsx';
import AdminSectionFootball from './AdminSectionFootball.jsx';
import AdminSectionLottery from './AdminSectionLottery.jsx';
import AdminSectionWithdraw from './AdminSectionWithdraw.jsx';

export default function AdminApp() {
  const [tab, setTab] = useState('GAMES');

  // หัวข้อใหญ่ด้านบน (ซ่อนเมื่ออยู่เมนูถอนเงิน)
  const headerTitle =
    tab === 'WITHDRAW' ? '' : 'จัดการเกมแตกดี • ทีเด็ดบอล • เลขเด็ด';

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
          <button
            className={tab === 'WITHDRAW' ? 'active' : ''}
            onClick={() => setTab('WITHDRAW')}
          >
            💸 ถอนเงิน
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <span>LSM Project • {new Date().getFullYear()}</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-header">
          {headerTitle && <h1>{headerTitle}</h1>}
        </header>

        <section className="admin-content">
          {tab === 'GAMES' && <AdminSectionGames />}
          {tab === 'FOOTBALL' && <AdminSectionFootball />}
          {tab === 'LOTTERY' && <AdminSectionLottery />}
          {tab === 'WITHDRAW' && <AdminSectionWithdraw />}
        </section>
      </main>
    </div>
  );
}
