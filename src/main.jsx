import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

import { DEFAULT_API_BASE_URL } from './config/apiDefaults.js';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  }
  return DEFAULT_API_BASE_URL;
}

axios.defaults.baseURL = getApiBaseUrl()
axios.defaults.timeout = 90000 // 90s: backend may fetch Wikipedia images + weather + maps on first query
axios.defaults.headers.common['Content-Type'] = 'application/json'

// Auto-hide scrollbar when not scrolling: add 'scrolling' class while user scrolls
if (typeof window !== 'undefined') {
  const scrollingClassTimeout = 900; // ms
  const checkScrollables = () => {
    const all = Array.from(document.querySelectorAll('body *'));
    return all.filter(el => {
      try {
        const s = window.getComputedStyle(el);
        return (s.overflowY === 'auto' || s.overflowY === 'scroll' || s.overflowX === 'auto' || s.overflowX === 'scroll');
      } catch (e) { return false; }
    });
  };

  const attach = () => {
    const els = checkScrollables();
    els.forEach(el => {
      if (el.__hasAutoScrollbarListener) return;
      el.__hasAutoScrollbarListener = true;
      let t = null;
      el.addEventListener('scroll', () => {
        el.classList.add('scrolling');
        if (t) clearTimeout(t);
        t = setTimeout(() => el.classList.remove('scrolling'), scrollingClassTimeout);
      }, { passive: true });
      // Also show on pointerenter
      el.addEventListener('pointerenter', () => el.classList.add('scrolling'));
      el.addEventListener('pointerleave', () => { if (t) clearTimeout(t); el.classList.remove('scrolling'); });
    });
  };

  // Initial attach and periodic rescans (for dynamic content)
  window.addEventListener('load', attach);
  setTimeout(attach, 500);
  setInterval(attach, 3000);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
