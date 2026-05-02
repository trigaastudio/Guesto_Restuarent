import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Users, MapPin, Home, Briefcase } from 'lucide-react';

const AddressModal = ({ isOpen, onClose, onSave, user, editData }) => {
  const [recipientType, setRecipientType] = useState('myself'); // 'myself' or 'others'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    location: '',
    type: 'home'
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        phone: '',
        address: '',
        location: '',
        type: 'home'
      });
      setRecipientType('myself');
      return;
    }

    if (editData) {
      setFormData({
        name: editData.name || '',
        phone: editData.phone || '',
        address: editData.address || '',
        location: editData.location || '',
        type: editData.type || 'home',
        _id: editData._id
      });
      setRecipientType(editData.name === user.name ? 'myself' : 'others');
    } else {
      if (recipientType === 'myself' && user) {
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          phone: user.phone || ''
        }));
      } else if (recipientType === 'others') {
        setFormData(prev => ({
          ...prev,
          name: '',
          phone: ''
        }));
      }
    }
  }, [recipientType, user, isOpen, editData]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#FAF9F6] w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#D10000]/10 flex justify-between items-center bg-[#D10000]">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">{editData ? 'Edit Address' : 'Add Delivery Address'}</h3>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">{editData ? 'Updating your delivery details' : 'Where should we drop the magic?'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 text-white rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Recipient Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-2xl">
            <button
              onClick={() => setRecipientType('myself')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${recipientType === 'myself' ? 'bg-white text-[#D10000] shadow-sm' : 'text-gray-400'}`}
            >
              <UserIcon size={14} /> Myself
            </button>
            <button
              onClick={() => setRecipientType('others')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${recipientType === 'others' ? 'bg-white text-[#D10000] shadow-sm' : 'text-gray-400'}`}
            >
              <Users size={14} /> Others
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={recipientType === 'myself'}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                placeholder="Enter name"
              />
            </div>
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Mobile Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                placeholder="Enter mobile number"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Detailed Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] resize-none"
              placeholder="Flat/House No., Building, Apartment"
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Landmark / Location</label>
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    const btn = document.getElementById('locate-me-btn');
                    btn.classList.add('animate-pulse');
                    btn.innerText = 'Sending...';

                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const { latitude, longitude } = position.coords;
                        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                        setFormData({
                          ...formData,
                          location: `📍 Precise Location: ${mapsUrl}`
                        });
                        btn.classList.remove('animate-pulse');
                        btn.innerText = 'Sent! ✅';
                        setTimeout(() => btn.innerText = 'Send Location', 2000);
                      },
                      (error) => {
                        console.error(error);
                        btn.classList.remove('animate-pulse');
                        btn.innerText = 'Error! ❌';
                        setTimeout(() => btn.innerText = 'Send Location', 2000);
                      }
                    );
                  }
                }}
                id="locate-me-btn"
                className="text-[9px] font-black text-[#D10000] uppercase tracking-widest bg-[#D10000]/5 px-2 py-1 rounded-lg hover:bg-[#D10000] hover:text-white transition-all flex items-center gap-1 shadow-sm"
              >
                Send Location
              </button>
            </div>
            <div className="relative">
              <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D10000]" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#D10000]/20 transition-all"
                placeholder="Google Maps Link or Landmark"
              />
            </div>
          </div>

          {/* Address Type */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Save As</label>
            <div className="flex gap-3">
              {[
                { id: 'home', label: 'Home', icon: <Home size={14} /> },
                { id: 'office', label: 'Office', icon: <Briefcase size={14} /> }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData({ ...formData, type: type.id })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${formData.type === type.id ? 'bg-[#D10000]/5 border-[#D10000] text-[#D10000]' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => onSave(formData)}
            className="w-full bg-[#DA9133] text-white font-black py-4 rounded-2xl hover:bg-[#C27D29] transition-all shadow-[0_15px_40px_rgba(0,0,0,0.1)] active:scale-[0.98] uppercase tracking-widest text-sm"
          >
            Save Address & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
