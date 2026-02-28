import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DarkVeil from './components/DarkVeil';
import ApiConnectionBanner from './components/ApiConnectionBanner';
import useAuth from './hooks/useAuth';
import PublicDashboard from './pages/PublicDashboard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Categories from './pages/Categories';
import Funds from './pages/Funds';
import Export from './pages/Export';

function App() {
  const { isAdmin } = useAuth();

  useEffect(() => {
    const forceDefaultCursor = () => {
      [document.documentElement, document.body].forEach((el) => {
        if (!el) return;
        const s = el.getAttribute('style');
        if (s && /crosshair/i.test(s)) {
          el.setAttribute('style', (s.replace(/cursor\s*:\s*crosshair\s*;?/gi, '')).trim() || '');
        }
        el.style.cursor = 'default';
      });
    };
    forceDefaultCursor();
    const interval = setInterval(forceDefaultCursor, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-with-veil">
      <ApiConnectionBanner />
      <DarkVeil />
      <Routes>
        {isAdmin ? (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/funds" element={<Funds />} />
            <Route path="/export" element={<Export />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<PublicDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/expenses" element={<Navigate to="/" replace />} />
            <Route path="/categories" element={<Navigate to="/" replace />} />
            <Route path="/funds" element={<Navigate to="/" replace />} />
            <Route path="/export" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </div>
  );
}

export default App;
