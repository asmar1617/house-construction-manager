import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

function Funds() {
  const [funds, setFunds] = useState([]);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchFunds(); }, []);
  const fetchFunds = async () => {
    const res = await fetch(process.env.REACT_APP_API_URL + '/budget/all', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
    const data = await res.json();
    setFunds(data);
  };

  const handleAdd = async e => {
    e.preventDefault();
    setError('');
    const res = await fetch(process.env.REACT_APP_API_URL + '/budget/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
      body: JSON.stringify({ amount })
    });
    if (!res.ok) { setError('Failed to add funds'); return; }
    setAmount('');
    fetchFunds();
  };

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <h1>Funds</h1>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="number" placeholder="Add funds (₹)" value={amount} onChange={e => setAmount(e.target.value)} required />
          <button type="submit">Add</button>
        </form>
        <table style={{ width: '100%', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
          <thead><tr><th>Date</th><th>Amount</th></tr></thead>
          <tbody>
            {funds.map(f => (
              <tr key={f._id}>
                <td>{f.date ? f.date.split('T')[0] : ''}</td>
                <td>₹{Number(f.amount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}

export default Funds; 