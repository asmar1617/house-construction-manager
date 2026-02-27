import React, { useState, useEffect } from 'react';

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

function formatDate(dateKey) {
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function SpendingListView({
  viewType,
  expenses,
  categories = [],
  comments = {},
  onCommentChange,
  onSaveComment,
  savingId,
  getExpenseId = (e) => e.id != null ? e.id : e._id,
}) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  useEffect(() => {
    if (viewType !== 'categories') setSelectedCategory(null);
  }, [viewType]);
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let items = [];
  let title = '';
  let total = 0;

  let todayExpenses = [];
  if (viewType === 'today') {
    title = "Today's spending";
    todayExpenses = (expenses || []).filter(e => (e.date || '').split('T')[0] === todayKey);
    todayExpenses.forEach(e => { total += Number(e.amount) || 0; });
    items = todayExpenses.map(e => ({
      key: e.id,
      label: e.description + (e.category_name ? ` (${e.category_name})` : ''),
      amount: Number(e.amount) || 0,
    }));
  }
  let weeklyExpenses = [];
  let weeklyTotal = 0;
  if (viewType === 'weekly') {
    title = 'Weekly spending';
    const thisWeekStart = getWeekStart(todayKey);
    weeklyExpenses = (expenses || []).filter(e => {
      const dateKey = (e.date || '').split('T')[0];
      return dateKey && getWeekStart(dateKey) === thisWeekStart;
    });
    weeklyTotal = weeklyExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    total = weeklyTotal;
    const byWeek = {};
    expenses.forEach(e => {
      const dateKey = (e.date || '').split('T')[0];
      if (!dateKey) return;
      const weekKey = getWeekStart(dateKey);
      byWeek[weekKey] = (byWeek[weekKey] || 0) + (Number(e.amount) || 0);
    });
    Object.entries(byWeek).forEach(([weekKey, sum]) => {
      items.push({ key: weekKey, label: 'Week of ' + formatDate(weekKey), amount: sum });
    });
    items.sort((a, b) => b.key.localeCompare(a.key));
  } else if (viewType === 'categories') {
    title = 'Categories';
    const byCategory = {};
    (expenses || []).forEach(e => {
      const amount = Number(e.amount) || 0;
      total += amount;
      const name = e.category_name || e.category?.name || 'Other';
      byCategory[name] = (byCategory[name] || 0) + amount;
    });
    // Use all categories from API so any category added in admin appears here
    if (categories && categories.length > 0) {
      items = categories.map(cat => ({
        key: cat.name,
        label: cat.name,
        amount: byCategory[cat.name] || 0,
      }));
    } else {
      items = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([name, sum]) => ({ key: name, label: name, amount: sum }));
    }
  } else {
    title = 'Overall spending';
    const byCategory = {};
    expenses.forEach(e => {
      const amount = Number(e.amount) || 0;
      total += amount;
      const name = e.category_name || e.category?.name || 'Other';
      byCategory[name] = (byCategory[name] || 0) + amount;
    });
    items = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, sum]) => ({ key: name, label: name, amount: sum }));
  }

  if (viewType === 'today') {
    return (
      <div className="spending-list-view spending-list-view--today">
        <div className="summary-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="summary-card">
            <div className="label">Today&apos;s spend</div>
            <div className="value">{formatPkr(total)}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Expenses</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Notes</th>
                  <th>Your comment</th>
                  <th style={{ width: '90px' }}></th>
                </tr>
              </thead>
              <tbody>
                {todayExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No expenses today.
                    </td>
                  </tr>
                ) : (
                  todayExpenses.map((e) => (
                    <tr key={getExpenseId(e)}>
                      <td>{(e.date || '').split('T')[0]}</td>
                      <td><strong>{formatPkr(Number(e.amount) || 0)}</strong></td>
                      <td>{e.description || '—'}</td>
                      <td>{e.category_name || e.category?.name || '—'}</td>
                      <td>{e.notes || '—'}</td>
                      <td>
                        <textarea
                          className="client-comment-input"
                          value={comments[e.id] ?? (e.client_comment || '')}
                          onChange={ev => onCommentChange && onCommentChange(e.id, ev.target.value)}
                          placeholder="e.g. where money was spent..."
                          rows={2}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="small"
                          onClick={() => onSaveComment && onSaveComment(e.id)}
                          disabled={savingId === e.id}
                        >
                          {savingId === e.id ? 'Saving…' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (viewType === 'weekly') {
    return (
      <div className="spending-list-view spending-list-view--weekly">
        <div className="summary-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="summary-card">
            <div className="label">This week&apos;s spend</div>
            <div className="value">{formatPkr(weeklyTotal)}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Expenses</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Notes</th>
                  <th>Your comment</th>
                  <th style={{ width: '90px' }}></th>
                </tr>
              </thead>
              <tbody>
                {weeklyExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No expenses this week.
                    </td>
                  </tr>
                ) : (
                  weeklyExpenses.map((e) => (
                    <tr key={getExpenseId(e)}>
                      <td>{(e.date || '').split('T')[0]}</td>
                      <td><strong>{formatPkr(Number(e.amount) || 0)}</strong></td>
                      <td>{e.description || '—'}</td>
                      <td>{e.category_name || e.category?.name || '—'}</td>
                      <td>{e.notes || '—'}</td>
                      <td>
                        <textarea
                          className="client-comment-input"
                          value={comments[e.id] ?? (e.client_comment || '')}
                          onChange={ev => onCommentChange && onCommentChange(e.id, ev.target.value)}
                          placeholder="e.g. where money was spent..."
                          rows={2}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="small"
                          onClick={() => onSaveComment && onSaveComment(e.id)}
                          disabled={savingId === e.id}
                        >
                          {savingId === e.id ? 'Saving…' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (viewType === 'overall') {
    const allExpenses = expenses || [];
    const overallTotal = allExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return (
      <div className="spending-list-view spending-list-view--overall">
        <div className="summary-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="summary-card">
            <div className="label">Total spend</div>
            <div className="value">{formatPkr(overallTotal)}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Expenses</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Notes</th>
                  <th>Your comment</th>
                  <th style={{ width: '90px' }}></th>
                </tr>
              </thead>
              <tbody>
                {allExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No expenses yet.
                    </td>
                  </tr>
                ) : (
                  allExpenses.map((e) => (
                    <tr key={getExpenseId(e)}>
                      <td>{(e.date || '').split('T')[0]}</td>
                      <td><strong>{formatPkr(Number(e.amount) || 0)}</strong></td>
                      <td>{e.description || '—'}</td>
                      <td>{e.category_name || e.category?.name || '—'}</td>
                      <td>{e.notes || '—'}</td>
                      <td>
                        <textarea
                          className="client-comment-input"
                          value={comments[e.id] ?? (e.client_comment || '')}
                          onChange={ev => onCommentChange && onCommentChange(e.id, ev.target.value)}
                          placeholder="e.g. where money was spent..."
                          rows={2}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="small"
                          onClick={() => onSaveComment && onSaveComment(e.id)}
                          disabled={savingId === e.id}
                        >
                          {savingId === e.id ? 'Saving…' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (viewType === 'categories') {
    const categoryItems = items;
    const categoryExpenses = selectedCategory
      ? (expenses || []).filter(
          e => (e.category_name || e.category?.name || 'Other') === selectedCategory
        )
      : [];

    return (
      <div className="spending-list-view spending-list-view--categories">
        {categoryItems.length === 0 ? (
          <p className="spending-list-view__empty">No categories yet. Add categories in the admin.</p>
        ) : (
          <div className="summary-grid spending-list-view__grid spending-list-view__category-boxes">
            {categoryItems.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`summary-card spending-list-view__category-box${selectedCategory === key ? ' active' : ''}`}
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              >
                <div className="label">{label}</div>
              </button>
            ))}
          </div>
        )}
        {selectedCategory ? (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="card-title" style={{ marginBottom: 0 }}>{selectedCategory}</div>
              <button type="button" className="spending-list-view__back" onClick={() => setSelectedCategory(null)}>
                Clear
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Notes</th>
                    <th>Your comment</th>
                    <th style={{ width: '90px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {categoryExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No expenses in this category.
                      </td>
                    </tr>
                  ) : (
                    categoryExpenses.map((e) => (
                      <tr key={getExpenseId(e)}>
                        <td>{(e.date || '').split('T')[0]}</td>
                        <td><strong>{formatPkr(Number(e.amount) || 0)}</strong></td>
                        <td>{e.description || '—'}</td>
                        <td>{e.category_name || e.category?.name || '—'}</td>
                        <td>{e.notes || '—'}</td>
                        <td>
                          <textarea
                            className="client-comment-input"
                            value={comments[e.id] ?? (e.client_comment || '')}
                            onChange={ev => onCommentChange && onCommentChange(e.id, ev.target.value)}
                            placeholder="e.g. where money was spent..."
                            rows={2}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="small"
                            onClick={() => onSaveComment && onSaveComment(e.id)}
                            disabled={savingId === e.id}
                          >
                            {savingId === e.id ? 'Saving…' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="spending-list-view">
      <h2 className="spending-list-view__title">{title}</h2>
      <div className="spending-list-view__total">Total: <strong>{formatPkr(total)}</strong></div>
      <ul className="spending-list-view__list">
        {items.length === 0 ? (
          <li className="spending-list-view__empty">No expenses in this period.</li>
        ) : (
          items.map(({ key, label, amount }) => (
            <li key={key} className="spending-list-view__item">
              <span className="spending-list-view__label">{label}</span>
              <span className="spending-list-view__amount">{formatPkr(amount)}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default SpendingListView;
