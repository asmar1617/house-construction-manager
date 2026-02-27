import React from 'react';
import Navbar from '../components/Navbar';

const api = process.env.REACT_APP_API_URL || '/api';

function Export() {
  const handleExport = () => {
    window.open(api + '/export/expenses/', '_blank');
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <div className="page-header">
          <h1>Export</h1>
          <p>Download expenses as CSV</p>
        </div>

        <div className="card" style={{ maxWidth: '400px' }}>
          <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)' }}>
            Download all expenses in a spreadsheet-friendly format.
          </p>
          <button onClick={handleExport}>Download CSV</button>
        </div>
      </main>
    </div>
  );
}

export default Export;
