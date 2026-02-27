import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

const api = process.env.REACT_APP_API_URL || '/api';

function Funds() {
  const [funds, setFunds] = useState([]);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchFunds(); }, []);

  const fetchFunds = async () => {
    const res = await fetch(api + '/budget/funds/');
    const data = await res.json();
    setFunds(Array.isArray(data) ? data : []);
  };

  const handleAdd = async e => {
    e.preventDefault();
    setError('');
    const res = await fetch(api + '/budget/funds/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount) })
    });
    const data = await res.json();
    if (!res.ok) { setError(data.detail || 'Failed to add funds'); return; }
    setAmount('');
    fetchFunds();
  };

  const handleDelete = async (id, amountDisplay) => {
    if (!window.confirm(`Remove this fund entry (Rs.${Number(amountDisplay).toLocaleString('en-PK')})? This cannot be undone.`)) return;
    setError('');
    const res = await fetch(`${api}/budget/funds/${id}/`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || 'Failed to delete');
      return;
    }
    fetchFunds();
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <div className="page-header">
          <h1>Funds</h1>
          <p>Add and view fund entries</p>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleAdd} className="form-row">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount (Rs.)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
            <button type="submit">Add funds</button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount (Rs.)</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {funds.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No fund entries yet</td></tr>
              ) : (
                funds.map(f => (
                  <tr key={f.id}>
                    <td>{f.date ? new Date(f.date).toLocaleDateString() : '—'}</td>
                    <td><strong>Rs.{Number(f.amount).toLocaleString('en-PK')}</strong></td>
                    <td>
                      <button type="button" className="danger small" onClick={() => handleDelete(f.id, f.amount)} title="Remove this entry (e.g. wrong amount)">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default Funds;
