import React from 'react';
import './Footer.css';

const Footer = React.memo(() => {
  return (
    <footer className="relative bg-[#D10000] text-white pt-8 md:pt-10 pb-6 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10"></div>
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#DA9133]/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-10">
          {/* Brand Identity */}
          <div className="space-y-4">
            <img src="/logo-light.png" alt="GuestO" className="h-8 md:h-10 drop-shadow-xl" />
            <p className="text-white/70 text-[11px] font-bold leading-relaxed tracking-wide max-w-xs">
              Authentic flavors of Thrissur. Premium quality meals, locally sourced and prepared with passion.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {[
                { img: '/instagram.png', link: '#' },
                { img: '/facebook.png', link: '#' }
              ].map((social, i) => (
                <a key={i} href={social.link} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-[#DA9133] transition-all duration-300 border border-white/10 group">
                  <img 
                    src={social.img} 
                    alt="Social" 
                    className="w-6 h-6 group-hover:scale-110 transition-transform object-contain" 
                  />
                </a>
              ))}
            </div>
          </div>



          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-[#DA9133]">Get in touch</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-[10px]">📍</div>
                <p className="text-[11px] font-black text-white/80 leading-snug">Thrissur City, Kerala</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-[10px]">📞</div>
                <p className="text-[11px] font-black text-white/80 leading-snug">+91 98765 43210</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-[#DA9133]">Our motto</h4>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[10px] font-black text-white/80 italic leading-relaxed tracking-wide">
                "We serve memories of home, crafted with the finest ingredients."
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
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
