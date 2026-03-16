import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Layout Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Dashboard from './pages/Dashboard';
import EmergencyRequests from './pages/EmergencyRequests';
import AmbulanceTracking from './pages/AmbulanceTracking';
import FleetManagement from './pages/FleetManagement';
import Hospitals from './pages/Hospitals';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <Header />
          <div className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/emergencies" element={<EmergencyRequests />} />
              <Route path="/tracking" element={<AmbulanceTracking />} />
              <Route path="/fleet" element={<FleetManagement />} />
              <Route path="/hospitals" element={<Hospitals />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
