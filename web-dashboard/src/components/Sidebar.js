import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/emergencies', icon: '🚨', label: 'Emergency Requests' },
    { path: '/tracking', icon: '🗺️', label: 'Live Tracking' },
    { path: '/fleet', icon: '🚑', label: 'Fleet Management' },
    { path: '/hospitals', icon: '🏥', label: 'Hospitals' },
    { path: '/reports', icon: '📈', label: 'Reports' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>🚑 SARS</h2>
        <p>Smart Ambulance Routing</p>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink to={item.path} end={item.path === '/'}>
                <span className="icon">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
