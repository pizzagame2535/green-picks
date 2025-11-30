// src/AdminSectionWithdraw.jsx
import React, { useEffect, useState } from 'react';
import { MERCHANT_API_BASE } from './config';

// ใช้คีย์ไม่ซ้ำต่อรายการถอนเงิน (เอาไว้กัน key ซ้ำ + map สถานะสแกน)
// ถ้ามีหมายเลขอ้างอิงจริง ๆ (เช่น ref_statement_id) เติมเข้าได้เลย
const getWithdrawKey = (w, fallbackIndex = 0) =>
  w?.transaction_id ||
  w?.ref_statement_id ||
  w?.id ||
  `row-${fallbackIndex}`;

// helper รวมรายการเก่ากับรายการใหม่แบบไม่ให้ซ้ำ
// append=false  ⇒ ใช้ตอน refresh : หน้าใหม่อยู่บน ตามด้วยของเก่าที่เหลือ
// append=true   ⇒ ใช้ตอน append เพิ่มท้าย (ตอนนี้ยังไม่ได้ใช้ แต่เก็บไว้)
const mergeRows = (prevRows, newList, { append = false } = {}) => {
  if (!Array.isArray(prevRows)) prevRows = [];
  if (!Array.isArray(newList)) newList = [];

  if (prevRows.length === 0 && !append) {
    return newList;
  }

  if (append) {
    const existingKeys = new Set(
      prevRows.map((row, idx) => getWithdrawKey(row, idx)),
    );
    const onlyNew = newList.filter(
      (item, idx) => !existingKeys.has(getWithdrawKey(item, idx)),
    );
    return [...prevRows, ...onlyNew];
  }

  const mapPrev = new Map();
  prevRows.forEach((row, idx) => {
    mapPrev.set(getWithdrawKey(row, idx), row);
  });

  const usedKeys = new Set();
  const merged = [];

  newList.forEach((item, idx) => {
    const key = getWithdrawKey(item, idx);
    usedKeys.add(key);
    const mergedItem = mapPrev.has(key)
      ? { ...mapPrev.get(key), ...item }
      : item;
    merged.push(mergedItem);
  });

  prevRows.forEach((row, idx) => {
    const key = getWithdrawKey(row, idx);
    if (!usedKeys.has(key)) {
      merged.push(row);
    }
  });

  return merged;
};

const AUTO_REFRESH_INTERVAL = 60; // วินาที
const INITIAL_FETCH_SIZE = 100; // ดึงจาก API 100 รายการแรกตอนโหลด และตอน refresh

