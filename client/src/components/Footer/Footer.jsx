import React from 'react';
import './Footer.css';

const Footer = React.memo(() => {
  return (
    <footer className="footer-container">
      <div className="footer-content grid-cols">
        {/* Brand Info */}
        <div className="brand-section">
          <img src="/logo-light.png" alt="GuestO" className="footer-logo" />
          <p className="brand-description">
            Bringing the authentic flavors of Thrissur to your home. Restaurant-quality meals, locally sourced.
          </p>
          <div className="social-links">
            {[
              { img: '/instagram.png', link: '#' },
              { img: '/facebook.png', link: '#' }
            ].map((social, i) => (
              <a key={i} href={social.link} className="social-link-item">
                <img src={social.img} alt="Social" className="social-icon" />
              </a>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="contact-section">
          <h4 className="footer-heading">Get In Touch</h4>
          <div className="contact-details">
            <p className="contact-item">
              <span className="icon-wrapper">📍</span> Thrissur, Kerala
            </p>
            <p className="contact-item">
              <span className="icon-wrapper">📞</span> +91 98765 43210
            </p>
            <p className="contact-item">
              <span className="icon-wrapper">✉️</span> hello@guesto.in
            </p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="copyright">© 2026 GuestO Restaurant Group. All Rights Reserved.</p>
        <div className="footer-links">
          <a href="#" className="footer-link">Privacy</a>
          <a href="#" className="footer-link">Terms</a>
          <a href="#" className="footer-link">Cookies</a>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
