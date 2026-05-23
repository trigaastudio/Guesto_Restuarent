import React, { useEffect, useState, useRef } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Share2, Globe } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../utils/sweetAlert';
import Loader from '../../components/Loader/Loader';
import { logoutToLanding } from '../../utils/auth';

const ContactPage = () => {
  const { settings, cartItems } = useCart();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('staff_user') || localStorage.getItem('admin_user') || 'null');
  
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "GuestO | Contact Us";
    window.scrollTo(0, 0);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutToLanding(navigate);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      showToast('success', 'Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  const contactInfo = [
    {
      title: 'Our Location',
      value: settings?.restaurantDetails?.address || 'Chammannur, Athirthi',
      icon: MapPin,
      color: 'bg-white/10 text-white'
    },
    {
      title: 'Phone Number',
      value: settings?.restaurantDetails?.contactNumber || '7034805085, 9947649007',
      icon: Phone,
      color: 'bg-white/10 text-white'
    },
    {
      title: 'Email Address',
      value: settings?.restaurantDetails?.email || 'restaurantguesto@gmail.com',
      icon: Mail,
      color: 'bg-white/10 text-white'
    },
    {
      title: 'Business Hours',
      value: '11:00 AM - 11:00 PM',
      icon: Clock,
      color: 'bg-white/10 text-white'
    }
  ];

  return (
    <div className={`min-h-screen bg-background ${theme}`}>
      {/* Header with Brand Red Theme */}
      <div className="relative w-full overflow-hidden flex flex-col bg-[#B91C1C]">
        <div className="absolute inset-0 z-0 bg-[#B91C1C]"></div>
        
        <Navbar
          user={user}
          cartItems={cartItems}
          showUserDropdown={showUserDropdown}
          setShowUserDropdown={setShowUserDropdown}
          handleLogout={handleLogout}
          navigate={navigate}
          dropdownRef={dropdownRef}
        />

        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10 text-white">
          <div className="text-center max-w-3xl mx-auto space-y-6 mb-12 animate-in fade-in slide-in-from-top-8 duration-700">
            <div className="flex items-center justify-center gap-3">
              <div className="h-1 w-12 bg-white/50 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Get in Touch</span>
              <div className="h-1 w-12 bg-white/50 rounded-full"></div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
               Let's Start a <br /><span className="text-primary-light">Conversation</span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed font-medium">
              Have a question, feedback, or just want to say hi? We'd love to hear from you. Reach out to us through any of the channels below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
             {contactInfo.map((info, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                   <div className={`w-12 h-12 rounded-2xl ${info.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <info.icon size={22} />
                   </div>
                   <h3 className="text-sm font-black uppercase tracking-widest mb-2 opacity-60">{info.title}</h3>
                   <p className="text-[11px] font-bold leading-relaxed">{info.value}</p>
                </div>
             ))}
          </div>
        </div>
      </div>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Branding/Support Card */}
            <div className="lg:col-span-5 space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="bg-primary rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl h-full flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 space-y-8">
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <MessageCircle size={32} />
                    </div>
                    <h3 className="text-3xl font-black tracking-tight leading-tight">We're here to <br />Help You.</h3>
                  </div>
                  <p className="text-white/80 text-lg font-medium leading-relaxed">
                    Need immediate assistance with an order or reservation? Our team is available 11 AM to 11 PM to ensure your experience is nothing short of perfect.
                  </p>
                  <div className="space-y-4 pt-4">
                     <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all">
                           <Phone size={18} />
                        </div>
                        <span className="font-bold tracking-wider">Quick Call Support</span>
                     </div>
                     <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all">
                           <Globe size={18} />
                        </div>
                        <span className="font-bold tracking-wider">Online Reservations</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7 animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="bg-background-card p-8 md:p-12 rounded-[3rem] border border-border/50 shadow-2xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] translate-y-1/2 translate-x-1/2"></div>
                
                <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Your Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="John Doe" 
                        className="w-full px-6 py-4 rounded-2xl bg-background-muted/50 border border-transparent focus:border-primary/50 focus:bg-background-card transition-all outline-none font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Email Address</label>
                      <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="john@example.com" 
                        className="w-full px-6 py-4 rounded-2xl bg-background-muted/50 border border-transparent focus:border-primary/50 focus:bg-background-card transition-all outline-none font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Subject</label>
                    <input 
                      required
                      type="text" 
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="How can we help you?" 
                      className="w-full px-6 py-4 rounded-2xl bg-background-muted/50 border border-transparent focus:border-primary/50 focus:bg-background-card transition-all outline-none font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Your Message</label>
                    <textarea 
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Write your message here..." 
                      className="w-full px-6 py-4 rounded-2xl bg-background-muted/50 border border-transparent focus:border-primary/50 focus:bg-background-card transition-all outline-none font-bold text-sm resize-none"
                    ></textarea>
                  </div>

                  <button 
                    disabled={isSubmitting}
                    type="submit" 
                    className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-primary-dark transition-all active:scale-[0.98] shadow-xl shadow-primary/20 flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    {isSubmitting ? (
                       <Loader size="small" className="border-white/30 text-white" />
                    ) : (
                      <>
                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