export default function AdminSectionWithdraw() {
  const [allRows, setAllRows] = useState([]);      // เก็บ "ทุก" รายการที่มีในฝั่งเรา
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [qrInfo, setQrInfo] = useState(null);

  // สถานะสแกน: key → 'pending' | 'done'
  const [scanStatus, setScanStatus] = useState(() => {
    try {
      const raw = localStorage.getItem('withdraw_scan_status_v1');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('อ่าน withdraw_scan_status_v1 ไม่ได้', e);
      return {};
    }
  });

  // การแบ่งหน้า "ฝั่งหน้าเว็บ"
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); // เริ่มต้น 20 รายการ/หน้า

  // นับถอยหลัง auto-refresh
  const [refreshCountdown, setRefreshCountdown] = useState(
    AUTO_REFRESH_INTERVAL,
  );

  // sync scanStatus → localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        'withdraw_scan_status_v1',
        JSON.stringify(scanStatus),
      );
    } catch (e) {
      console.warn('บันทึก withdraw_scan_status_v1 ไม่ได้', e);
    }
  }, [scanStatus]);

  // ฟังก์ชันดึง "100 รายการล่าสุด" จาก API หน้า 1
  const fetchLatest = async ({ showLoading = true } = {}) => {
    const token = localStorage.getItem('auth_token.laravelJWT') || '';
    if (!token) {
      setError('ไม่พบ token ใน localStorage (auth_token.laravelJWT)');
      if (showLoading) setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
    setError('');

    try {
      const res = await fetch(
        `${MERCHANT_API_BASE}/api/merchant/financial-withdraws?page=1&per_page=${INITIAL_FETCH_SIZE}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json, text/plain, */*',
            Authorization: token,
          },
          credentials: 'include',
        },
      );

      if (!res.ok) {
        throw new Error(`โหลดข้อมูลไม่สำเร็จ (status ${res.status})`);
      }

      const json = await res.json();
      console.log('financial-withdraws json:', json);

      let list = [];
      if (Array.isArray(json.data)) list = json.data;
      else if (Array.isArray(json.data?.data)) list = json.data.data;

      list = list || [];

      // รวมกับของเดิม (รายการใหม่อยู่บนสุด, ของเก่าไม่หาย)
      setAllRows((prev) => mergeRows(prev, list, { append: false }));

      // เติมสถานะ default ให้รายการใหม่ (ไม่ทับของเดิม)
      setScanStatus((prev) => {
        const next = { ...prev };
        list.forEach((item, idx) => {
          const key = getWithdrawKey(item, idx);
          if (key && !next[key]) {
            next[key] = 'pending';
          }
        });
        return next;
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // โหลด 100 รายการแรกตอนเปิดหน้า
  useEffect(() => {
    fetchLatest({ showLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh + นับถอยหลัง (ไม่ผูกกับ currentPage แล้ว)
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          // ถึงเวลา auto refresh
          fetchLatest({ showLoading: false });
          return AUTO_REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ถ้าเปลี่ยน pageSize หรือจำนวน allRows เปลี่ยนจน currentPage > จำนวนหน้า ให้ดึงกลับให้อยู่ในช่วง
  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(allRows.length / (pageSize || 1)),
    );
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [allRows.length, pageSize, currentPage]);

  const handleChangePage = (page) => {
    const totalPages = Math.max(
      1,
      Math.ceil(allRows.length / (pageSize || 1)),
    );
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const handleChangePageSize = (e) => {
    const newSize = Number(e.target.value) || 20;
    setPageSize(newSize);
    setCurrentPage(1); // เปลี่ยน pageSize ให้กลับไปหน้า 1
  };

  const handleManualRefresh = () => {
    setRefreshCountdown(AUTO_REFRESH_INTERVAL);
    fetchLatest({ showLoading: true });
  };

  const formatMoney = (val) => {
    if (val == null || val === '') return '-';
    const num = Number(val);
    if (Number.isNaN(num)) return val;
    return num.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDateTime = (val) => {
    if (!val) return '-';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return val;
    return d.toLocaleString('th-TH');
  };

  const normalizePromptPayPhone = (raw) =>
    raw ? String(raw).replace(/\D/g, '') : '';

  const handleShowQr = async (w, rowKey) => {
    const username =
      w.member?.username ||
      w.member_username ||
      w.member_account ||
      w.username ||
      '-';

    const bankName =
      w.bank_name ||
      w.bank_account_name ||
      (w.bank && (w.bank.name || w.bank.code)) ||
      '-';

    const bankAccountNo =
      w.request_bank_account_no ||
      w.bank_account?.bank_account_no ||
      '-';

    const phoneRaw =
      w.member?.phone_number ||
      w.operator_name ||
      w.agent_name ||
      w.created_by ||
      '';

    const phone = normalizePromptPayPhone(phoneRaw);
    const amountNum = Number(w.amount || w.total_amount || w.value || 0);

    if (!phone || !amountNum) {
      alert('ไม่พบเบอร์โทรศัพท์หรือยอดเงินสำหรับสร้าง QR PromptPay');
      return;
    }

    // เปิด popup ทันที
    setQrInfo({
      withdrawKey: rowKey,
      customerName: username,
      bankName,
      bankAccountNo,
      username,
      phoneRaw,
      phone,
      amount: amountNum,
      note: '',
    });

    // ยิง API ดูข้อมูล member เพื่อดึงชื่อจริง
    const memberId = w.member?.id || w.member_id;
    if (!memberId) return;

    try {
      const token = localStorage.getItem('auth_token.laravelJWT') || '';
      if (!token) return;

      const res = await fetch(
        `${MERCHANT_API_BASE}/api/merchant/members/${memberId}?id=${memberId}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json, text/plain, */*',
            Authorization: token,
          },
          credentials: 'include',
        },
      );

      if (!res.ok) {
        console.warn('โหลดข้อมูลสมาชิกไม่สำเร็จ', res.status);
        return;
      }

      const json = await res.json();
      console.log('member detail json:', json);

      const m = json.data || json;

      const realName =
        m.fullNameTH ||
        m.fullNameEN ||
        m.customer_name ||
        m.member_name ||
        m.full_name ||
        m.fullname ||
        (m.first_name && m.last_name
          ? `${m.first_name} ${m.last_name}`
          : '') ||
        m.name ||
        '';

      if (realName) {
        setQrInfo((prev) =>
          prev ? { ...prev, customerName: realName } : prev,
        );
      }
    } catch (err) {
      console.warn('เรียก API สมาชิกไม่สำเร็จ', err);
      setQrInfo((prev) =>
        prev
          ? {
              ...prev,
              note: 'โหลดชื่อลูกค้าไม่สำเร็จ (แต่ QR ยังใช้งานได้)',
            }
          : prev,
      );
    }
  };

  const handleCloseQr = () => setQrInfo(null);

  const handleQrDone = () => {
    if (qrInfo?.withdrawKey != null) {
      setScanStatus((prev) => ({
        ...prev,
        [qrInfo.withdrawKey]: 'done',
      }));
    }
    setQrInfo(null);
  };

  const renderScanStatusBadge = (rowKey) => {
    const isDone = scanStatus[rowKey] === 'done';
    const bg = isDone ? '#22c55e' : '#facc15';
    const label = isDone ? 'เสร็จสิ้น' : 'รอสแกน';

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: 999,
          background: bg,
          color: '#000',
          fontSize: 12,
          fontWeight: 600,
          minWidth: 72,
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    );
  };

  // แบ่งหน้าในฝั่ง frontend
  const totalPages = Math.max(1, Math.ceil(allRows.length / (pageSize || 1)));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedRows = allRows.slice(startIndex, startIndex + pageSize);

  // หัวตาราง – ตัวใหญ่ขึ้น
  const headerCellStyle = {
    padding: '6px 10px',
    fontSize: '1.1rem',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  };

  // เนื้อหา – ตัวใหญ่ขึ้น + แถวกระชับ
  const bodyCellStyle = {
    padding: '4px 10px',
    fontSize: '0.95rem',
    lineHeight: 1.35,
    verticalAlign: 'middle',
  };

  return (
    <div
      className="admin-withdraw"
      style={{
        background: 'linear-gradient(135deg,#111827,#020617)', // ดำ-เทา
        borderRadius: 18,
        padding: '20px 24px',
        minHeight: 'calc(100vh - 140px)',
      }}
    >
      {/* แถวหัวเรื่อง + ปุ่มรีเฟรช + ดรอปดาวเลือกจำนวนต่อหน้า */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: '1.2rem',
          flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            fontSize: '2.1rem',
            margin: 0,
          }}
        >
          รายการถอนเงิน
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
            }}
          >
            <span style={{ opacity: 0.8 }}>แสดงทีละ</span>
            <select
              value={pageSize}
              onChange={handleChangePageSize}
              style={{
                padding: '4px 8px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(15,23,42,0.9)',
                color: '#fff',
                fontSize: 13,
              }}
            >
              <option value={20}>20 รายการ</option>
              <option value={30}>30 รายการ</option>
              <option value={50}>50 รายการ</option>
              <option value={100}>100 รายการ</option>
            </select>
          </div>

          <button
            onClick={handleManualRefresh}
            style={{
              padding: '8px 20px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.35)',
              background:
                'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(59,130,246,0.4))',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            รีเฟรชรายการล่าสุด ({refreshCountdown}s)
          </button>
        </div>
      </div>

      {loading && allRows.length === 0 && <p>กำลังโหลดข้อมูล...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && allRows.length === 0 && (
        <p>ยังไม่มีรายการถอนเงิน</p>
      )}

      {!loading && !error && allRows.length > 0 && (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={headerCellStyle}>ลำดับ</th>
                <th style={headerCellStyle}>ธนาคาร</th>
                <th style={headerCellStyle}>บัญชีผู้ใช้</th>
                <th style={headerCellStyle}>ยอดเงิน</th>
                <th style={headerCellStyle}>วันที่ทำรายการ</th>
                <th style={headerCellStyle}>ผู้ทำรายการ</th>
                <th style={headerCellStyle}>สถานะสแกน</th>
                <th style={headerCellStyle}>QR CODE</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((w, index) => {
                const globalIndex = startIndex + index; // index ใน allRows
                const rowKey = getWithdrawKey(w, globalIndex);

                const bankLabel =
                  w.bank_name ||
                  w.bank_account_name ||
                  (w.bank && (w.bank.name || w.bank.code)) ||
                  '-';

                const username =
                  w.member?.username ||
                  w.member_username ||
                  w.member_account ||
                  w.username ||
                  '-';

                const userBankRef = w.request_bank_account_no || '';

                const operator =
                  w.operator_name || w.agent_name || w.created_by || '-';

                const hasQr =
                  (w.member?.phone_number ||
                    w.operator_name ||
                    w.agent_name ||
                    w.created_by) &&
                  (w.amount || w.total_amount || w.value);

                return (
                  <tr key={rowKey}>
                    <td style={bodyCellStyle}>{globalIndex + 1}</td>

                    <td style={bodyCellStyle}>{bankLabel}</td>

                    <td style={bodyCellStyle}>
                      <div>{username}</div>
                      {userBankRef && (
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                          {userBankRef}
                        </div>
                      )}
                    </td>

                    <td style={bodyCellStyle}>
                      {formatMoney(w.amount || w.total_amount || w.value)}
                    </td>

                    <td style={bodyCellStyle}>
                      {formatDateTime(
                        w.created_at || w.transaction_at || w.requested_at,
                      )}
                    </td>

                    <td style={bodyCellStyle}>{operator}</td>

                    <td style={bodyCellStyle}>
                      {renderScanStatusBadge(rowKey)}
                    </td>

                    <td style={bodyCellStyle}>
                      <button
                        onClick={() => handleShowQr(w, rowKey)}
                        disabled={!hasQr}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 999,
                          border: '1px solid rgba(255,255,255,0.35)',
                          background: hasQr
                            ? 'linear-gradient(135deg,#f97316,#ec4899)'
                            : 'rgba(255,255,255,0.12)',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: hasQr ? 'pointer' : 'default',
                          opacity: hasQr ? 1 : 0.3,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ดู QR
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* แถบควบคุมหน้า (pagination) */}
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 13,
                opacity: 0.8,
              }}
            >
              หน้าปัจจุบัน: {currentPage} / {totalPages}{' '}
              (ทั้งหมด {allRows.length} รายการ)
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleChangePage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.35)',
                  background:
                    currentPage === 1
                      ? 'rgba(148,163,184,0.5)'
                      : 'rgba(15,23,42,0.9)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: currentPage === 1 ? 'default' : 'pointer',
                  minWidth: 90,
                }}
              >
                ก่อนหน้า
              </button>

              <button
                onClick={() => handleChangePage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background:
                    currentPage >= totalPages
                      ? 'rgba(148,163,184,0.5)'
                      : 'linear-gradient(135deg,#22c55e,#16a34a)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: currentPage >= totalPages ? 'default' : 'pointer',
                  minWidth: 90,
                }}
              >
                ถัดไป
              </button>
            </div>
          </div>
        </>
      )}

      {/* POPUP QR */}
      {qrInfo && (
        <div
          onClick={handleCloseQr}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1f0635',
              color: '#fff',
              padding: '22px 26px',
              borderRadius: 18,
              minWidth: 340,
              maxWidth: '90vw',
              textAlign: 'center',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 14 }}>QR PromptPay</h3>

            {qrInfo.note && (
              <p style={{ color: 'salmon', marginBottom: 10 }}>
                {qrInfo.note}
              </p>
            )}

            <div
              style={{
                textAlign: 'left',
                margin: '0 auto 16px',
                fontSize: 14,
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 12,
                padding: '10px 12px',
                lineHeight: 1.6,
                background: 'rgba(0,0,0,0.15)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span style={{ opacity: 0.85 }}>ชื่อลูกค้า</span>
                <span>{qrInfo.customerName}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span style={{ opacity: 0.85 }}>เบอร์โทรศัพท์</span>
                <span>{qrInfo.phoneRaw}</span>
              </div>

              {(() => {
                const cleanName = (qrInfo.bankName || '').replace(
                  /^ธนาคาร\s*/,
                  '',
                );
                return (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ opacity: 0.85 }}>ธนาคาร</span>
                    <span>
                      {cleanName}{' '}
                      <span
                        style={{
                          fontWeight: 700,
                          textDecoration: 'underline',
                        }}
                      >
                        ({qrInfo.bankAccountNo})
                      </span>
                    </span>
                  </div>
                );
              })()}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginTop: 6,
                  alignItems: 'center',
                }}
              >
                <span style={{ opacity: 0.85 }}>ยอดเงินที่จะโอน</span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#ffdc7d',
                  }}
                >
                  {formatMoney(qrInfo.amount)} บาท
                </span>
              </div>
            </div>

            <div
              style={{
                margin: '12px auto 18px',
                padding: 8,
                background: '#fff',
                borderRadius: 12,
                display: 'inline-block',
              }}
            >
              <img
                src={`https://promptpay.io/${encodeURIComponent(
                  qrInfo.phone,
                )}/${qrInfo.amount.toFixed(2)}.png`}
                alt="QR PromptPay"
                style={{ width: 220, height: 220, display: 'block' }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 10,
                marginTop: 4,
              }}
            >
              <button
                onClick={handleQrDone}
                style={{
                  padding: '6px 18px',
                  borderRadius: 999,
                  border: 'none',
                  background: '#22c55e',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minWidth: 90,
                }}
              >
                เสร็จสิ้น
              </button>
              <button
                onClick={handleCloseQr}
                style={{
                  padding: '6px 18px',
                  borderRadius: 999,
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minWidth: 90,
                }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
