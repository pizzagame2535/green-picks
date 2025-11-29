import React, { useState, useEffect } from 'react';
import './styles.css'; // ถ้าคุณใช้ชื่อไฟล์ CSS อื่น ให้แก้ตามนั้น

// ดึงค่า URL backend จาก .env
const API_BASE = import.meta.env.VITE_API_BASE;

const TABS = {
  GAMES: 'GAMES',
  FOOTBALL: 'FOOTBALL',
  LOTTERY: 'LOTTERY',
};

export default function App() {
  const [tab, setTab] = useState(TABS.GAMES);
  const [games, setGames] = useState([]);
  const [footballTips, setFootballTips] = useState([]);
  const [lottery, setLottery] = useState([]);
  const [lotteryFilter, setLotteryFilter] = useState('ALL');

  useEffect(() => {
    fetch(`${API_BASE}/api/games`).then(res => res.json()).then(setGames);
    fetch(`${API_BASE}/api/football-tips`).then(res => res.json()).then(setFootballTips);
    fetch(`${API_BASE}/api/lottery`).then(res => res.json()).then(setLottery);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">🍀</span>
          <div>
            <div className="brand-title">Green Picks Center</div>
            <div className="brand-sub">Game • บอล • หวย</div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {tab === TABS.GAMES && <GamePage games={games} />}
        {tab === TABS.FOOTBALL && <FootballPage tips={footballTips} />}
        {tab === TABS.LOTTERY && (
          <LotteryPage
            items={lottery}
            filter={lotteryFilter}
            onFilterChange={setLotteryFilter}
          />
        )}
      </main>

      <nav className="app-nav">
        <button
          className={`nav-btn ${tab === TABS.GAMES ? 'active' : ''}`}
          onClick={() => setTab(TABS.GAMES)}
        >
          🎰 เกมแตกดี
        </button>
        <button
          className={`nav-btn ${tab === TABS.FOOTBALL ? 'active' : ''}`}
          onClick={() => setTab(TABS.FOOTBALL)}
        >
          ⚽ ทีเด็ดบอล
        </button>
        <button
          className={`nav-btn ${tab === TABS.LOTTERY ? 'active' : ''}`}
          onClick={() => setTab(TABS.LOTTERY)}
        >
          🔢 เลขเด็ด
        </button>
      </nav>
    </div>
  );
}

function GamePage({ games }) {
  return (
    <section>
      <h2 className="section-title">🎰 เกมแตกดีประจำวัน</h2>
      <div className="grid">
        {games.map(game => (
          <div className="card" key={game._id || game.id}>
            <div className="card-image-wrapper">
              <img src={game.imageUrl} alt={game.name} className="card-image" />
              <span className="badge">
                {game.winRate}% แตกวันนี้
              </span>
            </div>
            <div className="card-body">
              <div className="card-title">{game.name}</div>
            </div>
          </div>
        ))}
        {games.length === 0 && <p className="empty-text">ยังไม่มีข้อมูลสำหรับวันนี้</p>}
      </div>
    </section>
  );
}

function FootballPage({ tips }) {
  return (
    <section>
      <h2 className="section-title">⚽ ทีเด็ดบอลวันนี้</h2>
      <div className="list">
        {tips.map(tip => (
          <div className="card" key={tip._id || tip.id}>
            <div className="card-body">
              <div className="chip">{tip.league} • {tip.matchTime}</div>
              <div className="card-title">
                {tip.homeTeam} vs {tip.awayTeam}
              </div>
              <div className="card-subtitle">
                ทีมแนะนำ: <strong>{tip.pick}</strong>
              </div>
              <div className="progress-wrap">
                <span>ความมั่นใจ {tip.confidence}%</span>
                <div className="progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${tip.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        {tips.length === 0 && <p className="empty-text">ยังไม่มีทีเด็ดสำหรับวันนี้</p>}
      </div>
    </section>
  );
}

function LotteryPage({ items, filter, onFilterChange }) {
  const filtered = items.filter(item =>
    filter === 'ALL' ? true : item.type === filter
  );

  return (
    <section>
      <h2 className="section-title">🔢 เลขเด็ด หวยดัง</h2>
      <div className="filter-row">
        {['ALL', 'HANOI', 'LAOS', 'THAI'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => onFilterChange(f)}
          >
            {f === 'ALL' && 'ทั้งหมด'}
            {f === 'HANOI' && 'ฮานอย'}
            {f === 'LAOS' && 'ลาว'}
            {f === 'THAI' && 'ไทย'}
          </button>
        ))}
      </div>
      <div className="grid">
        {filtered.map(item => (
          <div className="card" key={item._id || item.id}>
            <div className="card-image-wrapper">
              <img src={item.imageUrl} alt={item.caption} className="card-image" />
              <span className="badge badge-soft">
                {item.type === 'HANOI' && 'ฮานอย'}
                {item.type === 'LAOS' && 'ลาว'}
                {item.type === 'THAI' && 'ไทย'}
              </span>
            </div>
            <div className="card-body">
              <div className="card-title">{item.caption}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-text">ยังไม่มีเลขเด็ดสำหรับวันนี้</p>}
      </div>
    </section>
  );
}
