import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Select from './pages/Select';
import Dashboard from './pages/Dashboard';
import Help from './pages/Help';
import Leaderboard from './pages/Leaderboard';

function App() {
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    // Load saved language preference on mount
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Set document language attribute whenever language changes
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className="App">
      <ScrollToTop />
      <Header />
      <main>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/select" element={<Select />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </AnimatePresence>
      </main>
      
      {/* Comprehensive Footer */}
      <Footer />
    </div>
  );
}

export default App;
