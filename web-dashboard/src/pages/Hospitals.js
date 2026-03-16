import React, { useState, useEffect } from 'react';

const Hospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHospital, setNewHospital] = useState({
    hospital_name: '',
    location: '',
    capacity: '',
    emergency_facility: true,
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const response = await fetch('/hospitals');
      const data = await response.json();
      setHospitals(data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const handleAddHospital = async (e) => {
    e.preventDefault();
    try {
      await fetch('/admin/add-hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHospital)
      });
      setShowAddForm(false);
      setNewHospital({ hospital_name: '', location: '', capacity: '', emergency_facility: true, latitude: '', longitude: '' });
      fetchHospitals();
    } catch (error) {
      console.error('Error adding hospital:', error);
    }
  };

  const handleUpdateCapacity = async (hospitalId, newCapacity) => {
    try {
      await fetch('/hospital/update-capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id: hospitalId, capacity: newCapacity })
      });
      fetchHospitals();
    } catch (error) {
      console.error('Error updating capacity:', error);
    }
  };

  const getCapacityColor = (current, total) => {
    const percentage = (current / total) * 100;
    if (percentage >= 90) return '#ef4444';
    if (percentage >= 70) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="hospitals">
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Hospital Network</h2>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          + Add Hospital
        </button>
      </div>

      {showAddForm && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3>Add New Hospital</h3>
          <form onSubmit={handleAddHospital}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Hospital Name"
                value={newHospital.hospital_name}
                onChange={(e) => setNewHospital({...newHospital, hospital_name: e.target.value})}
                style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                required
              />
              <input
                type="text"
                placeholder="Address/Location"
                value={newHospital.location}
                onChange={(e) => setNewHospital({...newHospital, location: e.target.value})}
                style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                required
              />
              <input
                type="number"
                placeholder="Total Capacity"
                value={newHospital.capacity}
                onChange={(e) => setNewHospital({...newHospital, capacity: e.target.value})}
                style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                required
              />
              <input
                type="number"
                placeholder="Latitude"
                value={newHospital.latitude}
                onChange={(e) => setNewHospital({...newHospital, latitude: e.target.value})}
                style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                step="any"
              />
              <input
                type="number"
                placeholder="Longitude"
                value={newHospital.longitude}
                onChange={(e) => setNewHospital({...newHospital, longitude: e.target.value})}
                style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                step="any"
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={newHospital.emergency_facility}
                  onChange={(e) => setNewHospital({...newHospital, emergency_facility: e.target.checked})}
                />
                Emergency Facility
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-success">Add Hospital</button>
              <button type="button" className="btn" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {hospitals.map((hospital) => (
          <div key={hospital.hospital_id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#1e3a8a', marginBottom: '5px' }}>{hospital.hospital_name}</h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{hospital.location}</p>
              </div>
              {hospital.emergency_facility && (
                <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                  🚨 Emergency
                </span>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.875rem' }}>
                <span>Capacity</span>
                <span>{hospital.current_patients || 0} / {hospital.capacity} beds</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${((hospital.current_patients || 0) / hospital.capacity) * 100}%`,
                  height: '100%',
                  background: getCapacityColor(hospital.current_patients || 0, hospital.capacity),
                  transition: 'width 0.3s'
                }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, fontSize: '0.875rem' }}
                onClick={() => {
                  const newCap = prompt('Update current patients:', hospital.current_patients || 0);
                  if (newCap !== null) handleUpdateCapacity(hospital.hospital_id, parseInt(newCap));
                }}
              >
                Update Capacity
              </button>
              <button 
                className="btn" 
                style={{ fontSize: '0.875rem' }}
              >
                Notify
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hospitals;
