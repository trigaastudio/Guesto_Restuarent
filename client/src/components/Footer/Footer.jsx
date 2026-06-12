import React from 'react';
import { Mail, MapPin, Phone, Share2, Globe, Heart } from 'lucide-react';
import './Footer.css';
import { useCart } from '../../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';

const Footer = React.memo(() => {
  const currentYear = new Date().getFullYear();
  const { settings } = useCart();
  const navigate = useNavigate();

  const brandName = settings?.restaurantDetails?.name || "GuestO";
  const address = settings?.restaurantDetails?.address || "Chammannur, Athirthi, Kunnamkulam";
  const phone = settings?.restaurantDetails?.contactNumber || "7034805085,9947649007";
  const email = settings?.restaurantDetails?.email || "restaurantguesto@gmail.com";

  const user = JSON.parse(
    localStorage.getItem('user') || 
    localStorage.getItem('admin_user') || 
    'null'
  );

  const handleNavClick = (e, path, name) => {
    e.preventDefault();
    if (name === 'Home') {
      const targetPath = user ? '/home' : '/';
      if (window.location.pathname === targetPath || window.location.pathname === '/home' || window.location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate(targetPath);
      }
    } else if (name === 'Menu') {
      const targetPath = user ? '/home' : '/';
      if (window.location.pathname === targetPath || window.location.pathname === '/home' || window.location.pathname === '/') {
        const menuSection = document.getElementById('menu');
        if (menuSection) {
          menuSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          navigate(`${targetPath}#menu`);
        }
      } else {
        navigate(`${targetPath}#menu`);
        setTimeout(() => {
          const menuSection = document.getElementById('menu');
          if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-primary dark:bg-background-card text-white dark:text-text-primary pt-6 pb-24 md:pb-6 overflow-hidden border-t border-border/10">
      {}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-[80px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-6">
          {}
          <div className="space-y-8">
            <div className="space-y-4">
              <img
                src={settings?.branding?.logoGold || "/logo-golden.png"}
                alt={brandName}
                className="h-12 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)] cursor-pointer"
                onClick={(e) => handleNavClick(e, '/home', 'Home')}
              />
              <p className="text-white/80 dark:text-text-muted text-[11px] font-bold leading-relaxed tracking-wide max-w-xs">
                Crafting extraordinary culinary experiences since 2020. We bring the authentic heart of our heritage to your table with a modern twist.
              </p>
            </div>

            {}
            <div className="flex items-center gap-4">
              {[
                { name: 'Social', Icon: Share2 },
                { name: 'Web', Icon: Globe },
                { name: 'Love', Icon: Heart }
              ].map(({ Icon }, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-11 h-11 rounded-2xl bg-white/10 dark:bg-background-muted backdrop-blur-md border border-white/20 dark:border-border/60 flex items-center justify-center hover:bg-white hover:text-primary dark:hover:bg-primary dark:hover:text-white transition-all duration-500 group shadow-lg"
                >
                  <Icon size={20} className="group-hover:scale-110 transition-transform duration-500" strokeWidth={2.5} />
                </a>
              ))}
            </div>
          </div>

          {}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black tracking-[0.3em] text-white/60 dark:text-text-muted/50 uppercase">Navigation</h4>
            <ul className="space-y-4">
              {[
                { name: 'Home', path: '/home' },
                { name: 'Menu', path: '/home#menu' },
                { name: 'About Our Story', path: '/about' }
              ].map((item) => (
                <li key={item.name}>
                  <button
                    onClick={(e) => handleNavClick(e, item.path, item.name === 'About Our Story' ? 'About' : item.name)}
                    className="text-xs font-black text-white/70 dark:text-text-muted hover:text-white dark:hover:text-primary hover:translate-x-3 transition-all duration-300 flex items-center gap-3 group"
                  >
                    <span className="w-2 h-[2px] bg-white/30 dark:bg-text-muted/30 group-hover:w-4 group-hover:bg-white dark:group-hover:bg-primary transition-all"></span>
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black tracking-[0.3em] text-white/60 dark:text-text-muted/50 uppercase">Connect</h4>
            <div className="space-y-5">
              <div className="flex items-start gap-5 group">
                <div className="w-10 h-10 rounded-2xl bg-white/10 dark:bg-background-muted flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-primary dark:group-hover:bg-primary dark:group-hover:text-white transition-all duration-500">
                  <MapPin size={18} strokeWidth={2.5} />
                </div>
                <p className="text-[11px] font-black text-white/70 dark:text-text-muted leading-relaxed pt-1">
                  {address}
                </p>
              </div>
              <div className="flex items-center gap-5 group">
                <div className="w-10 h-10 rounded-2xl bg-white/10 dark:bg-background-muted flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-primary dark:group-hover:bg-primary dark:group-hover:text-white transition-all duration-500">
                  <Phone size={18} strokeWidth={2.5} />
                </div>
                <p className="text-[11px] font-black text-white/70 dark:text-text-muted">{phone}</p>
              </div>
              <div className="flex items-center gap-5 group">
                <div className="w-10 h-10 rounded-2xl bg-white/10 dark:bg-background-muted flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-primary dark:group-hover:bg-primary dark:group-hover:text-white transition-all duration-500">
                  <Mail size={18} strokeWidth={2.5} />
                </div>
                <p className="text-[11px] font-black text-white/70 dark:text-text-muted">{email}</p>
              </div>
            </div>
          </div>

          {}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black tracking-[0.3em] text-white/60 dark:text-text-muted/50 uppercase">The Experience</h4>
            <div className="bg-white/10 dark:bg-background-muted backdrop-blur-md rounded-[2rem] p-8 border border-white/20 dark:border-border/10 space-y-4 shadow-2xl">
              <p className="text-[11px] font-black text-white dark:text-text-primary leading-relaxed italic opacity-90">
                "We don't just serve food; we serve memories of home, crafted with the finest ingredients and a pinch of love."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-1 w-12 bg-white dark:bg-primary rounded-full"></div>
                <span className="text-[9px] font-black tracking-widest uppercase opacity-60 dark:text-text-muted">{brandName} Philosophy</span>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="pb-12 md:pb-0 pt-6 border-t border-white/10 dark:border-border/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] font-black text-white/60 dark:text-text-muted/40 tracking-[0.2em] uppercase">
              © {currentYear} {brandName}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-[8px] font-bold text-white/40 dark:text-text-muted/20 tracking-widest uppercase">
                Designed by
              </p>
              <img 
                src="/developer-logo.png" 
                alt="Developer Logo" 
                className="h-4 sm:h-5 object-contain opacity-70 hover:opacity-100 transition-opacity"
              />
              <a href="tel:9048136161" className="text-[8px] font-bold text-white/40 dark:text-text-muted/20 tracking-widest hover:text-white dark:hover:text-primary transition-colors">
                | +91 9048136161
              </a>
            </div>
          </div>

          <div className="flex gap-10">
            {['Privacy', 'Terms', 'Cookies'].map((link) => (
              <Link
                key={link}
                to={`/${link.toLowerCase()}`}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-[10px] font-black text-white/60 dark:text-text-muted/40 hover:text-white dark:hover:text-primary transition-all tracking-[0.2em] uppercase relative group"
              >
                {link}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-white dark:bg-primary transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
