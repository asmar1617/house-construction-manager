import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">🏗️ Project Manager</div>
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        <Link to="/expenses">Expenses</Link>
        <Link to="/categories">Categories</Link>
        <Link to="/funds">Funds</Link>
        <Link to="/export">Export</Link>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar; 