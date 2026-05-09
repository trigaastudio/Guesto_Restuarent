import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import RegisterPage from './pages/Register/RegisterPage';
import LoginPage from './pages/Login/LoginPage';
import HomePage from './pages/Home/HomePage';
import LandingPage from './pages/Landing/LandingPage';
import CartPage from './pages/Cart/CartPage';
import PaymentPage from './pages/Payment/PaymentPage';
import ProfilePage from './pages/Profile/ProfilePage';
import ReturnsRefundsPage from './pages/Profile/ReturnsRefundsPage';
import OrdersPage from './pages/Orders/OrdersPage';
import TrackOrderPage from './pages/Orders/TrackOrderPage';
import MenuDetailPage from './pages/Menu/MenuDetailPage';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import BottomNavbar from './components/Navbar/BottomNavbar';
import './index.css';

function App() {
  return (
    <GoogleOAuthProvider clientId="791498024436-f3oa2eu8g31hpkieajgi2ma3vndvp0bc.apps.googleusercontent.com">
      <ThemeProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* General Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected User Routes */}
              <Route path="/home" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              } />
              <Route path="/payment" element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/returns-refunds" element={
                <ProtectedRoute>
                  <ReturnsRefundsPage />
                </ProtectedRoute>
              } />
              <Route path="/my-orders" element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              } />
              <Route path="/track-order/:orderId" element={
                <ProtectedRoute>
                  <TrackOrderPage />
                </ProtectedRoute>
              } />
              <Route path="/menu/:id" element={
                <ProtectedRoute>
                  <MenuDetailPage />
                </ProtectedRoute>
              } />
            </Routes>
            <BottomNavbar />
          </BrowserRouter>
        </CartProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

