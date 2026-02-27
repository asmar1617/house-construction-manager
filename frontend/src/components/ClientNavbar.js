import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function ClientNavbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/client/login');
  };

  return (
    <nav className="navbar sidebar">
      <div className="navbar-brand">🏗️ Construction Cost Manager — Client</div>
      <div className="navbar-links">
        <button type="button" className="secondary small" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default ClientNavbar;
