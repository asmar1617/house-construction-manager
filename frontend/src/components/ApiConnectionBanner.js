import React, { useEffect, useState } from 'react';

const apiBase = process.env.REACT_APP_API_URL || '/api';

export default function ApiConnectionBanner() {
  const [unreachable, setUnreachable] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(apiBase + '/budget/summary/')
      .then(res => {
        if (cancelled) return;
        if (!res.ok) {
          setUnreachable(true);
          return;
        }
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        if (data && typeof data.total_available !== 'undefined') setUnreachable(false);
        else setUnreachable(true);
      })
      .catch(() => {
        if (!cancelled) setUnreachable(true);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => { cancelled = true; };
  }, []);

  if (!checked || !unreachable) return null;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        background: '#dc2626',
        color: '#fff',
        padding: '0.75rem 1rem',
        fontSize: '0.9rem',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <strong>Cannot connect to the API.</strong> Amounts and login will not work until the backend is reachable.
      <br />
      <span style={{ opacity: 0.95 }}>
        1) On <strong>Vercel</strong>: set <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1em 0.3em' }}>REACT_APP_API_URL</code> to <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1em 0.3em' }}>https://YOUR-RENDER-URL.onrender.com/api</code> (no trailing slash), then <strong>Redeploy</strong>.
        {' '}
        2) On <strong>Render</strong>: set <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1em 0.3em' }}>CORS_ALLOW_ALL_ORIGINS</code> = <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1em 0.3em' }}>1</code> and redeploy.
        {' '}
        3) Open your Render URL in a new tab to wake the service, then refresh this page.
      </span>
    </div>
  );
}
