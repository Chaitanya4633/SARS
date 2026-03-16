import React from 'react';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  const getPageTitle = () => {
    const path = location.pathname;
    switch(path) {
      case '/': return 'Dashboard Overview';
      case '/emergencies': return 'Emergency Requests';
      case '/tracking': return 'Live Ambulance Tracking';
      case '/fleet': return 'Fleet Management';
      case '/hospitals': return 'Hospital Management';
      case '/reports': return 'Analytics & Reports';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1>{getPageTitle()}</h1>
      </div>
      <div className="header-right">
        <div className="status-indicator">
          <span className="status-dot"></span>
          System Online
        </div>
        <div className="user-info">
          <span>Dispatcher</span>
          <div className="user-avatar">D</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
