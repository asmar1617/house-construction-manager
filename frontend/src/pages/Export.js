import React from 'react';
import Navbar from '../components/Navbar';

function Export() {
  const handleExport = () => {
    const token = localStorage.getItem('token');
    window.open(process.env.REACT_APP_API_URL + '/export/expenses?token=' + token, '_blank');
  };

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <h1>Export Expenses</h1>
        <button onClick={handleExport}>Download CSV</button>
      </div>
    </div>
  );
}

export default Export; 