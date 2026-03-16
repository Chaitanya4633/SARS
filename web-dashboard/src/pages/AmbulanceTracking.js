import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import io from 'socket.io-client';

const ambulanceIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#3b82f6; width:35px; height:35px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:1.2rem; border:3px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.4);'>🚑</div>",
  iconSize: [35, 35],
  iconAnchor: [17, 17]
});

const patientIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#ef4444; width:35px; height:35px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:1.2rem; border:3px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.4);'>🏥</div>",
  iconSize: [35, 35],
  iconAnchor: [17, 17]
});

const hospitalIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#10b981; width:35px; height:35px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:1.2rem; border:3px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.4);'>🚑</div>",
  iconSize: [35, 35],
  iconAnchor: [17, 17]
});

const AmbulanceTracking = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [route, setRoute] = useState([]);

  useEffect(() => {
    const socket = io('http://localhost:5001');
    
    socket.on('ambulance_location_update', (data) => {
      setAmbulances(prev => {
        const filtered = prev.filter(a => a.ambulance_id !== data.ambulance_id);
        return [...filtered, { ...data, lastUpdate: new Date() }];
      });
    });

    fetchAmbulances();

    return () => socket.disconnect();
  }, []);

  const fetchAmbulances = async () => {
    try {
      const response = await fetch('/ambulances');
      const data = await response.json();
      setAmbulances(data.filter(a => a.status !== 'offline'));
    } catch (error) {
      console.error('Error fetching ambulances:', error);
    }
  };

  const handleAmbulanceClick = async (ambulance) => {
    setSelectedAmbulance(ambulance);
    
    if (ambulance.current_emergency) {
      try {
        const response = await fetch(`/route/optimal?ambulance_id=${ambulance.ambulance_id}&emergency_id=${ambulance.current_emergency}`);
        const routeData = await response.json();
        setRoute(routeData.coordinates || []);
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    }
  };

  return (
    <div className="ambulance-tracking" style={{ display: 'flex', gap: '20px' }}>
      <div style={{ flex: 1 }}>
        <div className="map-container" style={{ height: '600px' }}>
          <h2>Live Ambulance Locations</h2>
          <div className="map-wrapper">
            <MapContainer center={[17.4065, 78.4772]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {ambulances.map((ambulance) => (
                <Marker
                  key={ambulance.ambulance_id}
                  position={[ambulance.latitude || 17.4065, ambulance.longitude || 78.4772]}
                  icon={ambulanceIcon}
                  eventHandlers={{
                    click: () => handleAmbulanceClick(ambulance)
                  }}
                >
                  <Popup>
                    <div>
                      <strong>Ambulance {ambulance.vehicle_number}</strong><br/>
                      Driver: {ambulance.driver_name}<br/>
                      Status: {ambulance.status}<br/>
                      Speed: {ambulance.speed || 0} km/h<br/>
                      Last Update: {ambulance.lastUpdate?.toLocaleTimeString()}
                    </div>
                  </Popup>
                </Marker>
              ))}
              {route.length > 0 && (
                <Polyline positions={route} color="#3b82f6" weight={4} />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
      
      <div style={{ width: '350px' }}>
        <div className="emergency-list">
          <h2>Active Ambulances</h2>
          {ambulances.map((ambulance) => (
            <div 
              key={ambulance.ambulance_id} 
              className="emergency-item"
              onClick={() => handleAmbulanceClick(ambulance)}
              style={{ cursor: 'pointer' }}
            >
              <div className="emergency-info">
                <h4>Ambulance {ambulance.vehicle_number}</h4>
                <p>Driver: {ambulance.driver_name}</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {ambulance.status === 'active' ? '🟢 Active' : 
                   ambulance.status === 'busy' ? '🔴 Busy' : 
                   ambulance.status === 'returning' ? '🟡 Returning' : '⚫ Offline'}
                </p>
              </div>
              <span className="severity-badge medium">
                {ambulance.speed || 0} km/h
              </span>
            </div>
          ))}
        </div>

        {selectedAmbulance && (
          <div className="emergency-list" style={{ marginTop: '20px' }}>
            <h2>Ambulance Details</h2>
            <div style={{ padding: '15px 20px' }}>
              <p><strong>Vehicle:</strong> {selectedAmbulance.vehicle_number}</p>
              <p><strong>Driver:</strong> {selectedAmbulance.driver_name}</p>
              <p><strong>Status:</strong> {selectedAmbulance.status}</p>
              <p><strong>Location:</strong> {selectedAmbulance.latitude?.toFixed(4)}, {selectedAmbulance.longitude?.toFixed(4)}</p>
              <p><strong>Speed:</strong> {selectedAmbulance.speed || 0} km/h</p>
              {selectedAmbulance.current_emergency && (
                <p><strong>Emergency ID:</strong> #{selectedAmbulance.current_emergency}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmbulanceTracking;
