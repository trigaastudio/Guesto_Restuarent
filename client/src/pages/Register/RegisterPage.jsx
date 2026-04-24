import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';
import InputField from '../../components/InputField/InputField';
import Button from '../../components/Button/Button';
import './RegisterPage.css';
import registerImg from '../../assets/register.png';
import logoImg from '../../assets/logo.png';

/* ── Icons ─────────────────────────────────────────── */
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 11.9 19.79 19.79 0 0 1 1.07 3.27 2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const RegisterPage = () => {
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreed: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  // Prevent accessing register if already authenticated
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFields((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!fields.name.trim()) newErrors.name = 'Full name is required';
    if (!fields.email.trim()) newErrors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(fields.email)) newErrors.email = 'Invalid email format';
    if (!fields.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!fields.password) newErrors.password = 'Password is required';
    else if (fields.password.length < 6) newErrors.password = 'Min 6 characters';
    if (fields.password !== fields.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!fields.agreed) newErrors.agreed = 'Required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const valErrors = validate();
    if (Object.keys(valErrors).length > 0) {
      setErrors(valErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', {
        name: fields.name,
        email: fields.email,
        phone: fields.phone,
        password: fields.password
      });

      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Account created successfully. Please login.',
          icon: 'success',
          confirmButtonColor: '#f59e0b',
        }).then(() => {
          navigate('/login', { replace: true });
        });
      }
    } catch (err) {
      console.error('Registration Error:', err);
      setApiError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-wrapper">
      <div className="register-container page-fade-in">
        <div className="register-left">
          <div className="hero-image-wrapper hero-fade-in">
            <img src={registerImg} alt="Register Hero" className="hero-img" />
          </div>
        </div>
        <div className="register-right">
          <div className="register-form-card">
            <div className="logo-container">
              <img src={logoImg} alt="GuestO Logo" className="brand-logo" />
            </div>
            <div className="form-header">
              <h1 className="form-title">Create Account</h1>
              <p className="form-subtitle">Begin your journey with GuestO</p>
            </div>

            {apiError && <div className="api-error-message">{apiError}</div>}

            <form onSubmit={handleSubmit} className="register-form">
              <InputField
                id="name"
                name="name"
                label="FULL NAME"
                placeholder="Alexander Dupont"
                value={fields.name}
                onChange={handleChange}
                icon={<UserIcon />}
                error={errors.name}
              />

              <InputField
                id="email"
                name="email"
                type="email"
                label="EMAIL ADDRESS"
                placeholder="alex@editorial.com"
                value={fields.email}
                onChange={handleChange}
                icon={<MailIcon />}
                error={errors.email}
              />

              <InputField
                id="phone"
                name="phone"
                type="tel"
                label="PHONE NUMBER"
                placeholder="+1 (555) 000-0000"
                value={fields.phone}
                onChange={handleChange}
                icon={<PhoneIcon />}
                error={errors.phone}
              />

              <div className="password-grid">
                <InputField
                  id="password"
                  name="password"
                  type="password"
                  label="PASSWORD"
                  placeholder="••••••••"
                  value={fields.password}
                  onChange={handleChange}
                  icon={<LockIcon />}
                  error={errors.password}
                />

                <InputField
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="CONFIRM PASSWORD"
                  placeholder="••••••••"
                  value={fields.confirmPassword}
                  onChange={handleChange}
                  icon={<LockIcon />}
                  error={errors.confirmPassword}
                />
              </div>

              <div className="terms-checkbox-group">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    name="agreed"
                    checked={fields.agreed}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label-text">
                    I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
                  </span>
                </label>
                {errors.agreed && <p className="error-message">{errors.agreed}</p>}
              </div>

              <Button type="submit" loading={loading} className="register-btn">
                Create Account
              </Button>
            </form>

            {success && (
              <div className="success-overlay">
                <div className="success-content">
                  <h2>Welcome aboard!</h2>
                  <p>Your account has been created successfully.</p>
                  <Button onClick={() => setSuccess(false)}>Dismiss</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
