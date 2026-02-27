import React, { useEffect, useState } from 'react';
import ClientNavbar from '../components/ClientNavbar';
import useAuth from '../hooks/useAuth';
import { TOKEN_KEY } from '../hooks/useAuth';

const api = process.env.REACT_APP_API_URL || '/api';

function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function ClientExpenses() {
  const { token, user, isAdmin } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (token && !isAdmin) fetchExpenses();
  }, [token, isAdmin]);

  const fetchExpenses = async () => {
    setLoading(true);
    const res = await fetch(api + '/expenses/', { headers: getAuthHeaders() });
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
    const initial = {};
    (Array.isArray(data) ? data : []).forEach(e => {
      initial[e.id] = e.client_comment || '';
    });
    setComments(initial);
    setLoading(false);
  };

  const handleCommentChange = (expenseId, value) => {
    setComments(prev => ({ ...prev, [expenseId]: value }));
  };

  const saveComment = async (expenseId) => {
    setSavingId(expenseId);
    const res = await fetch(`${api}/expenses/${expenseId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ client_comment: comments[expenseId] || '' }),
    });
    setSavingId(null);
    if (res.ok) fetchExpenses();
  };

  const id = e => e.id != null ? e.id : e._id;

  return (
    <div className="app-layout">
      <ClientNavbar />
      <main className="app-main">
        <div className="page-header">
          <h1>Expenses</h1>
          <p>View expenses and add your comment (e.g. where the money was spent)</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.9 }}>
            Logged in as <strong>{user?.username}</strong> (client view)
          </p>
        </div>

        {loading ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>
        ) : (
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
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No expenses to show.
                    </td>
                  </tr>
                ) : (
                  expenses.map(e => (
                    <tr key={id(e)}>
                      <td>{(e.date || '').split('T')[0]}</td>
                      <td><strong>Rs.{Number(e.amount).toLocaleString('en-PK')}</strong></td>
                      <td>{e.description}</td>
                      <td>{e.category_name || e.category?.name || '—'}</td>
                      <td>{e.notes || '—'}</td>
                      <td>
                        <textarea
                          className="client-comment-input"
                          value={comments[e.id] ?? (e.client_comment || '')}
                          onChange={ev => handleCommentChange(e.id, ev.target.value)}
                          placeholder="e.g. where money was spent..."
                          rows={2}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="small"
                          onClick={() => saveComment(e.id)}
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
        )}
      </main>
    </div>
  );
}

export default ClientExpenses;
