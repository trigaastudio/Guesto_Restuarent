import React, { useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';

const PrivacyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 px-6 sm:px-12 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl sm:text-4xl font-black text-primary mb-8 tracking-tight">Privacy Policy</h1>
        
        <div className="space-y-8 text-sm sm:text-base text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested, delivery notes, and other information you choose to provide.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">2. How We Use Your Information</h2>
            <p>
              We use the information we collect about you to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, maintain, and improve our Services, including, for example, to facilitate payments, send receipts, provide products and services you request (and send related information), develop new features, provide customer support, and send updates and administrative messages.</li>
              <li>Perform internal operations, including, for example, to prevent fraud and abuse of our Services; to troubleshoot software bugs and operational problems; to conduct data analysis, testing, and research; and to monitor and analyze usage and activity trends.</li>
              <li>Personalize and improve the Services, including to provide or recommend features, content, social connections, referrals, and advertisements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">3. Sharing of Information</h2>
            <p>
              We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>With third parties to provide you a service you requested through a partnership or promotional offering made by a third party or us.</li>
              <li>With the general public if you submit content in a public forum, such as blog comments, social media posts, or other features of our Services that are viewable by the general public.</li>
              <li>With third parties with whom you choose to let us share information, for example other apps or websites that integrate with our API or Services, or those with an API or Service with which we integrate.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">4. Security</h2>
            <p>
              We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-text-primary mb-3">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Statement, please contact us at our restaurant contact details provided in the footer.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
