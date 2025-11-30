import React, { useEffect, useState } from 'react';
import { API_BASE } from './AdminApp.jsx';

export default function AdminSectionGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');        // 👈 ชื่อเกม
  const [percent, setPercent] = useState(90);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // โหลดรายการเกมแตกดี
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/games`);
        if (!res.ok) throw new Error('โหลดเกมไม่สำเร็จ');
        const data = await res.json();
        if (Array.isArray(data)) setGames(data);
        else setGames([]);
      } catch (err) {
        console.error(err);
        alert(err.message || 'โหลดเกมไม่สำเร็จ');
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // อัปโหลดรูป
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('อัปโหลดรูปไม่สำเร็จ');

    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!imageFile) {
        alert('กรุณาเลือกรูปเกมก่อน');
        return;
      }

      const imageUrl = await uploadImage(imageFile);

      const body = {
        title,                        // 👈 ส่งชื่อเกมไป backend
        imageUrl,
        percent: Number(percent),
      };

      const res = await fetch(`${API_BASE}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('เพิ่มเกมไม่สำเร็จ');

      const newGame = await res.json();
      setGames((prev) => (Array.isArray(prev) ? [...prev, newGame] : [newGame]));

      setTitle('');
      setPercent(90);
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'เพิ่มเกมไม่สำเร็จ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบเกมนี้ใช่ไหม ?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/games/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('ลบเกมไม่สำเร็จ');
      setGames((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || 'ลบเกมไม่สำเร็จ');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  // ล้างรูปที่เลือกไว้
const handleClearImage = () => {
  if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
  }
  setImageFile(null);
  setImagePreview(null);
};


  return (
    <div className="admin-section">
      <h2>🎰 จัดการเกมแตกดี</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        {/* ชื่อเกม */}
        <div className="admin-form-row">
          <label>ชื่อเกม</label>
          <input
            type="text"
            placeholder="เช่น เกมสล็อต X"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* เปอร์เซ็นต์แตกดี */}
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

        {/* ปุ่มอัปโหลดรูป */}
        <div className="admin-form-row">
          <div className="file-input-wrapper">
            <label className="file-input-label">
              <span className="icon">📁</span>
              <span>เลือกไฟล์จากเครื่อง</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
            {imageFile && (
              <span className="file-input-name">{imageFile.name}</span>
            )}
          </div>
        </div>

        {imagePreview && (
  <div className="admin-image-preview">
    <p>ตัวอย่างรูปเกม</p>
    <img src={imagePreview} alt="ตัวอย่างรูปเกม" />
    <button
      type="button"
      className="admin-btn-ghost"
      onClick={handleClearImage}
    >
      ลบรูป
    </button>
  </div>
)}


        <button type="submit" className="admin-btn-primary">
          เพิ่มเกม
        </button>
      </form>

      <h3>รายการเกมวันนี้</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>รูป</th>
            <th>ชื่อเกม</th>      {/* 👈 เพิ่มคอลัมน์ชื่อ */}
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
                      alt={g.title || 'game'}
                      style={{
                        width: 64,
                        height: 64,
                        objectFit: 'cover',
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    '-'
                  )}
                </td>
                <td>{g.title || '-'}</td>
                <td>{g.percent}</td>
                <td>
                  <button
                    type="button"
                    className="admin-btn-danger"
                    onClick={() => handleDelete(g._id || g.id)}
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
