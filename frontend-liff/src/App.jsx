import React, { useState, useEffect } from "react";
import "./styles.css";
import { BACKEND_API_BASE } from "./config";   // 👈 ใช้ค่าเดียวกับฝั่ง Admin

const API_BASE = BACKEND_API_BASE;

const TABS = {
  GAMES: "GAMES",
  FOOTBALL: "FOOTBALL",
  LOTTERY: "LOTTERY",
};

export default function App() {
  const [tab, setTab] = useState(TABS.GAMES);
  const [games, setGames] = useState([]);
  const [footballTips, setFootballTips] = useState([]);
  const [lottery, setLottery] = useState([]);
  const [lotteryFilter, setLotteryFilter] = useState("ALL");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // เกมแตกดี
        const resGames = await fetch(`${API_BASE}/api/games`);
        if (resGames.ok) {
          const data = await resGames.json();
          setGames(Array.isArray(data) ? data : []);
        } else {
          setGames([]);
        }

        // ทีเด็ดบอล
        const resFootball = await fetch(`${API_BASE}/api/football-tips`);
        if (resFootball.ok) {
          const data = await resFootball.json();
          setFootballTips(Array.isArray(data) ? data : []);
        } else {
          setFootballTips([]);
        }

        // เลขเด็ด
        const resLottery = await fetch(`${API_BASE}/api/lottery`);
        if (resLottery.ok) {
          const data = await resLottery.json();
          setLottery(Array.isArray(data) ? data : []);
        } else {
          setLottery([]);
        }
      } catch (err) {
        console.error("โหลดข้อมูล frontend ไม่สำเร็จ:", err);
        setGames([]);
        setFootballTips([]);
        setLottery([]);
      }
    };

    fetchAll();
  }, []);

  return (
    <div className="app-container">
      {/* ===== HEADER + TOP NAV ===== */}
      <header className="app-header">
        <div className="brand">
          <div>
          </div>
        </div>

        <nav className="app-nav">
          <button
            className={`nav-btn ${tab === TABS.GAMES ? "active" : ""}`}
            onClick={() => setTab(TABS.GAMES)}
          >
            🎰 เกมแตกดี
          </button>
          <button
            className={`nav-btn ${tab === TABS.FOOTBALL ? "active" : ""}`}
            onClick={() => setTab(TABS.FOOTBALL)}
          >
            ⚽ ทีเด็ดบอล
          </button>
          <button
            className={`nav-btn ${tab === TABS.LOTTERY ? "active" : ""}`}
            onClick={() => setTab(TABS.LOTTERY)}
          >
            🔢 เลขเด็ด
          </button>
        </nav>
      </header>

      {/* ===== MAIN ===== */}
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
    </div>
  );
}

/* ========================= Game Page ========================= */

function GamePage({ games }) {
  // ไม่มีข้อมูล → ไม่แสดงอะไรเลย
  if (!games || games.length === 0) return null;

  return (
    <section>
      <h2 className="section-title">🎰 เกมแตกดีประจำวัน</h2>
      <div className="grid">
        {games.map((game) => (
          <div className="card" key={game._id || game.id}>
            <div className="card-image-wrapper">
              <img
                src={game.imageUrl}
                alt={game.title || game.name}
                className="card-image"
              />
              {game.percent != null || game.winRate != null ? (
                <span className="badge">
                  {game.percent ?? game.winRate}% แตกวันนี้
                </span>
              ) : null}
            </div>
            <div className="card-body">
              <div className="card-title">{game.title || game.name}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ======================= Football Page ======================= */

function FootballPage({ tips }) {
  if (!tips || tips.length === 0) return null;

  return (
    <section>
      <h2 className="section-title">⚽ ทีเด็ดบอลวันนี้</h2>
      <div className="list">
        {tips.map((tip) => (
          <div className="card" key={tip._id || tip.id}>
            <div className="card-body">
              {(tip.league || tip.matchTime) && (
                <div className="chip">
                  {tip.league} {tip.matchTime && `• ${tip.matchTime}`}
                </div>
              )}
              <div className="card-title">
                {tip.title ||
                  `${tip.homeTeam || ""}${
                    tip.homeTeam && tip.awayTeam ? " vs " : ""
                  }${tip.awayTeam || ""}`}
              </div>
              {tip.pick && (
                <div className="card-subtitle">
                  ทีมแนะนำ: <strong>{tip.pick}</strong>
                </div>
              )}
              {tip.confidence != null && (
                <div className="progress-wrap">
                  <span>ความมั่นใจ {tip.confidence}%</span>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{ width: `${tip.confidence}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ======================== Lottery Page ======================= */

function LotteryPage({ items, filter, onFilterChange }) {
  const filtered = items.filter((item) =>
    filter === "ALL" ? true : item.type === filter
  );

  if (!filtered || filtered.length === 0) return null;

  return (
    <section>
      <h2 className="section-title">🔢 เลขเด็ด หวยดัง</h2>

      <div className="filter-row">
        {["ALL", "HANOI", "LAOS", "THAI"].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => onFilterChange(f)}
          >
            {f === "ALL" && "ทั้งหมด"}
            {f === "HANOI" && "ฮานอย"}
            {f === "LAOS" && "ลาว"}
            {f === "THAI" && "ไทย"}
          </button>
        ))}
      </div>

      <div className="grid">
        {filtered.map((item) => (
          <div className="card" key={item._id || item.id}>
            <div className="card-image-wrapper">
              <img
                src={item.imageUrl}
                alt={item.caption || item.title}
                className="card-image"
              />
              {item.type && (
                <span className="badge badge-small">
                  {item.type === "HANOI" && "ฮานอย"}
                  {item.type === "LAOS" && "ลาว"}
                  {item.type === "THAI" && "ไทย"}
                </span>
              )}
            </div>
            <div className="card-body">
              <div className="card-title">{item.caption || item.title}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
