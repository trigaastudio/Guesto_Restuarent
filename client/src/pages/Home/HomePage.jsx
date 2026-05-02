import React, { useEffect } from 'react';
import './HomePage.css';
import { useTheme } from '../../context/ThemeContext';

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const HomePage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { theme, toggleTheme } = useTheme();


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.replace('/login');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.location.replace('/login');
  };

  const logoSrc = theme === 'dark' ? "/logo-golden.png" : "/logo-dark.png";

  return (
    <div className="home-container">
      <nav className="home-nav">
        <div className="nav-brand">
          <img src={logoSrc} alt="Logo" className="nav-logo" />
          <span>GuestO Dashboard</span>
        </div>
        <div className="nav-actions">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
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
