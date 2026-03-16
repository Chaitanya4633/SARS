import React, { useState, useEffect } from 'react';

const FleetManagement = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAmbulance, setNewAmbulance] = useState({
    vehicle_number: '',
    driver_name: '',
    status: 'active',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const fetchAmbulances = async () => {
    try {
      const response = await fetch('/ambulances');
      const data = await response.json();
      setAmbulances(data);
    } catch (error) {
      console.error('Error fetching ambulances:', error);
    }
  };

  const handleAddAmbulance = async (e) => {
    e.preventDefault();
    try {
      await fetch('/admin/add-ambulance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAmbulance)
      });
      setShowAddForm(false);
      setNewAmbulance({ vehicle_number: '', driver_name: '', status: 'active', latitude: '', longitude: '' });
      fetchAmbulances();
    } catch (error) {
      console.error('Error adding ambulance:', error);
    }
  };

  const handleStatusChange = async (ambulanceId, newStatus) => {
    try {
      await fetch('/ambulance/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ambulance_id: ambulanceId, status: newStatus })
      });
      fetchAmbulances();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="fleet-management">
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Ambulance Fleet</h2>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          + Add Ambulance
        </button>
      </div>

      {showAddForm && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3>Add New Ambulance</h3>
          <form onSubmit={handleAddAmbulance}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Vehicle Number"
                value={newAmbulance.vehicle_number}
                onChange={(e) => setNewAmbulance({...newAmbulance, vehicle_number: e.target.value})}
                style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                required
              />
              <input
                type="text"
                placeholder="Driver Name"
                value={newAmbulance.driver_name}
                onChange={(e) => setNewAmbulance({...newAmbulance, driver_name: e.target.value})}
                style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                required
              />
              <input
                type="number"
                placeholder="Latitude"
                value={newAmbulance.latitude}
                onChange={(e) => setNewAmbulance({...newAmbulance, latitude: e.target.value})}
                style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                step="any"
              />
              <input
                type="number"
                placeholder="Longitude"
                value={newAmbulance.longitude}
                onChange={(e) => setNewAmbulance({...newAmbulance, longitude: e.target.value})}
                style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                step="any"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-success">Add Ambulance</button>
              <button type="button" className="btn" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Vehicle Number</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Current Location</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ambulances.map((ambulance) => (
              <tr key={ambulance.ambulance_id}>
                <td>#{ambulance.ambulance_id}</td>
                <td>{ambulance.vehicle_number}</td>
                <td>{ambulance.driver_name}</td>
                <td>
                  <select
                    value={ambulance.status}
                    onChange={(e) => handleStatusChange(ambulance.ambulance_id, e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  >
                    <option value="active">Active</option>
                    <option value="busy">Busy</option>
                    <option value="returning">Returning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="offline">Offline</option>
                  </select>
                </td>
                <td>
                  {ambulance.latitude && ambulance.longitude 
                    ? `${ambulance.latitude.toFixed(4)}, ${ambulance.longitude.toFixed(4)}`
                    : 'Not available'}
                </td>
                <td>{ambulance.last_updated ? new Date(ambulance.last_updated).toLocaleString() : 'N/A'}</td>
                <td>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FleetManagement;
