import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });

const AdminLogin = lazyWithRetry(() => import('./pages/Admin/AdminLogin'));
const AdminDashboard = lazyWithRetry(() => import('./pages/Admin/AdminDashboard'));
const RegisterPage = lazyWithRetry(() => import('./pages/Register/RegisterPage'));
const LoginPage = lazyWithRetry(() => import('./pages/Login/LoginPage'));
const HomePage = lazyWithRetry(() => import('./pages/Home/HomePage'));
const LandingPage = lazyWithRetry(() => import('./pages/Landing/LandingPage'));
const CartPage = lazyWithRetry(() => import('./pages/Cart/CartPage'));
const PaymentPage = lazyWithRetry(() => import('./pages/Payment/PaymentPage'));
const ProfilePage = lazyWithRetry(() => import('./pages/Profile/ProfilePage'));
const OrdersPage = lazyWithRetry(() => import('./pages/Orders/OrdersPage'));
const TrackOrderPage = lazyWithRetry(() => import('./pages/Orders/TrackOrderPage'));
const MenuDetailPage = lazyWithRetry(() => import('./pages/Menu/MenuDetailPage'));
const StaffLogin = lazyWithRetry(() => import('./pages/Staff/StaffLogin'));
const KitchenDashboard = lazyWithRetry(() => import('./pages/Kitchen/KitchenDashboard'));
const WaiterDashboard = lazyWithRetry(() => import('./pages/Waiter/WaiterDashboard'));
const AboutPage = lazyWithRetry(() => import('./pages/About/AboutPage'));
const DigitalMenu = lazyWithRetry(() => import('./pages/Menu/DigitalMenu'));
const ErrorPage = lazyWithRetry(() => import('./pages/Error/ErrorPage'));
const PrivacyPage = lazyWithRetry(() => import('./pages/Legal/PrivacyPage'));
const TermsPage = lazyWithRetry(() => import('./pages/Legal/TermsPage'));
const CookiesPage = lazyWithRetry(() => import('./pages/Legal/CookiesPage'));
const MaintenancePage = lazyWithRetry(() => import('./pages/Maintenance/MaintenancePage'));

import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import MaintenanceGuard from './components/ProtectedRoute/MaintenanceGuard';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import BottomNavbar from './components/Navbar/BottomNavbar';
import FloatingCart from './components/Cart/FloatingCart';

import Loader from './components/Loader/Loader';
import GlobalSocketListener from './components/GlobalSocketListener/GlobalSocketListener';

const PageLoader = () => (
  <Loader fullPage={true} />
);

function App() {
  React.useEffect(() => {
    const refreshTimer = setInterval(() => {
      window.location.reload();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(refreshTimer);
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id_for_dev'}>
      <ThemeProvider>
        <CartProvider>
          <BrowserRouter>
            <GlobalSocketListener />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />

                  {}
                  <Route path="/staff/login" element={<StaffLogin />} />
                  <Route path="/kitchen/dashboard" element={
                    <ProtectedRoute allowedRoles={['kitchen']}>
                      <KitchenDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/waiter/dashboard" element={
                    <ProtectedRoute allowedRoles={['waiter']}>
                      <WaiterDashboard />
                    </ProtectedRoute>
                  } />

                  {}
                  <Route path="/" element={<MaintenanceGuard><LandingPage /></MaintenanceGuard>} />
                  <Route path="/register" element={<MaintenanceGuard><RegisterPage /></MaintenanceGuard>} />
                  <Route path="/login" element={<MaintenanceGuard><LoginPage /></MaintenanceGuard>} />
                  <Route path="/error" element={<ErrorPage />} />
                  <Route path="/maintenance" element={<MaintenancePage />} />

                  {}
                  <Route path="/home" element={
                    <ProtectedRoute>
                      <MaintenanceGuard><HomePage /></MaintenanceGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="/cart" element={
                    <ProtectedRoute>
                      <MaintenanceGuard><CartPage /></MaintenanceGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="/payment" element={
                    <ProtectedRoute>
                      <MaintenanceGuard><PaymentPage /></MaintenanceGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <MaintenanceGuard><ProfilePage /></MaintenanceGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="/my-orders" element={
                    <ProtectedRoute>
                      <MaintenanceGuard><OrdersPage /></MaintenanceGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="/track-order/:orderId" element={
                    <ProtectedRoute>
                      <MaintenanceGuard><TrackOrderPage /></MaintenanceGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="/menu/:id" element={
                    <ProtectedRoute>
                      <MaintenanceGuard><MenuDetailPage /></MaintenanceGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="/about" element={<MaintenanceGuard><AboutPage /></MaintenanceGuard>} />
                  <Route path="/digital-menu" element={<MaintenanceGuard><DigitalMenu /></MaintenanceGuard>} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/cookies" element={<CookiesPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
            <FloatingCart />
            <BottomNavbar />
          </BrowserRouter>
        </CartProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
