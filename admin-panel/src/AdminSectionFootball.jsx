// src/AdminSectionFootball.jsx
import React, { useEffect, useState } from 'react';

export default function FootballSection({ apiBase, token }) {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    league: '',
    matchTime: '',
    homeTeam: '',
    awayTeam: '',
    pick: '',
    confidence: 80,
  });

  const headers = {
    'Content-Type': 'application/json',
    'x-admin-token': token,
  };

  async function loadTips() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/football`, { headers });
      const data = await res.json();
      setTips(data);
    } catch (err) {
      console.error(err);
      alert('โหลดทีเด็ดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function resetForm() {
    setForm({
      league: '',
      matchTime: '',
      homeTeam: '',
      awayTeam: '',
      pick: '',
      confidence: 80,
    });
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${apiBase}/api/admin/football/${editingId}`
        : `${apiBase}/api/admin/football`;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error');
      }

      await loadTips();
      resetForm();
    } catch (err) {
      console.error(err);
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    }
  }

  function onEdit(tip) {
    setEditingId(tip._id);
    setForm({
      league: tip.league,
      matchTime: tip.matchTime,
      homeTeam: tip.homeTeam,
      awayTeam: tip.awayTeam,
      pick: tip.pick,
      confidence: tip.confidence,
    });
  }

  async function onDelete(id) {
    if (!window.confirm('ลบทีเด็ดนี้?')) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/football/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('ลบไม่สำเร็จ');
      await loadTips();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  return (
    <div className="section">
      <h2>⚽ จัดการทีเด็ดบอล</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>ลีก</label>
          <input
            value={form.league}
            onChange={(e) => setForm({ ...form, league: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <label>เวลาแข่ง (เช่น 20:00 หรือ 2025-11-30 20:00)</label>
          <input
            value={form.matchTime}
            onChange={(e) => setForm({ ...form, matchTime: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <label>ทีมเหย้า</label>
          <input
            value={form.homeTeam}
            onChange={(e) => setForm({ ...form, homeTeam: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <label>ทีมเยือน</label>
          <input
            value={form.awayTeam}
            onChange={(e) => setForm({ ...form, awayTeam: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <label>ทีมที่แนะนำ / ราคา</label>
          <input
            value={form.pick}
            onChange={(e) => setForm({ ...form, pick: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <label>ความมั่นใจ (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={form.confidence}
            onChange={(e) =>
              setForm({ ...form, confidence: Number(e.target.value) })
            }
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มทีเด็ด'}
          </button>
          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}>
              ยกเลิกแก้ไข
            </button>
          )}
        </div>
      </form>

      <hr />

      <h3>รายการทีเด็ด</h3>
      {loading && <p>กำลังโหลด...</p>}
      {!loading && tips.length === 0 && <p>ยังไม่มีทีเด็ด</p>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>ลีก</th>
            <th>เวลา</th>
            <th>คู่</th>
            <th>แนะนำ</th>
            <th>% มั่นใจ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {tips.map((t) => (
            <tr key={t._id}>
              <td>{t.league}</td>
              <td>{t.matchTime}</td>
              <td>
                {t.homeTeam} vs {t.awayTeam}
              </td>
              <td>{t.pick}</td>
              <td>{t.confidence}%</td>
              <td>
                <button onClick={() => onEdit(t)}>แก้ไข</button>
                <button className="danger" onClick={() => onDelete(t._id)}>
                  ลบ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
