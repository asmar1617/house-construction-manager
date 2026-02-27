import React, { useEffect, useState } from 'react';

const api = process.env.REACT_APP_API_URL || '/api';

function formatPkr(num) {
  return 'Rs.' + Number(num).toLocaleString('en-PK');
}

/** Sunday of the week containing dateKey (local time), as YYYY-MM-DD. */
function getWeekStart(dateKey) {
  const d = new Date(dateKey + 'T12:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day;
  const sunday = new Date(d);
  sunday.setDate(diff);
  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, '0');
  const date = String(sunday.getDate()).padStart(2, '0');
  return `${y}-${m}-${date}`;
}

function formatWeekLabel(weekKey) {
  const d = new Date(weekKey + 'T12:00:00');
  return d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateLabel(dateKey) {
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' });
}

function SpendingLogPanel({ expenses: expensesProp }) {
  const [expenses, setExpenses] = useState(expensesProp || []);
  const [loading, setLoading] = useState(!expensesProp);

  useEffect(() => {
    if (expensesProp) {
      setExpenses(expensesProp);
      setLoading(false);
      return;
    }
    fetch(api + '/expenses/')
      .then(res => res.json())
      .then(data => setExpenses(Array.isArray(data) ? data : []))
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false));
  }, [expensesProp]);

  const daily = {};
  const weekly = {};
  let overall = 0;

  expenses.forEach(e => {
    const dateKey = (e.date || '').split('T')[0];
    if (!dateKey) return;
    const amount = Number(e.amount) || 0;
    daily[dateKey] = (daily[dateKey] || 0) + amount;
    const weekKey = getWeekStart(dateKey);
    weekly[weekKey] = (weekly[weekKey] || 0) + amount;
    overall += amount;
  });

  const dailyEntries = Object.entries(daily).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
  const weeklyEntries = Object.entries(weekly).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8);

  return (
    <aside className="spending-log-panel">
      <h3 className="spending-log-panel__title">Spending log</h3>
      {loading ? (
        <div className="spending-log-panel__loading">Loading…</div>
      ) : (
        <>
          <section className="spending-log-section">
            <h4 className="spending-log-section__head">Overall</h4>
            <div className="spending-log-section__value">{formatPkr(overall)}</div>
          </section>
          <section className="spending-log-section">
            <h4 className="spending-log-section__head">Weekly</h4>
            <ul className="spending-log-list">
              {weeklyEntries.length === 0 ? (
                <li className="spending-log-list__empty">No data</li>
              ) : (
                weeklyEntries.map(([weekKey, total]) => (
                  <li key={weekKey} className="spending-log-list__item">
                    <span className="spending-log-list__label">Week of {formatWeekLabel(weekKey)}</span>
                    <span className="spending-log-list__amount">{formatPkr(total)}</span>
                  </li>
                ))
              )}
            </ul>
          </section>
          <section className="spending-log-section">
            <h4 className="spending-log-section__head">Daily</h4>
            <ul className="spending-log-list">
              {dailyEntries.length === 0 ? (
                <li className="spending-log-list__empty">No data</li>
              ) : (
                dailyEntries.map(([dateKey, total]) => (
                  <li key={dateKey} className="spending-log-list__item">
                    <span className="spending-log-list__label">{formatDateLabel(dateKey)}</span>
                    <span className="spending-log-list__amount">{formatPkr(total)}</span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </>
      )}
    </aside>
  );
}

export default SpendingLogPanel;
