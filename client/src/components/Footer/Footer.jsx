import React from 'react';
import './Footer.css';

const Footer = React.memo(() => {
  return (
    <footer className="relative bg-[#D10000] text-white pt-6 md:pt-8 pb-4 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10"></div>
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#DA9133]/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mb-8 md:mb-12 text-center sm:text-left">
          {/* Brand Identity */}
          <div className="space-y-4 lg:col-span-2 flex flex-col items-center sm:items-start">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <img src="/logo-light.png" alt="GuestO" className="h-8 md:h-10 w-auto object-contain drop-shadow-xl" />
              <div className="flex items-center gap-4">
                {[
                  { img: '/instagram.png', link: '#' },
                  { img: '/facebook.png', link: '#' }
                ].map((social, i) => (
                  <a key={i} href={social.link} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#DA9133] transition-all duration-300 border border-white/10 group">
                    <img 
                      src={social.img} 
                      alt="Social" 
                      className="w-4 h-4 group-hover:scale-110 transition-transform object-contain" 
                    />
                  </a>
                ))}
              </div>
            </div>
            <p className="text-white/70 text-[10px] font-bold leading-relaxed tracking-wide max-w-md">
              Authentic flavors of Thrissur. Premium quality meals, locally sourced and prepared with passion.
            </p>
          </div>



          {/* Contact Details */}
          <div className="space-y-4 flex flex-col items-center sm:items-start">
            <h4 className="text-[9px] font-black tracking-[0.2em] text-[#DA9133] uppercase">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <span className="text-[12px] opacity-60">📍</span>
                <p className="text-[11px] font-black text-white/80">Thrissur City, Kerala</p>
              </div>
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <span className="text-[12px] opacity-60">📞</span>
                <p className="text-[11px] font-black text-white/80">+91 98765 43210</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 flex flex-col items-center sm:items-start">
            <h4 className="text-[9px] font-black tracking-[0.2em] text-[#DA9133] uppercase">Motto</h4>
            <p className="text-[11px] font-black text-white/60 italic leading-relaxed max-w-[200px]">
              "We serve memories of home, crafted with the finest ingredients."
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[8px] font-black text-white/30 tracking-widest">
            © 2026 GuestO Restaurant Group.
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms'].map((link) => (
              <a key={link} href="#" className="text-[8px] font-black text-white/30 hover:text-[#DA9133] transition-colors tracking-widest">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
