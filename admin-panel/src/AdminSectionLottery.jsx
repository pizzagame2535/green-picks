import React, { useEffect, useState } from 'react';
import { API_BASE } from './AdminApp.jsx';

export default function AdminSectionLottery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [source, setSource] = useState('ฮานอย');

  // โหลดเลขเด็ด
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/lottery`);
        if (!res.ok) throw new Error('โหลดเลขเด็ดไม่สำเร็จ');

        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          console.warn('รูปแบบข้อมูลหวยไม่ใช่ array:', data);
          setItems([]);
        }
      } catch (err) {
        console.error(err);
        alert(err.message || 'โหลดเลขเด็ดไม่สำเร็จ');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = { title, imageUrl, source };

      const res = await fetch(`${API_BASE}/api/lottery-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('เพิ่มเลขเด็ดไม่สำเร็จ');

      const newItem = await res.json();
      setItems((prev) =>
        Array.isArray(prev) ? [...prev, newItem] : [newItem]
      );

      setTitle('');
      setImageUrl('');
      setSource('ฮานอย');
    } catch (err) {
      console.error(err);
      alert(err.message || 'เพิ่มเลขเด็ดไม่สำเร็จ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบเลขเด็ดนี้ใช่ไหม ?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/lottery-items/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('ลบเลขเด็ดไม่สำเร็จ');

      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || 'ลบเลขเด็ดไม่สำเร็จ');
    }
  };

  return (
    <div className="admin-section">
      <h2>🔢 จัดการเลขเด็ด หวยดัง</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-row">
          <label>ชื่อรายการ / งวด / คำอธิบายสั้น ๆ</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
          <label>ประเภท</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="ฮานอย">ฮานอย</option>
            <option value="ลาว">ลาว</option>
            <option value="ไทย">ไทย</option>
          </select>
        </div>

        <button type="submit" className="admin-btn-primary">
          เพิ่มเลขเด็ด
        </button>
      </form>

      <h3>เลขเด็ดวันนี้</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>รูป</th>
            <th>ชื่อรายการ</th>
            <th>ประเภท</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4">กำลังโหลด…</td>
            </tr>
          ) : !items || items.length === 0 ? (
            <tr>
              <td colSpan="4">ยังไม่มีเลขเด็ดวันนี้</td>
            </tr>
          ) : (
            items.map((i) => (
              <tr key={i._id || i.id}>
                <td>
                  {i.imageUrl ? (
                    <img
                      src={i.imageUrl}
                      alt={i.title}
                      style={{ width: 64, height: 64, objectFit: 'cover' }}
                    />
                  ) : (
                    '-'
                  )}
                </td>
                <td>{i.title}</td>
                <td>{i.source}</td>
                <td>
                  <button
                    type="button"
                    className="admin-btn-danger"
                    onClick={() => handleDelete(i._id || i.id)}
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
