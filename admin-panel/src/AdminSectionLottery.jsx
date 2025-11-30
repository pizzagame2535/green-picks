import React, { useEffect, useState } from 'react';
import { BACKEND_API_BASE } from './config';

const API_BASE = BACKEND_API_BASE;


export default function AdminSectionLottery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');           // 👈 ชื่อรายการเลขเด็ด
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/lottery`);
        if (!res.ok) throw new Error('โหลดเลขเด็ดไม่สำเร็จ');
        const data = await res.json();
        if (Array.isArray(data)) setItems(data);
        else setItems([]);
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
        alert('กรุณาเลือกรูปเลขเด็ดก่อน');
        return;
      }

      const imageUrl = await uploadImage(imageFile);

      const body = {
        title,                // 👈 ตั้งชื่อเลขเด็ด
        source: 'ฮานอย',
        imageUrl,
      };

      const res = await fetch(`${API_BASE}/api/lottery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('เพิ่มเลขเด็ดไม่สำเร็จ');

      const newItem = await res.json();
      setItems((prev) => (Array.isArray(prev) ? [...prev, newItem] : [newItem]));

      setTitle('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'เพิ่มเลขเด็ดไม่สำเร็จ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบเลขเด็ดนี้ใช่ไหม ?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/lottery/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('ลบเลขเด็ดไม่สำเร็จ');
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || 'ลบเลขเด็ดไม่สำเร็จ');
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
      <h2>🔢 จัดการเลขเด็ด หวยดัง</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        {/* ชื่อรายการเลขเด็ด */}
        <div className="admin-form-row">
          <input
            type="text"
            placeholder="ตั้งชื่อ"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* ปุ่มอัปโหลดรูป */}
        <div className="admin-form-row">
          <div className="file-input-wrapper">
            <label className="file-input-label">
              <span className="icon">📁</span>
              <span>เลือกไฟล์</span>
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
    <p>ตัวอย่างรูปเลขเด็ด</p>
    <img src={imagePreview} alt="ตัวอย่างเลขเด็ด" />
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
          เพิ่มเลขเด็ด
        </button>
      </form>

      <h3>เลขเด็ดวันนี้</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>รูป</th>
            <th>ชื่อรายการ</th>   {/* 👈 เพิ่มคอลัมน์ชื่อ */}
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="3">กำลังโหลด…</td>
            </tr>
          ) : !items || items.length === 0 ? (
            <tr>
              <td colSpan="3">ยังไม่มีเลขเด็ดวันนี้</td>
            </tr>
          ) : (
            items.map((i) => (
              <tr key={i._id || i.id}>
                <td>
                  {i.imageUrl ? (
                    <img
                      src={i.imageUrl}
                      alt={i.title || 'lottery'}
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
                <td>{i.title || '-'}</td>
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
