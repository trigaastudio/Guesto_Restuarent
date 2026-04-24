import React, { useEffect } from 'react';
import './HomePage.css';
import logoImg from '../../assets/logo.png';

const HomePage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Guard: if token is gone mid-session, redirect immediately
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.replace('/login');
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    // Hard redirect — clears /home from browser history so back button cannot return
    window.location.replace('/login');
  };

  return (
    <div className="home-container">
      <nav className="home-nav">
        <div className="nav-brand">
          <img src={logoImg} alt="Logo" className="nav-logo" />
          <span>GuestO Dashboard</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </nav>

      <main className="home-content">
        <div className="welcome-card">
          <h1>Hello, {user.name || 'Guest'}! 👋</h1>
          <p>You have successfully logged in to the Guest-O platform.</p>
          <div className="user-details">
            <p><strong>Email</strong>{user.email}</p>
            <p><strong>Role</strong>{user.role}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
