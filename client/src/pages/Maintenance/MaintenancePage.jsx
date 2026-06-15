import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Wrench } from 'lucide-react';
import api from '../../api/axiosInstance';
import Loader from '../../components/Loader/Loader';

const MaintenancePage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/api/settings');
        setSettings(response.data.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) return <Loader fullPage />;

  const contactNumbers = settings?.restaurantDetails?.contactNumber?.split(',').map(n => n.trim()) || [];
  const email = settings?.restaurantDetails?.email || '';
  const address = settings?.restaurantDetails?.address || '';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-background-card rounded-[2.5rem] p-8 md:p-10 text-center shadow-2xl border border-border/40 animate-in slide-in-from-bottom-10 fade-in duration-700">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Wrench size={48} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-3xl font-black text-text-primary tracking-tight mb-3">System Maintenance</h1>
        <p className="text-text-secondary mb-8">
          We are currently updating our system to serve you better. Our online ordering is temporarily paused, but we are still open and ready to take your orders!
        </p>

        <div className="bg-background-muted/50 rounded-3xl p-6 text-left border border-border/20">
          <p className="text-xs font-black text-primary uppercase tracking-widest mb-4">You can order through telephone</p>
          
          <div className="space-y-4">
            {contactNumbers.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Phone size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">Call Us</p>
                  <div className="flex flex-col gap-1 mt-1">
                    {contactNumbers.map((number, idx) => (
                      <a key={idx} href={`tel:${number}`} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                        {number}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {email && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Mail size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">Email</p>
                  <a href={`mailto:${email}`} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors mt-0.5 block">
                    {email}
                  </a>
                </div>
              </div>
            )}

            {address && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MapPin size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">Visit Us</p>
                  <p className="text-sm font-medium text-text-secondary mt-0.5">
                    {address}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-xs font-bold text-text-muted mt-8 uppercase tracking-widest">
          Thank you for your patience!
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;
