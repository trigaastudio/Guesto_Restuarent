import React, { useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';

const TermsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 px-6 sm:px-12 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl sm:text-4xl font-black text-primary mb-8 tracking-tight">Terms of Service</h1>
        
        <div className="space-y-8 text-sm sm:text-base text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">2. User Accounts</h2>
            <p>
              To use certain features of the website, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">3. Orders and Payments</h2>
            <p>
              All orders are subject to availability and acceptance. We reserve the right to refuse or cancel any order for any reason at any given time. Prices for our products are subject to change without notice. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">4. Cancellations and Refunds</h2>
            <p>
              Orders cannot be cancelled once they have been prepared or dispatched. Refunds are issued at the sole discretion of the management and are typically only granted in cases where the wrong item was delivered or the item was found to be defective.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">5. Limitation of Liability</h2>
            <p>
              In no event shall the restaurant, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
