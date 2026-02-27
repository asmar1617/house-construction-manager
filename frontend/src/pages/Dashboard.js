import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

const api = process.env.REACT_APP_API_URL || '/api';

function formatPkr(num) {
  return 'Rs.' + Number(num).toLocaleString('en-PK');
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(api + '/budget/summary/')
      .then(res => res.json())
      .then(data => { setSummary(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <div className="page-header">
          <h1>Dashboard</h1>
        </div>

        {loading ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading…
          </div>
        ) : summary ? (
          <>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="label">Total budget</div>
                <div className="value">{formatPkr(summary.total_available)}</div>
              </div>
              <div className="summary-card spent">
                <div className="label">Total spent</div>
                <div className="value">{formatPkr(summary.total_spent)}</div>
              </div>
              <div className="summary-card remaining">
                <div className="label">Remaining</div>
                <div className="value">{formatPkr(summary.remaining)}</div>
              </div>
              <div className="summary-card">
                <div className="label">Expenses</div>
                <div className="value">{summary.expense_count}</div>
              </div>
            </div>

            {summary.category_totals && Object.keys(summary.category_totals).length > 0 && (
              <div className="card">
                <div className="card-title">Spending by category</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {Object.entries(summary.category_totals).map(([name, amount]) => (
                    <span key={name} className="category-chip">
                      {name}: <strong>{formatPkr(amount)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Could not load summary. Check that the server is running.
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
