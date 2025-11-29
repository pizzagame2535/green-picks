// src/AdminSectionGames.jsx
import React, { useEffect, useState } from 'react';

export default function GamesSection({ apiBase, token }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    imageUrl: '',
    winRate: 90,
  });

  const headers = {
    'Content-Type': 'application/json',
    'x-admin-token': token,
  };

  async function loadGames() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/games`, { headers });
      const data = await res.json();
      setGames(data);
    } catch (err) {
      console.error(err);
      alert('โหลดเกมไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function resetForm() {
    setForm({ name: '', imageUrl: '', winRate: 90 });
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${apiBase}/api/admin/games/${editingId}`
        : `${apiBase}/api/admin/games`;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error');
      }

      await loadGames();
      resetForm();
    } catch (err) {
      console.error(err);
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    }
  }

  function onEdit(game) {
    setEditingId(game._id);
    setForm({
      name: game.name,
      imageUrl: game.imageUrl,
      winRate: game.winRate,
    });
  }

  async function onDelete(id) {
    if (!window.confirm('ลบเกมนี้?')) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/games/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('ลบไม่สำเร็จ');
      await loadGames();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  return (
    <div className="section">
      <h2>🎰 จัดการเกมแตกดี</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>ชื่อเกม</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <label>ลิงก์รูปภาพ (URL)</label>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <label>เปอร์เซ็นแตกดี (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={form.winRate}
            onChange={(e) =>
              setForm({ ...form, winRate: Number(e.target.value) })
            }
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มเกม'}
          </button>
          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}>
              ยกเลิกแก้ไข
            </button>
          )}
        </div>
      </form>

      <hr />

      <h3>รายการเกมวันนี้</h3>
      {loading && <p>กำลังโหลด...</p>}
      {!loading && games.length === 0 && <p>ยังไม่มีเกม</p>}

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
          {games.map((g) => (
            <tr key={g._id}>
              <td>
                <img
                  src={g.imageUrl}
                  alt={g.name}
                  style={{ width: 60, height: 40, objectFit: 'cover' }}
                />
              </td>
              <td>{g.name}</td>
              <td>{g.winRate}%</td>
              <td>
                <button onClick={() => onEdit(g)}>แก้ไข</button>
                <button className="danger" onClick={() => onDelete(g._id)}>
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
