import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosInstance';
import Loader from '../Loader/Loader';

const MaintenanceGuard = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await api.get('/api/settings');
        const settings = response.data.data;
        if (settings?.operationalSettings?.isMaintenanceMode) {
          setIsMaintenanceMode(true);
        }
      } catch (error) {
        console.error('Error fetching maintenance status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkMaintenanceStatus();
  }, [location.pathname]);

  if (loading) {
    return <Loader fullPage />;
  }

  if (isMaintenanceMode) {
    return <Navigate to="/maintenance" replace />;
  }

  return children;
};

export default MaintenanceGuard;
