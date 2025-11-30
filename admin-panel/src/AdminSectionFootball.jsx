import React, { useEffect, useState } from 'react';
import { API_BASE } from './AdminApp.jsx';

export default function AdminSectionFootball() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');           // 👈 ชื่อทีเด็ด หรือคู่บอล
  const [confidence, setConfidence] = useState(90);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/football-tips`);
        if (!res.ok) throw new Error('โหลดทีเด็ดบอลไม่สำเร็จ');
        const data = await res.json();
        if (Array.isArray(data)) setTips(data);
        else setTips([]);
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
        alert('กรุณาเลือกรูปทีเด็ดบอลก่อน');
        return;
      }

      const imageUrl = await uploadImage(imageFile);

      const body = {
        title,                           // 👈 ส่งชื่อรายการไป backend
        confidence: Number(confidence),
        imageUrl,
      };

      const res = await fetch(`${API_BASE}/api/football-tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('เพิ่มทีเด็ดบอลไม่สำเร็จ');

      const newTip = await res.json();
      setTips((prev) => (Array.isArray(prev) ? [...prev, newTip] : [newTip]));

      setTitle('');
      setConfidence(90);
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'เพิ่มทีเด็ดบอลไม่สำเร็จ');
    }
  };

const handleDelete = async (id) => {
  if (!window.confirm('ต้องการลบทีเด็ดนี้ใช่ไหม ?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/football-tips/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('ลบทีเด็ดบอลไม่สำเร็จ');

    setTips((prev) => prev.filter((t) => (t._id || t.id) !== id));
  } catch (err) {
    console.error(err);
    alert(err.message || 'ลบทีเด็ดบอลไม่สำเร็จ');
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
      <h2>⚽ จัดการทีเด็ดบอล (อัปโหลดรูป)</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        {/* ชื่อทีเด็ด / คู่บอล */}
        <div className="admin-form-row">
          <label>ชื่อรายการ / คู่บอล</label>
          <input
            type="text"
            placeholder="เช่น แมนฯยู vs ลิเวอร์พูล"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* ความมั่นใจ */}
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
    <p>ตัวอย่างรูปทีเด็ดบอล</p>
    <img src={imagePreview} alt="ตัวอย่างทีเด็ดบอล" />
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
          เพิ่มทีเด็ดบอล
        </button>
      </form>

      <h3>ทีเด็ดบอลวันนี้</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>รูป</th>
            <th>ชื่อรายการ</th>      {/* 👈 เพิ่มคอลัมน์ชื่อ */}
            <th>ความมั่นใจ (%)</th>
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
                  {t.imageUrl ? (
                    <img
                      src={t.imageUrl}
                      alt={t.title || 'football tip'}
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
                <td>{t.title || '-'}</td>
                <td>{t.confidence}</td>
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
