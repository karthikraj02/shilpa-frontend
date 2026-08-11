import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';

const GREETING =
  "Hello! I'm your intelligent travel companion. Explore destinations, plan trips, discover hotels, transportation, weather, and more.";

const POPULAR_DESTINATIONS = [
  {
    name: 'Goa',
    location: 'Goa, India',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop',
  },
  {
    name: 'Mysore',
    location: 'Karnataka, India',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1582510003294-58a04479343e?w=600&h=400&fit=crop',
  },
  {
    name: 'Udupi',
    location: 'Karnataka, India',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&h=400&fit=crop',
  },
  {
    name: 'Chikmagalur',
    location: 'Karnataka, India',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop',
  },
  {
    name: 'Coorg',
    location: 'Karnataka, India',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
  },
  {
    name: 'Hampi',
    location: 'Karnataka, India',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1596178060810-fb246a050826?w=600&h=400&fit=crop',
  },
];

const QUICK_ACTIONS = [
  { key: 'weather', emoji: '🌤', label: 'Weather', query: "What's the weather like in Goa?" },
  { key: 'maps', emoji: '🗺', label: 'Maps', query: 'Show me maps for popular destinations in Karnataka' },
  { key: 'hotels', emoji: '🏨', label: 'Hotels', query: 'Hotels in Mysore' },
  { key: 'flights', emoji: '✈', label: 'Flights', query: 'Find flights from Bangalore to Goa' },
  { key: 'trains', emoji: '🚆', label: 'Trains', query: 'Train options from Bangalore to Mysore' },
  { key: 'buses', emoji: '🚌', label: 'Buses', query: 'Bus services to Coorg' },
  { key: 'emergency', emoji: '🚨', label: 'Emergency', action: 'emergency' },
  { key: 'upload', emoji: '📷', label: 'Upload Image', action: 'upload' },
];

const SUGGESTED_QUESTIONS = [
  'Best beaches in Karnataka',
  'Plan a weekend trip to Goa',
  'Hotels in Mysore',
  'Best trekking places',
  'Family vacation',
  'Tell me about Hampi',
];

const TypingGreeting = ({ text }) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i += 1;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 22);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className="home-greeting-text">
      {displayed}
      {!done && <span className="home-typing-cursor">|</span>}
    </p>
  );
};

const ChatHomeDashboard = ({ onSendMessage, onEmergency, onUploadImage }) => {
  const handleQuickAction = (action) => {
    if (action.action === 'emergency') {
      onEmergency?.();
      return;
    }
    if (action.action === 'upload') {
      onUploadImage?.();
      return;
    }
    if (action.query) onSendMessage(action.query);
  };

  return (
    <div className="chat-home-dashboard">
      <div className="home-bg-orbs" aria-hidden="true">
        <span className="home-orb home-orb-1" />
        <span className="home-orb home-orb-2" />
        <span className="home-orb home-orb-3" />
      </div>

      {/* Welcome header with animated avatar */}
      <motion.section
        className="home-welcome glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="home-welcome-inner">
          <motion.div
            className="home-avatar"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="home-avatar-ring" />
            <span className="home-avatar-emoji">🤖</span>
          </motion.div>
          <div className="home-welcome-content">
            <h1 className="home-title">Welcome to AI Tourist Assistant</h1>
            <TypingGreeting text={GREETING} />
          </div>
        </div>
      </motion.section>

      {/* Action cards */}
      <section className="home-action-cards">
        <motion.div
          className="home-action-card glass-panel"
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="home-action-icon">🌍</div>
          <h3>Explore Destinations</h3>
          <p>Discover destinations, weather, maps, hotels, transport, and travel tips.</p>
          <button
            type="button"
            className="home-btn home-btn-glow"
            onClick={() => onSendMessage('Explore destinations in Karnataka')}
          >
            Explore Now
          </button>
        </motion.div>

        <motion.div
          className="home-action-card glass-panel home-action-card-accent"
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="home-action-icon">✈️</div>
          <h3>Plan &amp; Book Trip</h3>
          <p>Generate itineraries, plan budgets, and complete bookings with payment.</p>
          <button
            type="button"
            className="home-btn home-btn-glow home-btn-accent"
            onClick={() => onSendMessage('Plan a weekend trip to Goa')}
          >
            Start Planning
          </button>
        </motion.div>
      </section>

      {/* Popular destinations */}
      <section className="home-section">
        <h2 className="home-section-title">Popular Destinations</h2>
        <div className="home-dest-grid">
          {POPULAR_DESTINATIONS.map((dest, idx) => (
            <motion.article
              key={dest.name}
              className="home-dest-card glass-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.4 }}
              whileHover={{ y: -8 }}
            >
              <div className="home-dest-image-wrap">
                <img src={dest.image} alt={dest.name} loading="lazy" />
                <span className="home-dest-rating">
                  <Star size={12} fill="currentColor" /> {dest.rating}
                </span>
              </div>
              <div className="home-dest-body">
                <h4>{dest.name}</h4>
                <p className="home-dest-location">
                  <MapPin size={13} /> {dest.location}
                </p>
                <button
                  type="button"
                  className="home-btn home-btn-sm home-btn-glow"
                  onClick={() => onSendMessage(`Tell me about ${dest.name}`)}
                >
                  Explore
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="home-section">
        <h2 className="home-section-title">Quick Actions</h2>
        <div className="home-quick-grid">
          {QUICK_ACTIONS.map((action) => (
            <motion.button
              key={action.key}
              type="button"
              className="home-quick-card glass-panel"
              whileHover={{ y: -4, scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleQuickAction(action)}
            >
              <span className="home-quick-emoji">{action.emoji}</span>
              <span className="home-quick-label">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Suggested questions */}
      <section className="home-section home-section-last">
        <h2 className="home-section-title">Suggested Questions</h2>
        <div className="home-suggestions">
          {SUGGESTED_QUESTIONS.map((q) => (
            <motion.button
              key={q}
              type="button"
              className="home-suggestion-chip"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSendMessage(q)}
            >
              {q}
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ChatHomeDashboard;
