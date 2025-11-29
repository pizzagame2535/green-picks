import React, { useEffect, useState } from 'react';
import { API_BASE } from './AdminApp.jsx';

export default function AdminSectionFootball() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [confidence, setConfidence] = useState(80);
  const [note, setNote] = useState('');

  // โหลดทีเด็ดบอล
  useEffect(() => {
    const fetchTips = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/football-tips`);
        if (!res.ok) throw new Error('โหลดทีเด็ดบอลไม่สำเร็จ');

        const data = await res.json();
        if (Array.isArray(data)) {
          setTips(data);
        } else {
          console.warn('รูปแบบข้อมูลทีเด็ดบอลไม่ใช่ array:', data);
          setTips([]);
        }
      } catch (err) {
        console.error(err);
        alert(err.message || 'โหลดทีเด็ดบอลไม่สำเร็จ');
        setTips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTips();
  }, []);

  // เพิ่มทีเด็ดใหม่
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        homeTeam,
        awayTeam,
        confidence: Number(confidence),
        note,
      };

      const res = await fetch(`${API_BASE}/api/football-tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('เพิ่มทีเด็ดบอลไม่สำเร็จ');

      const newTip = await res.json();
      setTips((prev) => (Array.isArray(prev) ? [...prev, newTip] : [newTip]));

      setHomeTeam('');
      setAwayTeam('');
      setConfidence(80);
      setNote('');
    } catch (err) {
      console.error(err);
      alert(err.message || 'เพิ่มทีเด็ดบอลไม่สำเร็จ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบทีเด็ดคู่นี้ใช่ไหม ?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/football-tips/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('ลบทีเด็ดบอลไม่สำเร็จ');

      setTips((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || 'ลบทีเด็ดบอลไม่สำเร็จ');
    }
  };

  return (
    <div className="admin-section">
      <h2>⚽ จัดการทีเด็ดบอล</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-row">
          <label>ทีมเหย้า</label>
          <input
            type="text"
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-row">
          <label>ทีมเยือน</label>
          <input
            type="text"
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-row">
          <label>ความมั่นใจ (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
          />
        </div>
        <div className="admin-form-row">
          <label>โน้ต / ราคา / ทิศทาง</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button type="submit" className="admin-btn-primary">
          เพิ่มทีเด็ด
        </button>
      </form>

      <h3>ทีเด็ดบอลวันนี้</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>คู่แข่ง</th>
            <th>ความมั่นใจ (%)</th>
            <th>โน้ต</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4">กำลังโหลด…</td>
            </tr>
          ) : !tips || tips.length === 0 ? (
            <tr>
              <td colSpan="4">ยังไม่มีทีเด็ดบอลวันนี้</td>
            </tr>
          ) : (
            tips.map((t) => (
              <tr key={t._id || t.id}>
                <td>
                  {t.homeTeam} vs {t.awayTeam}
                </td>
                <td>{t.confidence}</td>
                <td>{t.note || '-'}</td>
                <td>
                  <button
                    type="button"
                    className="admin-btn-danger"
                    onClick={() => handleDelete(t._id || t.id)}
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
