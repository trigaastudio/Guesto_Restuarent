import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, UtensilsCrossed, ShieldCheck, Clock } from 'lucide-react';
import Footer from '../../components/Footer/Footer';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] w-full bg-[#D10000] flex flex-col relative overflow-hidden font-sans select-none text-white">

      {/* Background Image with Vibrant Red Studio Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/heroSection/hero.png"
          alt="Guesto Restaurant"
          className="w-full h-full object-cover object-center lg:object-[center_35%] opacity-60 md:opacity-70 animate-slow-zoom brightness-75 contrast-125 transition-all duration-700"
        />
        {/* Studio-style red gradient matching the reference */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF0000]/90 via-[#D10000]/80 to-[#800000]/90 z-10 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#D10000] via-transparent to-transparent z-10"></div>

        {/* Horizon shadow to mimic the studio floor look - balanced for face and bike visibility */}
        <div className="absolute bottom-0 left-0 w-full h-[25%] bg-gradient-to-t from-black/40 to-transparent z-15"></div>
      </div>

      {/* Header */}
      <header className="flex justify-between items-center px-6 md:px-12 py-6 relative z-30">
        <div className="flex items-center gap-2">
          <img src="/logo-light.png" alt="Guesto Restaurant" className="h-8 md:h-10 object-contain" />
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-white/80">
            <a href="#" className="hover:text-white transition-colors">Home</a>
            <a href="#" className="hover:text-white transition-colors">Menu</a>
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </nav>
          <button
            onClick={() => navigate('/login')}
            className="bg-[#DA9133] hover:bg-[#C27D29] text-white px-5 md:px-7 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all active:scale-95 shadow-xl shadow-black/20 uppercase tracking-widest"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-between px-6 md:px-12 pt-10 pb-12 lg:pt-0 lg:pb-0 relative z-20 max-w-7xl mx-auto w-full gap-6 md:gap-16 lg:gap-20">

        {/* Left Side: Content */}
        <div className="flex-1 text-center lg:text-left space-y-6 md:space-y-10 page-fade-in">
          <div className="space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white/90 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mx-auto lg:mx-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              Chef's Signature
            </div>

            <div className="flex flex-col gap-3 pt-2 md:pt-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black leading-[1.05] tracking-tighter uppercase text-white drop-shadow-2xl">
                Guesto <span className="block opacity-90">Restaurant</span>
              </h1>
              <p className="text-white/90 text-sm md:text-lg lg:text-xl font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed uppercase tracking-widest opacity-80">
                Savor the authentic flavors of Thrissur. We bring premium, chef-crafted meals directly to your dining table.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="group inline-flex items-center justify-center gap-3 bg-[#DA9133] text-white py-3.5 md:py-4.5 px-8 md:px-10 rounded-full font-bold text-base md:text-lg shadow-2xl shadow-black/30 hover:bg-[#C27D29] hover:-translate-y-1 transition-all duration-300 active:scale-95 uppercase tracking-widest"
          >
            EXPLORE MENU
            <ArrowRight className="group-hover:translate-x-1.5 transition-transform duration-300" size={20} />
          </button>
        </div>

        {/* Right Side: Glassmorphism Card */}
        <div className="flex flex-col gap-4 w-full max-w-sm sm:max-w-md page-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="backdrop-blur-3xl bg-white/10 border border-white/20 p-6 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] space-y-4 md:space-y-10 relative overflow-hidden group">
            {/* Decorative Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-[70px]"></div>

            <div className="flex items-center gap-4 md:gap-6 relative z-10">
              <div className="p-4 md:p-5 bg-white/20 rounded-2xl text-white shrink-0 shadow-inner">
                <Clock size={28} className="md:w-8 md:h-8" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-lg md:text-2xl text-white tracking-tight uppercase">Hot & Fresh</h3>
                <p className="text-white/70 font-black text-sm md:text-lg uppercase tracking-wider">Served in 18-24 mins</p>
              </div>
            </div>

            <div className="w-full h-px bg-white/20 relative z-10"></div>

            <div className="flex items-center gap-4 md:gap-6 relative z-10">
              <div className="p-4 md:p-5 bg-white/10 rounded-2xl text-white shrink-0 border border-white/20 shadow-lg">
                <UtensilsCrossed size={28} className="md:w-8 md:h-8" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-lg md:text-2xl text-white tracking-tight uppercase">Signature Dishes</h3>
                <p className="text-white/60 text-xs md:text-sm font-semibold uppercase tracking-widest">By expert chefs</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s ease-out infinite alternate;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-fade-in {
          animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}} />
    </div>
  );
};

export default LandingPage;
