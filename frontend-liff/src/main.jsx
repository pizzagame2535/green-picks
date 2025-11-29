import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import liff from '@line/liff';
import './styles.css';

const LIFF_ID = import.meta.env.VITE_LIFF_ID;

function Root() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    liff
      .init({ liffId: LIFF_ID })
      .then(() => setReady(true))
      .catch((err) => {
        console.error(err);
        setError('ไม่สามารถโหลด LIFF ได้');
      });
  }, []);

  if (error) return <div className="app-loading">{error}</div>;
  if (!ready) return <div className="app-loading">กำลังโหลด...</div>;

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
