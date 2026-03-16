import React, { useState, useEffect } from 'react';

const EmergencyRequests = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    try {
      const response = await fetch('/requests');
      const data = await response.json();
      setEmergencies(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching emergencies:', error);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await fetch(`/request/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, status: newStatus })
      });
      fetchEmergencies();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#dc2626',
      high: '#d97706',
      medium: '#2563eb',
      low: '#059669'
    };
    return colors[severity] || '#6b7280';
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="emergency-requests">
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>All Emergency Requests</h2>
        <button className="btn btn-primary" onClick={fetchEmergencies}>Refresh</button>
      </div>
      
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Location</th>
              <th>Status</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {emergencies.map((emergency) => (
              <tr key={emergency.request_id}>
                <td>#{emergency.request_id}</td>
                <td>{emergency.patient_name}</td>
                <td>{emergency.emergency_type}</td>
                <td>
                  <span 
                    className={`severity-badge ${emergency.severity_level}`}
                    style={{ 
                      backgroundColor: getSeverityColor(emergency.severity_level) + '20',
                      color: getSeverityColor(emergency.severity_level)
                    }}
                  >
                    {emergency.severity_level}
                  </span>
                </td>
                <td>{emergency.location}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    backgroundColor: emergency.status === 'active' ? '#fee2e2' : 
                                    emergency.status === 'assigned' ? '#dbeafe' :
                                    emergency.status === 'completed' ? '#d1fae5' : '#f3f4f6',
                    color: emergency.status === 'active' ? '#dc2626' :
                          emergency.status === 'assigned' ? '#2563eb' :
                          emergency.status === 'completed' ? '#059669' : '#6b7280'
                  }}>
                    {emergency.status}
                  </span>
                </td>
                <td>{new Date(emergency.request_time).toLocaleString()}</td>
                <td>
                  <select 
                    value={emergency.status}
                    onChange={(e) => handleStatusUpdate(emergency.request_id, e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="en_route">En Route</option>
                    <option value="on_scene">On Scene</option>
                    <option value="transporting">Transporting</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmergencyRequests;
