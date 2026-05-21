import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

// Lazy load components
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const RegisterPage = lazy(() => import('./pages/Register/RegisterPage'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const HomePage = lazy(() => import('./pages/Home/HomePage'));
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const CartPage = lazy(() => import('./pages/Cart/CartPage'));
const PaymentPage = lazy(() => import('./pages/Payment/PaymentPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/Orders/OrdersPage'));
const TrackOrderPage = lazy(() => import('./pages/Orders/TrackOrderPage'));
const MenuDetailPage = lazy(() => import('./pages/Menu/MenuDetailPage'));
const StaffLogin = lazy(() => import('./pages/Staff/StaffLogin'));
const KitchenDashboard = lazy(() => import('./pages/Kitchen/KitchenDashboard'));
const WaiterDashboard = lazy(() => import('./pages/Waiter/WaiterDashboard'));
const AboutPage = lazy(() => import('./pages/About/AboutPage'));
const DigitalMenu = lazy(() => import('./pages/Menu/DigitalMenu'));

import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import BottomNavbar from './components/Navbar/BottomNavbar';

import Loader from './components/Loader/Loader';
import GlobalSocketListener from './components/GlobalSocketListener/GlobalSocketListener';

const PageLoader = () => (
  <Loader fullPage={true} />
);

function App() {
  return (
    <GoogleOAuthProvider clientId="791498024436-f3oa2eu8g31hpkieajgi2ma3vndvp0bc.apps.googleusercontent.com">
      <ThemeProvider>
        <CartProvider>
          <BrowserRouter>
            <GlobalSocketListener />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                {/* Staff Routes */}
                <Route path="/staff/login" element={<StaffLogin />} />
                <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
                <Route path="/waiter/dashboard" element={<WaiterDashboard />} />

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
                <Route path="/about" element={<AboutPage />} />
                <Route path="/digital-menu" element={<DigitalMenu />} />
              </Routes>
            </Suspense>
            <BottomNavbar />
          </BrowserRouter>
        </CartProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
