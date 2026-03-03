import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const apiBase = process.env.REACT_APP_API_URL || '/api';

function formatPkr(num) {
  return 'Rs.' + Number(num).toLocaleString('en-PK');
}

/** Bank-statement style popup: one expense record details. Rendered via portal so it always appears on top. */
function ExpenseDetailModal({ expense, comments = {}, onClose }) {
  if (!expense) return null;
  const dateKey = (expense.date || '').split('T')[0];
  const comment = comments[expense.id] ?? expense.client_comment ?? '';
  const baseUrl = apiBase.replace(/\/api\/?$/, '');
  const imageUrl = expense.image
    ? (expense.image.startsWith('http') ? expense.image : `${baseUrl}${expense.image.startsWith('/') ? '' : '/'}${expense.image}`)
    : null;
  const modalEl = (
    <div className="modal expense-detail-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Expense details">
      <div className="modal-content expense-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="expense-detail-modal__header">
          <h2 className="expense-detail-modal__title">Expense details</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <dl className="expense-detail-modal__list">
          <div className="expense-detail-modal__row">
            <dt>Date</dt>
            <dd>{dateKey || '—'}</dd>
          </div>
          <div className="expense-detail-modal__row">
            <dt>Amount</dt>
            <dd><strong>{formatPkr(Number(expense.amount) || 0)}</strong></dd>
          </div>
          <div className="expense-detail-modal__row">
            <dt>Description</dt>
            <dd>{expense.description || '—'}</dd>
          </div>
          <div className="expense-detail-modal__row">
            <dt>Category</dt>
            <dd>{expense.category_name || expense.category?.name || '—'}</dd>
          </div>
          <div className="expense-detail-modal__row">
            <dt>Notes</dt>
            <dd>{expense.notes || '—'}</dd>
          </div>
          <div className="expense-detail-modal__row">
            <dt>Your comment</dt>
            <dd>{comment || '—'}</dd>
          </div>
          {imageUrl && (
            <div className="expense-detail-modal__row">
              <dt>Receipt</dt>
              <dd>
                <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="expense-detail-modal__receipt-link">View receipt</a>
                <img src={imageUrl} alt="Receipt" className="expense-detail-modal__receipt-img" />
              </dd>
            </div>
          )}
        </dl>
        <div className="expense-detail-modal__actions">
          <button type="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
  return createPortal(modalEl, document.body);
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
  const [detailExpense, setDetailExpense] = useState(null);
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
    const todayRaw = (expenses || []).filter(e => (e.date || '').split('T')[0] === todayKey);
    const seenIds = new Set();
    todayExpenses = todayRaw.filter(e => {
      const id = e.id ?? e._id;
      if (id != null && seenIds.has(id)) return false;
      if (id != null) seenIds.add(id);
      return true;
    });
    todayExpenses.forEach(e => { total += Number(e.amount) || 0; });
    items = todayExpenses.map(e => ({
      key: e.id ?? e._id ?? e.description,
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
          <div className="card-title">Expenses (click a row to view details)</div>
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
                    <tr
                      key={getExpenseId(e)}
                      className="expense-row-clickable"
                      onClick={() => setDetailExpense(e)}
                    >
                      <td>{(e.date || '').split('T')[0]}</td>
                      <td><strong>{formatPkr(Number(e.amount) || 0)}</strong></td>
                      <td>{e.description || '—'}</td>
                      <td>{e.category_name || e.category?.name || '—'}</td>
                      <td>{e.notes || '—'}</td>
                      <td onClick={ev => ev.stopPropagation()}>
                        <textarea
                          className="client-comment-input"
                          value={comments[e.id] ?? (e.client_comment || '')}
                          onChange={ev => onCommentChange && onCommentChange(e.id, ev.target.value)}
                          placeholder="e.g. where money was spent..."
                          rows={2}
                        />
                      </td>
                      <td onClick={ev => ev.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                        <button type="button" className="small secondary" onClick={(ev) => { ev.stopPropagation(); setDetailExpense(e); }} title="View details">View</button>
                        {' '}
                        <button type="button" className="small" onClick={() => onSaveComment && onSaveComment(e.id)} disabled={savingId === e.id}>
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
        {detailExpense && (
          <ExpenseDetailModal
            expense={detailExpense}
            comments={comments}
            onClose={() => setDetailExpense(null)}
          />
        )}
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
          <div className="card-title">Expenses (click a row to view details)</div>
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
                    <tr
                      key={getExpenseId(e)}
                      className="expense-row-clickable"
                      onClick={() => setDetailExpense(e)}
                    >
                      <td>{(e.date || '').split('T')[0]}</td>
                      <td><strong>{formatPkr(Number(e.amount) || 0)}</strong></td>
                      <td>{e.description || '—'}</td>
                      <td>{e.category_name || e.category?.name || '—'}</td>
                      <td>{e.notes || '—'}</td>
                      <td onClick={ev => ev.stopPropagation()}>
                        <textarea
                          className="client-comment-input"
                          value={comments[e.id] ?? (e.client_comment || '')}
                          onChange={ev => onCommentChange && onCommentChange(e.id, ev.target.value)}
                          placeholder="e.g. where money was spent..."
                          rows={2}
                        />
                      </td>
                      <td onClick={ev => ev.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                        <button type="button" className="small secondary" onClick={(ev) => { ev.stopPropagation(); setDetailExpense(e); }} title="View details">View</button>
                        {' '}
                        <button type="button" className="small" onClick={() => onSaveComment && onSaveComment(e.id)} disabled={savingId === e.id}>
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
        {detailExpense && (
          <ExpenseDetailModal
            expense={detailExpense}
            comments={comments}
            onClose={() => setDetailExpense(null)}
          />
        )}
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
          <div className="card-title">Expenses (click a row to view details)</div>
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
                    <tr
                      key={getExpenseId(e)}
                      className="expense-row-clickable"
                      onClick={() => setDetailExpense(e)}
                    >
                      <td>{(e.date || '').split('T')[0]}</td>
                      <td><strong>{formatPkr(Number(e.amount) || 0)}</strong></td>
                      <td>{e.description || '—'}</td>
                      <td>{e.category_name || e.category?.name || '—'}</td>
                      <td>{e.notes || '—'}</td>
                      <td onClick={ev => ev.stopPropagation()}>
                        <textarea
                          className="client-comment-input"
                          value={comments[e.id] ?? (e.client_comment || '')}
                          onChange={ev => onCommentChange && onCommentChange(e.id, ev.target.value)}
                          placeholder="e.g. where money was spent..."
                          rows={2}
                        />
                      </td>
                      <td onClick={ev => ev.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                        <button type="button" className="small secondary" onClick={(ev) => { ev.stopPropagation(); setDetailExpense(e); }} title="View details">View</button>
                        {' '}
                        <button type="button" className="small" onClick={() => onSaveComment && onSaveComment(e.id)} disabled={savingId === e.id}>
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
        {detailExpense && (
          <ExpenseDetailModal
            expense={detailExpense}
            comments={comments}
            onClose={() => setDetailExpense(null)}
          />
        )}
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
                      <tr
                        key={getExpenseId(e)}
                        className="expense-row-clickable"
                        onClick={() => setDetailExpense(e)}
                      >
                        <td>{(e.date || '').split('T')[0]}</td>
                        <td><strong>{formatPkr(Number(e.amount) || 0)}</strong></td>
                        <td>{e.description || '—'}</td>
                        <td>{e.category_name || e.category?.name || '—'}</td>
                        <td>{e.notes || '—'}</td>
                        <td onClick={ev => ev.stopPropagation()}>
                          <textarea
                            className="client-comment-input"
                            value={comments[e.id] ?? (e.client_comment || '')}
                            onChange={ev => onCommentChange && onCommentChange(e.id, ev.target.value)}
                            placeholder="e.g. where money was spent..."
                            rows={2}
                          />
                        </td>
                        <td onClick={ev => ev.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                          <button type="button" className="small secondary" onClick={(ev) => { ev.stopPropagation(); setDetailExpense(e); }} title="View details">View</button>
                          {' '}
                          <button type="button" className="small" onClick={() => onSaveComment && onSaveComment(e.id)} disabled={savingId === e.id}>
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
        {detailExpense && (
          <ExpenseDetailModal
            expense={detailExpense}
            comments={comments}
            onClose={() => setDetailExpense(null)}
          />
        )}
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
