import React from 'react';
import { Link } from 'react-router-dom';

function PublicNavbar() {
  return (
    <nav className="navbar public-nav">
      <div className="navbar-brand">🏗️ Construction Cost Manager</div>
      <div className="navbar-links navbar-links-right">
        <Link to="/login" className="nav-login-link">Login (admin)</Link>
      </div>
    </nav>
  );
}

export default PublicNavbar;
