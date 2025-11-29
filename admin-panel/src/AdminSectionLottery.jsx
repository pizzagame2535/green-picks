// src/AdminSectionLottery.jsx
import React, { useEffect, useState } from 'react';

export default function LotterySection({ apiBase, token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    type: 'HANOI',
    imageUrl: '',
    caption: '',
  });

  const headers = {
    'Content-Type': 'application/json',
    'x-admin-token': token,
  };

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/lottery`, { headers });
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
      alert('โหลดเลขเด็ดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function resetForm() {
    setForm({
      type: 'HANOI',
      imageUrl: '',
      caption: '',
    });
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${apiBase}/api/admin/lottery/${editingId}`
        : `${apiBase}/api/admin/lottery`;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error');
      }

      await loadItems();
      resetForm();
    } catch (err) {
      console.error(err);
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    }
  }

  function onEdit(item) {
    setEditingId(item._id);
    setForm({
      type: item.type,
      imageUrl: item.imageUrl,
      caption: item.caption,
    });
  }

  async function onDelete(id) {
    if (!window.confirm('ลบเลขเด็ดนี้?')) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/lottery/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('ลบไม่สำเร็จ');
      await loadItems();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  return (
    <div className="section">
      <h2>🔢 จัดการเลขเด็ด หวยดัง</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>ประเภทหวย</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="HANOI">ฮานอย</option>
            <option value="LAOS">ลาว</option>
            <option value="THAI">ไทย</option>
          </select>
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
          <label>คำอธิบาย / Caption</label>
          <input
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit">
            {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มเลขเด็ด'}
          </button>
          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}>
              ยกเลิกแก้ไข
            </button>
          )}
        </div>
      </form>

      <hr />

      <h3>รายการเลขเด็ด</h3>
      {loading && <p>กำลังโหลด...</p>}
      {!loading && items.length === 0 && <p>ยังไม่มีเลขเด็ด</p>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>รูป</th>
            <th>ประเภท</th>
            <th>Caption</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it._id}>
              <td>
                <img
                  src={it.imageUrl}
                  alt={it.caption}
                  style={{ width: 60, height: 40, objectFit: 'cover' }}
                />
              </td>
              <td>
                {it.type === 'HANOI' && 'ฮานอย'}
                {it.type === 'LAOS' && 'ลาว'}
                {it.type === 'THAI' && 'ไทย'}
              </td>
              <td>{it.caption}</td>
              <td>
                <button onClick={() => onEdit(it)}>แก้ไข</button>
                <button className="danger" onClick={() => onDelete(it._id)}>
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
