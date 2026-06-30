import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';

const CookiesPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans">
      <Navbar 
        user={user} 
        navigate={navigate} 
        showUserDropdown={showUserDropdown}
        setShowUserDropdown={setShowUserDropdown}
        dropdownRef={dropdownRef}
      />
      
      <main className="flex-grow pt-24 pb-16 px-6 sm:px-12 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl sm:text-4xl font-black text-primary mb-8 tracking-tight">Cookie Policy</h1>
        
        <div className="space-y-8 text-sm sm:text-base text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">1. What are Cookies?</h2>
            <p>
              Cookies are small pieces of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">2. How We Use Cookies</h2>
            <p>
              When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Essential Cookies:</strong> To enable certain functions of the Service, such as remembering your login status and keeping your shopping cart active.</li>
              <li><strong>Analytics Cookies:</strong> To provide analytics and understand how users interact with our website so we can improve it.</li>
              <li><strong>Preferences Cookies:</strong> To store your preferences, such as your chosen theme (light/dark mode).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">3. Local Storage</h2>
            <p>
              In addition to cookies, we also use local storage (such as HTML5 local storage) to keep you logged in and to temporarily save your cart data and user settings so you don't lose them when you refresh the page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">4. Your Choices Regarding Cookies</h2>
            <p>
              If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser. Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiesPage;
