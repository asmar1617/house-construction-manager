import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar sidebar">
      <div className="navbar-brand">🏗️ Construction Cost Manager</div>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
        <NavLink to="/expenses" className={({ isActive }) => isActive ? 'active' : ''}>Expenses</NavLink>
        <NavLink to="/categories" className={({ isActive }) => isActive ? 'active' : ''}>Categories</NavLink>
        <NavLink to="/funds" className={({ isActive }) => isActive ? 'active' : ''}>Funds</NavLink>
        <NavLink to="/export" className={({ isActive }) => isActive ? 'active' : ''}>Export</NavLink>
        <button type="button" className="secondary small" onClick={() => { logout(); navigate('/'); }}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
