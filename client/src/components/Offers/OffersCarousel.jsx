import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axiosInstance';
import './OffersCarousel.css';

const OffersCarousel = ({ onOfferClick }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const autoScrollTimer = useRef(null);
  const isUserInteracting = useRef(false);

  useEffect(() => {
    fetchOffers();
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await api.get('/api/offers?activeOnly=true');
      if (response.data.success) {
        setOffers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Track active dot based on scroll position
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / offers.length;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, offers.length - 1));
  }, [offers.length]);

  // Auto-scroll carousel
  const startAutoScroll = useCallback(() => {
    if (!isMobile || offers.length <= 1) return;
    clearInterval(autoScrollTimer.current);
    autoScrollTimer.current = setInterval(() => {
      if (isUserInteracting.current || !scrollRef.current) return;
      const el = scrollRef.current;
      const cardWidth = el.scrollWidth / offers.length;
      const nextIndex = (activeIndex + 1) % offers.length;
      el.scrollTo({ left: nextIndex * cardWidth, behavior: 'smooth' });
      setActiveIndex(nextIndex);
    }, 3000);
  }, [isMobile, offers.length, activeIndex]);

  useEffect(() => {
    startAutoScroll();
    return () => clearInterval(autoScrollTimer.current);
  }, [startAutoScroll]);

  // Scroll to dot
  const scrollToIndex = (index) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / offers.length;
    el.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    setActiveIndex(index);
  };

  // Mouse drag to scroll
  const onMouseDown = (e) => {
    isDragging.current = true;
    isUserInteracting.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
  };

  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const onMouseUp = () => {
    isDragging.current = false;
    scrollRef.current.style.cursor = 'grab';
    setTimeout(() => { isUserInteracting.current = false; }, 1500);
  };

  // Touch support
  const onTouchStart = (e) => {
    isUserInteracting.current = true;
    startX.current = e.touches[0].pageX;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const onTouchEnd = () => {
    setTimeout(() => { isUserInteracting.current = false; }, 1500);
  };

  if (loading || offers.length === 0) return null;

  return (
    <div className="offers-carousel-container">
      {/* Desktop grid */}
      {!isMobile && (
        <div className="offers-grid">
          {offers.slice(0, 3).map((offer) => (
            <div
              key={offer._id}
              className="offer-card"
              onClick={() => onOfferClick(offer)}
            >
              <img src={offer.bannerImage} alt={offer.title} className="offer-card-image" />
              <div className="offer-card-overlay">
                <span className="offer-card-tag">{offer.offerType}</span>
                <h3 className="offer-card-title">{offer.title}</h3>
                <p className="offer-card-desc line-clamp-2">{offer.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile horizontal scroll with animation */}
      {isMobile && (
        <div className="offers-mobile-wrapper">
          <div
            className="offers-scroll-track"
            ref={scrollRef}
            onScroll={handleScroll}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {offers.map((offer, i) => (
              <div
                key={offer._id}
                className={`offer-card offer-card-mobile ${i === activeIndex ? 'offer-card-active' : ''}`}
                onClick={() => onOfferClick(offer)}
              >
                <img src={offer.bannerImage} alt={offer.title} className="offer-card-image" />
                <div className="offer-card-overlay">
                  <span className="offer-card-tag">{offer.offerType}</span>
                  <h3 className="offer-card-title">{offer.title}</h3>
                  <p className="offer-card-desc line-clamp-2">{offer.description}</p>
                </div>
                {/* Shine sweep animation */}
                <div className="offer-card-shine" />
              </div>
            ))}
          </div>

          {/* Dot indicators */}
          {offers.length > 1 && (
            <div className="offers-dots">
              {offers.map((_, i) => (
                <button
                  key={i}
                  className={`offers-dot ${i === activeIndex ? 'offers-dot-active' : ''}`}
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Go to offer ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OffersCarousel;
