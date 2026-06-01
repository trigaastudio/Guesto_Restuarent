import React from 'react';
import { Clock, Moon, Zap, AlertTriangle } from 'lucide-react';
import { useCart } from '../../context/CartContext';


const StoreStatusBanner = () => {
  const { settings, checkStoreStatus } = useCart();

  if (!settings) return null;

  const { operationalSettings } = settings;
  if (!operationalSettings) return null;

  const { isBusyMode, busyModeExtraTime, businessHours } = operationalSettings;
  const storeStatus = checkStoreStatus();

  
  if (storeStatus.isOpen && !isBusyMode) return null;

  let icon = <Clock size={16} className="text-white" />;
  let headline = "";
  let subtext = null;
  let bgClass = "bg-gray-900/90";

  if (!storeStatus.isOpen) {
    const isHoliday = storeStatus.reason === 'holiday';
    const isClosedDay = storeStatus.reason === 'closed_day';
    const isManual = storeStatus.reason === 'manual_close';

    if (isHoliday) {
      icon = <Moon size={16} className="text-white" />;
      headline = 'Closed for Holidays';
      bgClass = "bg-[#B91C1C]/90";
    } else if (isClosedDay) {
      icon = <AlertTriangle size={16} className="text-white" />;
      headline = "Closed Today";
    } else if (isManual) {
      icon = <AlertTriangle size={16} className="text-white" />;
      headline = 'Currently Closed';
    } else {
      headline = "We're Closed";
      subtext = storeStatus.reason;
    }
  } else if (isBusyMode) {
    icon = <Zap size={16} className="text-white animate-pulse" />;
    headline = "High Demand";
    subtext = `${busyModeExtraTime || 15}m extra wait`;
    bgClass = "bg-amber-500/90";
  }

  return (
    <div className="fixed top-20 right-4 z-[150] pointer-events-none select-none animate-in fade-in slide-in-from-right duration-500">
      <div className={`${bgClass} backdrop-blur-md border border-white/10 shadow-2xl p-3 rounded-2xl flex items-center gap-3 max-w-[200px]`}>
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">
            {headline}
          </p>
          {subtext && (
            <p className="text-[9px] text-white/70 font-bold mt-0.5">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreStatusBanner;
