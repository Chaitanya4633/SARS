import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  // Sample data - replace with real data from API
  const emergencyTypeData = [
    { type: 'Cardiac', count: 45 },
    { type: 'Accident', count: 38 },
    { type: 'Respiratory', count: 28 },
    { type: 'Stroke', count: 22 },
    { type: 'Trauma', count: 35 },
    { type: 'Other', count: 18 },
  ];

  const responseTimeData = [
    { day: 'Mon', avg: 8.5, target: 10 },
    { day: 'Tue', avg: 7.8, target: 10 },
    { day: 'Wed', avg: 9.2, target: 10 },
    { day: 'Thu', avg: 8.1, target: 10 },
    { day: 'Fri', avg: 10.5, target: 10 },
    { day: 'Sat', avg: 12.3, target: 10 },
    { day: 'Sun', avg: 11.8, target: 10 },
  ];

  const statusData = [
    { name: 'Completed', value: 156, color: '#10b981' },
    { name: 'In Progress', value: 23, color: '#3b82f6' },
    { name: 'Pending', value: 8, color: '#f59e0b' },
    { name: 'Cancelled', value: 5, color: '#ef4444' },
  ];

  const ambulanceUtilization = [
    { name: 'Ambulance 101', trips: 12, hours: 48 },
    { name: 'Ambulance 102', trips: 15, hours: 52 },
    { name: 'Ambulance 103', trips: 10, hours: 42 },
    { name: 'Ambulance 104', trips: 18, hours: 58 },
    { name: 'Ambulance 105', trips: 14, hours: 50 },
  ];

  return (
    <div className="reports">
      <div style={{ marginBottom: '20px' }}>
        <h2>Analytics & Reports</h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>View system performance and emergency statistics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Emergency Types Chart */}
        <div className="chart-container">
          <h3>Emergency Types Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={emergencyTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time Chart */}
        <div className="chart-container">
          <h3>Average Response Time (minutes)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg" fill="#3b82f6" name="Actual" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" fill="#e5e7eb" name="Target" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="chart-container">
          <h3>Emergency Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
            {statusData.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: 12, height: 12, background: item.color, borderRadius: 2 }}></div>
                <span style={{ fontSize: '0.875rem' }}>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ambulance Utilization */}
        <div className="chart-container">
          <h3>Ambulance Utilization (Weekly)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ambulanceUtilization} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="trips" fill="#10b981" name="Trips" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="chart-container" style={{ marginTop: '20px' }}>
        <h3>Monthly Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3a8a' }}>192</p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Emergencies</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>8.9 min</p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Avg Response Time</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>81%</p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Success Rate</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>15,420</p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Distance (km)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
