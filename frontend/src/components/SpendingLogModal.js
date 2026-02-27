import React, { useEffect, useState } from 'react';

const api = process.env.REACT_APP_API_URL || '/api';

function formatPkr(num) {
  return 'Rs.' + Number(num).toLocaleString('en-PK');
}

function SpendingLogModal({ onClose, expenses: expensesProp }) {
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

  let overall = 0;
  const byCategory = {};
  expenses.forEach(e => {
    const amount = Number(e.amount) || 0;
    overall += amount;
    const name = e.category_name || e.category?.name || 'Other';
    byCategory[name] = (byCategory[name] || 0) + amount;
  });
  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content spending-log-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-content__header">
          <h2>Overall spending</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        {loading ? (
          <div className="spending-log-modal__loading">Loading…</div>
        ) : (
          <>
            <div className="spending-log-modal__total">
              <span className="spending-log-modal__total-label">Total spent</span>
              <span className="spending-log-modal__total-value">{formatPkr(overall)}</span>
            </div>
            {categoryEntries.length > 0 && (
              <div className="spending-log-modal__breakdown">
                <h4>By category</h4>
                <ul className="spending-log-list">
                  {categoryEntries.map(([name, total]) => (
                    <li key={name} className="spending-log-list__item">
                      <span className="spending-log-list__label">{name}</span>
                      <span className="spending-log-list__amount">{formatPkr(total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SpendingLogModal;
