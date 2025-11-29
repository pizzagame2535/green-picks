import React, { useEffect, useState } from 'react';
import { API_BASE } from './AdminApp.jsx';

export default function AdminSectionGames() {
  const [games, setGames] = useState([]);      // เก็บรายการเกม
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [percent, setPercent] = useState(90);

  // โหลดเกมแตกดีประจำวัน
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/games`);
        if (!res.ok) {
          throw new Error('โหลดเกมไม่สำเร็จ');
        }

        const data = await res.json();

        // กันกรณี backend ส่งอะไรแปลก ๆ มา
        if (Array.isArray(data)) {
          setGames(data);
        } else {
          console.warn('รูปแบบข้อมูลเกมไม่ใช่ array:', data);
          setGames([]);
        }
      } catch (err) {
        console.error('โหลดเกมผิดพลาด:', err);
        alert(err.message || 'โหลดเกมไม่สำเร็จ');
        setGames([]);   // อย่าปล่อยเป็น undefined เดี๋ยว .map พัง
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // ส่งฟอร์มเพิ่มเกม
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        name,
        imageUrl,
        percent: Number(percent),
      };

      const res = await fetch(`${API_BASE}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('เพิ่มเกมไม่สำเร็จ');
      }

      const newGame = await res.json();

      setGames((prev) => Array.isArray(prev) ? [...prev, newGame] : [newGame]);
      setName('');
      setImageUrl('');
      setPercent(90);
    } catch (err) {
      console.error('เพิ่มเกมผิดพลาด:', err);
      alert(err.message || 'เพิ่มเกมไม่สำเร็จ');
    }
  };

  // ลบเกม (ถ้า backend มี route DELETE)
  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบเกมนี้ใช่ไหม ?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/games/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('ลบเกมไม่สำเร็จ');

      setGames((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      console.error('ลบเกมผิดพลาด:', err);
      alert(err.message || 'ลบเกมไม่สำเร็จ');
    }
  };

  return (
    <div className="admin-section">
      <h2>🎰 จัดการเกมแตกดี</h2>

      {/* ฟอร์มเพิ่มเกม */}
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-row">
          <label>ชื่อเกม</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="admin-form-row">
          <label>ลิงก์รูปภาพ (URL)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            required
          />
        </div>

        <div className="admin-form-row">
          <label>เปอร์เซ็นต์แตกดี (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
          />
        </div>

        <button type="submit" className="admin-btn-primary">
          เพิ่มเกม
        </button>
      </form>

      {/* ตารางรายการเกม */}
      <h3>รายการเกมวันนี้</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>รูป</th>
            <th>ชื่อเกม</th>
            <th>% แตกดี</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4">กำลังโหลด…</td>
            </tr>
          ) : !games || games.length === 0 ? (
            <tr>
              <td colSpan="4">ยังไม่มีข้อมูลเกมวันนี้</td>
            </tr>
          ) : (
            games.map((g) => (
              <tr key={g._id || g.id}>
                <td>
                  {g.imageUrl ? (
                    <img
                      src={g.imageUrl}
                      alt={g.name}
                      style={{ width: 64, height: 64, objectFit: 'cover' }}
                    />
                  ) : (
                    '-'
                  )}
                </td>
                <td>{g.name}</td>
                <td>{g.percent}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleDelete(g._id || g.id)}
                    className="admin-btn-danger"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
