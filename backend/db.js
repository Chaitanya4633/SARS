const { Pool } = require('pg');

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "chaitu",
  database: "ambulance_system",
});

const db = {
  query: (text, params) => pool.query(text, params),
  
  /* ---------------- EMERGENCY QUERIES ---------------- */
  
  registerEmergency: async (data) => {
    const { patient_name, emergency_type, severity_level, location, latitude, longitude, phone } = data;
    return pool.query(
      `INSERT INTO EmergencyRequest (patient_name, emergency_type, severity_level, location, status, request_time, latitude, longitude, phone)
       VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP, $5, $6, $7)
       RETURNING *`,
      [patient_name, emergency_type, severity_level, location, latitude, longitude, phone]
    );
  },
  
  getEmergencies: async (filters = {}) => {
    let query = `SELECT * FROM EmergencyRequest`;
    const params = [];
    const conditions = [];
    
    if (filters.status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(filters.status);
    }
    
    if (filters.severity) {
      conditions.push(`severity_level = $${params.length + 1}`);
      params.push(filters.severity);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY request_time DESC`;
    
    if (filters.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(filters.limit);
    }
    
    return pool.query(query, params);
  },
  
  updateEmergencyStatus: async (request_id, status, ambulance_id) => {
    return pool.query(
      `UPDATE EmergencyRequest 
       SET status = $2, ambulance_id = COALESCE($3, ambulance_id)
       WHERE request_id = $1
       RETURNING *`,
      [request_id, status, ambulance_id]
    );
  },
  
  /* ---------------- AMBULANCE QUERIES WITH POSTGIS ---------------- */
  
  getAllAmbulances: async () => {
    return pool.query(
      `SELECT a.*, 
       ST_X(location::geometry) as longitude, 
       ST_Y(location::geometry) as latitude,
       ST_AsText(location) as location_wkt
       FROM Ambulance a
       ORDER BY a.ambulance_id`
    );
  },
  
  findNearestAmbulance: async (latitude, longitude, status = 'active') => {
    // PostGIS spatial query to find nearest ambulance
    return pool.query(
      `SELECT ambulance_id, vehicle_number, driver_name,
       ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 AS distance_km,
       ST_X(location::geometry) as longitude,
       ST_Y(location::geometry) as latitude
       FROM Ambulance
       WHERE status = $3
       ORDER BY location <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
       LIMIT 1`,
      [latitude, longitude, status]
    );
  },
  
  findNearbyAmbulances: async (latitude, longitude, radiusKm = 10, limit = 5) => {
    // Find all ambulances within radius using PostGIS
    return pool.query(
      `SELECT ambulance_id, vehicle_number, driver_name, status,
       ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 AS distance_km
       FROM Ambulance
       WHERE status = 'active'
       AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3 * 1000)
       ORDER BY distance_km
       LIMIT $4`,
      [latitude, longitude, radiusKm, limit]
    );
  },
  
  updateAmbulanceLocation: async (ambulance_id, latitude, longitude) => {
    // Update with PostGIS point
    return pool.query(
      `UPDATE Ambulance 
       SET location = ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
           current_location = $3 || ', ' || $2,
           last_updated = CURRENT_TIMESTAMP
       WHERE ambulance_id = $4
       RETURNING *`,
      [latitude, longitude, latitude, ambulance_id]
    );
  },
  
  updateAmbulanceStatus: async (ambulance_id, status) => {
    return pool.query(
      `UPDATE Ambulance 
       SET status = $2, last_updated = CURRENT_TIMESTAMP
       WHERE ambulance_id = $1
       RETURNING *`,
      [ambulance_id, status]
    );
  },
  
  assignAmbulanceToEmergency: async (ambulance_id, emergency_id) => {
    return pool.query(
      `UPDATE Ambulance 
       SET status = 'busy', current_emergency = $2, last_updated = CURRENT_TIMESTAMP
       WHERE ambulance_id = $1
       RETURNING *`,
      [ambulance_id, emergency_id]
    );
  },
  
  /* ---------------- HOSPITAL QUERIES WITH POSTGIS ---------------- */
  
  getAllHospitals: async () => {
    return pool.query(
      `SELECT *, 
       ST_X(location_geo::geometry) as longitude, 
       ST_Y(location_geo::geometry) as latitude,
       ST_AsText(location_geo) as location_wkt
       FROM Hospital
       ORDER BY hospital_id`
    );
  },
  
  findNearestHospital: async (latitude, longitude, requireEmergencyFacility = true) => {
    let query = `SELECT hospital_id, hospital_name, location, capacity, current_patients, emergency_facility,
       ST_Distance(location_geo, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 AS distance_km
       FROM Hospital
       WHERE current_patients < capacity`;
    
    const params = [latitude, longitude];
    
    if (requireEmergencyFacility) {
      query += ` AND emergency_facility = true`;
    }
    
    query += ` ORDER BY location_geo <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography LIMIT 1`;
    
    return pool.query(query, params);
  },
  
  findHospitalsInRange: async (latitude, longitude, radiusKm = 20) => {
    return pool.query(
      `SELECT hospital_id, hospital_name, location, capacity, current_patients,
       ST_Distance(location_geo, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 AS distance_km,
       ROUND((current_patients::numeric / capacity::numeric) * 100, 1) as occupancy_rate
       FROM Hospital
       WHERE emergency_facility = true
       AND ST_DWithin(location_geo, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3 * 1000)
       ORDER BY distance_km, occupancy_rate ASC
       LIMIT 10`,
      [latitude, longitude, radiusKm]
    );
  },
  
  updateHospitalCapacity: async (hospital_id, current_patients) => {
    return pool.query(
      `UPDATE Hospital 
       SET current_patients = $2
       WHERE hospital_id = $1
       RETURNING *, 
       ROUND((current_patients::numeric / capacity::numeric) * 100, 1) as occupancy_rate`,
      [hospital_id, current_patients]
    );
  },
  
  /* ---------------- GPS TRACKING QUERIES ---------------- */
  
  updateGPSLocation: async (ambulance_id, latitude, longitude, speed = 0) => {
    return pool.query(
      `INSERT INTO GPSTracking (ambulance_id, latitude, longitude, speed, last_updated)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (ambulance_id) 
       DO UPDATE SET latitude = $2, longitude = $3, speed = $4, last_updated = CURRENT_TIMESTAMP
       RETURNING *`,
      [ambulance_id, latitude, longitude, speed]
    );
  },
  
  getLatestLocation: async (ambulance_id) => {
    return pool.query(
      `SELECT * FROM GPSTracking WHERE ambulance_id = $1 ORDER BY last_updated DESC LIMIT 1`,
      [ambulance_id]
    );
  },
  
  getLocationHistory: async (ambulance_id, hours = 24) => {
    return pool.query(
      `SELECT * FROM GPSTracking 
       WHERE ambulance_id = $1 
       AND last_updated >= CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
       ORDER BY last_updated DESC`,
      [ambulance_id]
    );
  },
  
  /* ---------------- ROUTE OPTIMIZATION QUERIES ---------------- */
  
  saveRoute: async (data) => {
    const { ambulance_id, emergency_id, route_geometry, estimated_time, distance, traffic_data } = data;
    return pool.query(
      `INSERT INTO RouteOptimization (ambulance_id, emergency_id, route_geometry, estimated_time, distance, traffic_data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (ambulance_id, emergency_id) 
       DO UPDATE SET route_geometry = $3, estimated_time = $4, distance = $5, traffic_data = $6, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [ambulance_id, emergency_id, route_geometry, estimated_time, distance, traffic_data]
    );
  },
  
  getRoute: async (ambulance_id, emergency_id) => {
    return pool.query(
      `SELECT * FROM RouteOptimization 
       WHERE ambulance_id = $1 AND emergency_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [ambulance_id, emergency_id]
    );
  },
  
  /* ---------------- ADMIN & ANALYTICS QUERIES ---------------- */
  
  getSystemAnalytics: async () => {
    return pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM EmergencyRequest WHERE status IN ('active', 'assigned', 'en_route')) as active_emergencies,
        (SELECT COUNT(*) FROM Ambulance WHERE status = 'active') as active_ambulances,
        (SELECT COUNT(*) FROM Hospital WHERE emergency_facility = true) as available_hospitals,
        (SELECT AVG(response_time) FROM EmergencyRequest WHERE response_time IS NOT NULL) as avg_response_time,
        (SELECT COUNT(*) FROM EmergencyRequest WHERE request_time >= CURRENT_DATE) as today_emergencies,
        (SELECT COUNT(*) FROM EmergencyRequest WHERE status = 'completed' AND request_time >= CURRENT_DATE) as today_completed
    `);
  },
  
  getEmergencyStatsByType: async (days = 30) => {
    return pool.query(
      `SELECT emergency_type, COUNT(*) as count,
       ROUND(AVG(response_time), 2) as avg_response_time
       FROM EmergencyRequest
       WHERE request_time >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY emergency_type
       ORDER BY count DESC`
    );
  },
  
  getAmbulanceUtilization: async () => {
    return pool.query(`
      SELECT a.ambulance_id, a.vehicle_number, a.driver_name,
      COUNT(e.request_id) as total_trips,
      SUM(e.response_time) as total_response_time,
      ROUND(AVG(e.response_time), 2) as avg_response_time
      FROM Ambulance a
      LEFT JOIN EmergencyRequest e ON a.ambulance_id = e.ambulance_id AND e.status = 'completed'
      WHERE e.request_time >= CURRENT_DATE - INTERVAL '30 days' OR e.request_time IS NULL
      GROUP BY a.ambulance_id, a.vehicle_number, a.driver_name
      ORDER BY total_trips DESC
    `);
  },
  
  /* ---------------- DISPATCHER QUERIES ---------------- */
  
  getDispatchers: async () => {
    return pool.query(`SELECT * FROM Dispatcher ORDER BY dispatcher_id`);
  },
  
  createDispatcher: async (name, contact_number, role = 'dispatcher') => {
    return pool.query(
      `INSERT INTO Dispatcher (name, contact_number, role) VALUES ($1, $2, $3) RETURNING *`,
      [name, contact_number, role]
    );
  },
  
  /* ---------------- SPATIAL ANALYSIS QUERIES ---------------- */
  
  getCoverageAnalysis: async () => {
    // Analyze ambulance coverage areas using PostGIS
    return pool.query(`
      SELECT 
        a.ambulance_id,
        a.vehicle_number,
        ST_X(a.location::geometry) as longitude,
        ST_Y(a.location::geometry) as latitude,
        COUNT(h.hospital_id) as hospitals_within_10km,
        STRING_AGG(h.hospital_name, ', ' ORDER BY ST_Distance(a.location, h.location_geo)) as nearest_hospitals
      FROM Ambulance a
      LEFT JOIN Hospital h ON ST_DWithin(a.location, h.location_geo, 10000)
      WHERE a.status = 'active'
      GROUP BY a.ambulance_id, a.vehicle_number, a.location
    `);
  },
  
  findOptimalAmbulancePlacement: async () => {
    // Find areas with high emergency density but low ambulance coverage
    return pool.query(`
      SELECT 
        h.location as hotspot_location,
        h.emergency_count,
        COUNT(a.ambulance_id) as nearby_ambulances,
        STRING_AGG(a.vehicle_number, ', ') as nearby_ambulance_ids
      FROM (
        SELECT location, COUNT(*) as emergency_count
        FROM EmergencyRequest
        WHERE request_time >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY location
        HAVING COUNT(*) > 5
      ) h
      LEFT JOIN Ambulance a ON ST_DWithin(
        ST_SetSRID(ST_MakePoint(
          CAST(split_part(h.location, ',', 2) AS FLOAT),
          CAST(split_part(h.location, ',', 1) AS FLOAT)
        ), 4326)::geography,
        a.location,
        5000
      )
      GROUP BY h.location, h.emergency_count
      ORDER BY h.emergency_count DESC, nearby_ambulances ASC
      LIMIT 10
    `);
  }
};

module.exports = db;