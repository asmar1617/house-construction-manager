import React from 'react';

function formatPkr(num) {
  return 'Rs.' + Number(num).toLocaleString('en-PK');
}

function FundsView({ funds = [] }) {
  const total = (funds || []).reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const sorted = [...(funds || [])].sort((a, b) => {
    const dA = a.date || '';
    const dB = b.date || '';
    return dB.localeCompare(dA);
  });

  return (
    <div className="spending-list-view spending-list-view--funds">
      <div className="summary-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="summary-card">
          <div className="label">Total funds added</div>
          <div className="value">{formatPkr(total)}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Fund entries</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No funds added yet.
                  </td>
                </tr>
              ) : (
                sorted.map((f) => (
                  <tr key={f.id}>
                    <td>{(f.date || '').split('T')[0]}</td>
                    <td><strong>{formatPkr(Number(f.amount) || 0)}</strong></td>
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

export default FundsView;
