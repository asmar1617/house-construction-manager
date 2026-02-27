import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import SpendingLogButtons from '../components/SpendingLogButtons';
import SpendingListView from '../components/SpendingListView';
import FundsView from '../components/FundsView';

const VALID_VIEWS = ['dashboard', 'today', 'weekly', 'overall', 'categories', 'funds'];

const api = process.env.REACT_APP_API_URL || '/api';

function formatPkr(num) {
  return 'Rs.' + Number(num).toLocaleString('en-PK');
}

/** Local date YYYY-MM-DD so "today" is always inside "this week" (today's spend <= weekly spend). */
function getTodayKey() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

function getTodaySpend(expenses) {
  const todayKey = getTodayKey();
  return (expenses || []).reduce((sum, e) => {
    const dateKey = (e.date || '').split('T')[0];
    return dateKey === todayKey ? sum + (Number(e.amount) || 0) : sum;
  }, 0);
}

function getWeeklySpend(expenses) {
  const thisWeekStart = getWeekStart(getTodayKey());
  return (expenses || []).reduce((sum, e) => {
    const dateKey = (e.date || '').split('T')[0];
    if (!dateKey) return sum;
    return getWeekStart(dateKey) === thisWeekStart ? sum + (Number(e.amount) || 0) : sum;
  }, 0);
}

function PublicDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewFromUrl = searchParams.get('view');
  const [view, setViewState] = useState(() =>
    VALID_VIEWS.includes(viewFromUrl) ? viewFromUrl : 'dashboard'
  );

  const setView = (nextView) => {
    setViewState(nextView);
    if (nextView === 'dashboard') {
      searchParams.delete('view');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ view: nextView }, { replace: true });
    }
  };

  useEffect(() => {
    if (VALID_VIEWS.includes(viewFromUrl) && viewFromUrl !== view) {
      setViewState(viewFromUrl);
    }
  }, [viewFromUrl]);

  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [comments, setComments] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  useEffect(() => {
    fetch(api + '/categories/')
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    fetch(api + '/budget/summary/')
      .then(res => res.json())
      .then(data => { setSummary(data); setLoadingSummary(false); })
      .catch(() => setLoadingSummary(false));
  }, []);

  useEffect(() => {
    fetch(api + '/expenses/')
      .then(res => res.json())
      .then(data => {
        setExpenses(Array.isArray(data) ? data : []);
        const initial = {};
        (Array.isArray(data) ? data : []).forEach(e => {
          initial[e.id] = e.client_comment || '';
        });
        setComments(initial);
        setLoadingExpenses(false);
      })
      .catch(() => setLoadingExpenses(false));
  }, []);

  const handleCommentChange = (expenseId, value) => {
    setComments(prev => ({ ...prev, [expenseId]: value }));
  };

  const saveComment = async (expenseId) => {
    setSavingId(expenseId);
    const res = await fetch(`${api}/expenses/${expenseId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_comment: comments[expenseId] || '' }),
    });
    setSavingId(null);
    if (res.ok) {
      const data = await res.json();
      setComments(prev => ({ ...prev, [expenseId]: data.client_comment || '' }));
    }
  };

  const id = e => e.id != null ? e.id : e._id;
  const loading = loadingSummary || loadingExpenses;

  return (
    <div className="app-layout">
      <PublicNavbar />
      <main className="app-main app-main--header-left">
        <div className="page-header-col">
          <div className="spending-log-buttons-panel">
            <SpendingLogButtons currentView={view} onSelectView={setView} />
          </div>
        </div>
        <div className="main-content-col">
        {view === 'funds' ? (
          <FundsView funds={funds} />
        ) : view !== 'dashboard' ? (
          <SpendingListView
            viewType={view}
            expenses={expenses}
            categories={categories}
            comments={comments}
            onCommentChange={handleCommentChange}
            onSaveComment={saveComment}
            savingId={savingId}
            getExpenseId={id}
          />
        ) : loadingSummary ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>Loading summary…</div>
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
              <div className="summary-card">
                <div className="label">Today&apos;s spend</div>
                <div className="value">{formatPkr(getTodaySpend(expenses))}</div>
              </div>
              <div className="summary-card">
                <div className="label">Weekly spend</div>
                <div className="value">{formatPkr(getWeeklySpend(expenses))}</div>
              </div>
            </div>

            {summary.category_totals && Object.keys(summary.category_totals).length > 0 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
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
          <div className="card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            Could not load summary.
          </div>
        )}

        </div>
      </main>
    </div>
  );
}

export default PublicDashboard;
