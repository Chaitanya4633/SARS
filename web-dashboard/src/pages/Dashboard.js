import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import io from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Fix for default markers in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom ambulance icon
const ambulanceIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#3b82f6; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);'>🚑</div>",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Emergency icon
const emergencyIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#ef4444; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); animation:pulse 2s infinite;'>🚨</div>",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeEmergencies: 0,
    activeAmbulances: 0,
    availableHospitals: 0,
    avgResponseTime: 0
  });
  const [ambulances, setAmbulances] = useState([]);
  const [recentEmergencies, setRecentEmergencies] = useState([]);

  useEffect(() => {
    // Connect to Socket.io
    const socket = io('http://localhost:5001');
    
    socket.on('ambulance_location_update', (data) => {
      setAmbulances(prev => {
        const filtered = prev.filter(a => a.ambulance_id !== data.ambulance_id);
        return [...filtered, data];
      });
    });

    socket.on('new_emergency', (data) => {
      setRecentEmergencies(prev => [data, ...prev].slice(0, 5));
    });

    // Fetch initial data
    fetchStats();
    fetchAmbulances();
    fetchRecentEmergencies();

    return () => socket.disconnect();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/admin/analytics');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAmbulances = async () => {
    try {
      const response = await fetch('/ambulances');
      const data = await response.json();
      setAmbulances(data.filter(a => a.status === 'active'));
    } catch (error) {
      console.error('Error fetching ambulances:', error);
    }
  };

  const fetchRecentEmergencies = async () => {
    try {
      const response = await fetch('/requests?limit=5');
      const data = await response.json();
      setRecentEmergencies(data);
    } catch (error) {
      console.error('Error fetching emergencies:', error);
    }
  };

  const responseTimeData = [
    { time: '00:00', avg: 8.5 },
    { time: '04:00', avg: 7.2 },
    { time: '08:00', avg: 12.3 },
    { time: '12:00', avg: 15.1 },
    { time: '16:00', avg: 14.8 },
    { time: '20:00', avg: 11.2 },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon emergency">🚨</div>
          <div className="stat-info">
            <h3>Active Emergencies</h3>
            <p>{stats.activeEmergencies}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon ambulance">🚑</div>
          <div className="stat-info">
            <h3>Active Ambulances</h3>
            <p>{stats.activeAmbulances}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon hospital">🏥</div>
          <div className="stat-info">
            <h3>Available Hospitals</h3>
            <p>{stats.availableHospitals}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon response">⏱️</div>
          <div className="stat-info">
            <h3>Avg Response Time</h3>
            <p>{stats.avgResponseTime} min</p>
          </div>
        </div>
      </div>

      <div className="map-container" style={{ marginBottom: '20px' }}>
        <h2>Live Tracking Map</h2>
        <div className="map-wrapper">
          <MapContainer center={[17.4065, 78.4772]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {ambulances.map((ambulance) => (
              <Marker
                key={ambulance.ambulance_id}
                position={[ambulance.latitude, ambulance.longitude]}
                icon={ambulanceIcon}
              >
                <Popup>
                  <div>
                    <strong>Ambulance {ambulance.vehicle_number}</strong><br/>
                    Driver: {ambulance.driver_name}<br/>
                    Status: {ambulance.status}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="emergency-list">
          <h2>Recent Emergencies</h2>
          {recentEmergencies.map((emergency) => (
            <div key={emergency.request_id} className="emergency-item">
              <div className="emergency-info">
                <h4>{emergency.patient_name}</h4>
                <p>{emergency.emergency_type} • {emergency.location}</p>
              </div>
              <span className={`severity-badge ${emergency.severity_level}`}>
                {emergency.severity_level}
              </span>
            </div>
          ))}
        </div>

        <div className="chart-container">
          <h2>Response Time Trends</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
