import React, { useCallback, useEffect, useState } from 'react';

const apiBase = process.env.REACT_APP_API_URL || '/api';

function checkApi() {
  return fetch(apiBase + '/budget/summary/')
    .then(res => {
      if (!res.ok) return Promise.reject(new Error('Not ok'));
      return res.json();
    })
    .then(data => {
      if (data && typeof data.total_available !== 'undefined') return true;
      return Promise.reject(new Error('Invalid response'));
    });
}

export default function ApiConnectionBanner() {
  const [unreachable, setUnreachable] = useState(false);
  const [checked, setChecked] = useState(false);
  const [rechecking, setRechecking] = useState(false);

  const runCheck = useCallback(() => {
    setRechecking(true);
    checkApi()
      .then(() => {
        setUnreachable(false);
      })
      .catch(() => {
        setUnreachable(true);
      })
      .finally(() => {
        setChecked(true);
        setRechecking(false);
      });
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

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
      <small style={{ display: 'block', marginTop: 4, opacity: 0.9 }}>App is calling: <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1em 0.3em' }}>{apiBase || '(empty)'}</code></small>
      <span style={{ opacity: 0.95 }}>
        1) On <strong>Vercel</strong>: set <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1em 0.3em' }}>REACT_APP_API_URL</code> to <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1em 0.3em' }}>https://YOUR-RENDER-URL.onrender.com/api</code> (no trailing slash), then <strong>Redeploy</strong>.
        {' '}
        2) On <strong>Render</strong>: set <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1em 0.3em' }}>CORS_ALLOW_ALL_ORIGINS</code> = <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1em 0.3em' }}>1</code> and redeploy.
        {' '}
        3) Open your Render URL in a new tab to wake the service, then{' '}
        <button
          type="button"
          onClick={runCheck}
          disabled={rechecking}
          style={{
            background: 'rgba(255,255,255,0.25)',
            border: '1px solid rgba(255,255,255,0.5)',
            color: '#fff',
            padding: '0.2em 0.6em',
            borderRadius: 4,
            cursor: rechecking ? 'wait' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {rechecking ? 'Checking…' : 'Check again'}
        </button>
      </span>
    </div>
  );
}
