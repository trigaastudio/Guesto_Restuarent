import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import './OffersCarousel.css';

const OffersCarousel = ({ onOfferClick }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
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

  if (loading || offers.length === 0) return null;

  return (
    <div className="offers-carousel-container">
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
    </div>
  );
};

export default OffersCarousel;
