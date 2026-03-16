require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  },
});

app.use(cors());
app.use(bodyParser.json());

/* ---------------- POSTGRES CONNECTION ---------------- */

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "chaitu",
  database: "ambulance_system",
});

pool.connect()
  .then(() => console.log("PostgreSQL Connected"))
  .catch(err => console.error("PostgreSQL Error:", err));

/* ---------------- SOCKET.IO REAL-TIME EVENTS ---------------- */

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("ambulance_location_update", async (data) => {
    const { ambulance_id, latitude, longitude, speed } = data;
    try {
      await pool.query(
        `INSERT INTO GPSTracking (ambulance_id, latitude, longitude, speed, last_updated)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (ambulance_id) 
         DO UPDATE SET latitude = $2, longitude = $3, speed = $4, last_updated = CURRENT_TIMESTAMP`,
        [ambulance_id, latitude, longitude, speed || 0]
      );

      await pool.query(
        `UPDATE Ambulance 
         SET location = ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
             current_location = $3 || ', ' || $2,
             last_updated = CURRENT_TIMESTAMP
         WHERE ambulance_id = $4`,
        [latitude, longitude, latitude + ',' + longitude, ambulance_id]
      );

      io.emit("ambulance_location_update", {
        ambulance_id, latitude, longitude, speed, timestamp: new Date()
      });
    } catch (err) {
      console.error("Error updating location:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

/* ---------------- MODULE 1: ADMIN ---------------- */

app.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      `SELECT * FROM Dispatcher WHERE name = $1 AND contact_number = $2 AND role = 'admin'`,
      [username, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.json({ success: true, admin: result.rows[0], token: `admin_token_${result.rows[0].dispatcher_id}` });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/admin/create-dispatcher", async (req, res) => {
  try {
    const { name, contact_number, role = 'dispatcher' } = req.body;
    const result = await pool.query(
      `INSERT INTO Dispatcher (name, contact_number, role) VALUES ($1, $2, $3) RETURNING *`,
      [name, contact_number, role]
    );
    res.json({ success: true, dispatcher: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/admin/add-ambulance", async (req, res) => {
  try {
    const { vehicle_number, driver_name, status = 'active', latitude, longitude } = req.body;
    let locationQuery = latitude && longitude ? 
      `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography` : 'NULL';
    
    const result = await pool.query(
      `INSERT INTO Ambulance (vehicle_number, driver_name, status, location, current_location)
       VALUES ($1, $2, $3, ${locationQuery}, $4) RETURNING *`,
      [vehicle_number, driver_name, status, latitude && longitude ? `${latitude}, ${longitude}` : null]
    );
    res.json({ success: true, ambulance: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/admin/add-hospital", async (req, res) => {
  try {
    const { hospital_name, location, capacity, emergency_facility = true, latitude, longitude } = req.body;
    let locationQuery = latitude && longitude ? 
      `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography` : 'NULL';
    
    const result = await pool.query(
      `INSERT INTO Hospital (hospital_name, location, capacity, emergency_facility, current_patients, location_geo)
       VALUES ($1, $2, $3, $4, 0, ${locationQuery}) RETURNING *`,
      [hospital_name, location, capacity, emergency_facility]
    );
    res.json({ success: true, hospital: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/admin/analytics", async (req, res) => {
  try {
    const activeEmergencies = await pool.query(
      `SELECT COUNT(*) as count FROM EmergencyRequest WHERE status IN ('active', 'assigned', 'en_route')`
    );
    const activeAmbulances = await pool.query(
      `SELECT COUNT(*) as count FROM Ambulance WHERE status = 'active'`
    );
    const availableHospitals = await pool.query(
      `SELECT COUNT(*) as count FROM Hospital WHERE emergency_facility = true`
    );
    const avgResponseTime = await pool.query(
      `SELECT AVG(response_time) as avg_time FROM EmergencyRequest WHERE response_time IS NOT NULL`
    );

    res.json({
      activeEmergencies: parseInt(activeEmergencies.rows[0].count),
      activeAmbulances: parseInt(activeAmbulances.rows[0].count),
      availableHospitals: parseInt(availableHospitals.rows[0].count),
      avgResponseTime: Math.round(avgResponseTime.rows[0].avg_time || 0)
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/* ---------------- MODULE 2: EMERGENCY REQUEST ---------------- */

app.post("/request", async (req, res) => {
  try {
    const { patient_name, emergency_type, severity_level, location, latitude, longitude, phone } = req.body;
    const result = await pool.query(
      `INSERT INTO EmergencyRequest (patient_name, emergency_type, severity_level, location, status, request_time, latitude, longitude, phone)
       VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP, $5, $6, $7) RETURNING *`,
      [patient_name, emergency_type, severity_level, location, latitude, longitude, phone]
    );
    const emergency = result.rows[0];
    io.emit("new_emergency", emergency);
    if (latitude && longitude) {
      setTimeout(() => assignNearestAmbulance(emergency.request_id, latitude, longitude), 1000);
    }
    res.json({ success: true, emergency });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/requests", async (req, res) => {
  try {
    const { limit = 100, status } = req.query;
    let query = `SELECT * FROM EmergencyRequest`;
    const params = [];
    if (status) {
      query += ` WHERE status = $1`;
      params.push(status);
    }
    query += ` ORDER BY request_time DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.patch("/request/status", async (req, res) => {
  try {
    const { request_id, status, ambulance_id, response_time } = req.body;
    const result = await pool.query(
      `UPDATE EmergencyRequest 
       SET status = $2, ambulance_id = COALESCE($3, ambulance_id), response_time = COALESCE($4, response_time)
       WHERE request_id = $1 RETURNING *`,
      [request_id, status, ambulance_id, response_time]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Emergency request not found" });
    }
    const updated = result.rows[0];
    io.emit("emergency_status_update", updated);
    if (status === 'assigned' && ambulance_id) {
      io.emit("ambulance_assigned", { request_id, ambulance_id });
    }
    res.json({ success: true, emergency: updated });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

async function assignNearestAmbulance(requestId, latitude, longitude) {
  try {
    const nearestResult = await pool.query(
      `SELECT ambulance_id, vehicle_number, driver_name,
       ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 AS distance_km
       FROM Ambulance WHERE status = 'active'
       ORDER BY location <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography LIMIT 1`,
      [latitude, longitude]
    );
    if (nearestResult.rows.length === 0) {
      console.log("No available ambulances for emergency", requestId);
      return;
    }
    const ambulance = nearestResult.rows[0];
    await pool.query(
      `UPDATE EmergencyRequest SET status = 'assigned', ambulance_id = $2 WHERE request_id = $1`,
      [requestId, ambulance.ambulance_id]
    );
    await pool.query(
      `UPDATE Ambulance SET status = 'busy', current_emergency = $2 WHERE ambulance_id = $1`,
      [ambulance.ambulance_id, requestId]
    );
    io.emit("ambulance_assigned", {
      request_id: requestId, ambulance_id: ambulance.ambulance_id,
      vehicle_number: ambulance.vehicle_number, driver_name: ambulance.driver_name,
      distance: Math.round(ambulance.distance_km * 10) / 10
    });
    notifyNearestHospital(requestId, latitude, longitude);
  } catch (err) {
    console.error("Auto-assign error:", err);
  }
}

/* ---------------- MODULE 3: AMBULANCE MANAGEMENT ---------------- */

app.get("/ambulances", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude, g.speed
       FROM Ambulance a LEFT JOIN GPSTracking g ON a.ambulance_id = g.ambulance_id ORDER BY a.ambulance_id`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.patch("/ambulance/status", async (req, res) => {
  try {
    const { ambulance_id, status } = req.body;
    const result = await pool.query(
      `UPDATE Ambulance SET status = $2, current_emergency = CASE WHEN $2 = 'active' THEN NULL ELSE current_emergency END
       WHERE ambulance_id = $1 RETURNING *`,
      [ambulance_id, status]
    );
    res.json({ success: true, ambulance: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/ambulance/update-location", async (req, res) => {
  try {
    const { ambulance_id, latitude, longitude, speed = 0 } = req.body;
    await pool.query(
      `UPDATE Ambulance SET location = ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
       current_location = $3 || ', ' || $2, last_updated = CURRENT_TIMESTAMP WHERE ambulance_id = $4`,
      [latitude, longitude, latitude, ambulance_id]
    );
    await pool.query(
      `INSERT INTO GPSTracking (ambulance_id, latitude, longitude, speed, last_updated)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (ambulance_id) DO UPDATE SET latitude = $2, longitude = $3, speed = $4, last_updated = CURRENT_TIMESTAMP`,
      [ambulance_id, latitude, longitude, speed]
    );
    io.emit("ambulance_location_update", { ambulance_id, latitude, longitude, speed, timestamp: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/nearest", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const result = await pool.query(
      `SELECT ambulance_id, vehicle_number, driver_name,
       ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 AS distance_km
       FROM Ambulance WHERE status = 'active'
       ORDER BY location <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography LIMIT 1`,
      [lat, lng]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No available ambulances" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/* ---------------- MODULE 6: HOSPITAL MANAGEMENT ---------------- */

app.get("/hospitals", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *, ST_X(location_geo::geometry) as longitude, ST_Y(location_geo::geometry) as latitude
       FROM Hospital ORDER BY hospital_id`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/hospital/update-capacity", async (req, res) => {
  try {
    const { hospital_id, current_patients } = req.body;
    const result = await pool.query(
      `UPDATE Hospital SET current_patients = $2 WHERE hospital_id = $1 RETURNING *`,
      [hospital_id, current_patients]
    );
    res.json({ success: true, hospital: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

async function notifyNearestHospital(emergencyId, latitude, longitude) {
  try {
    const nearestHospital = await pool.query(
      `SELECT hospital_id, hospital_name, location FROM Hospital
       WHERE emergency_facility = true AND current_patients < capacity
       ORDER BY location_geo <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography LIMIT 1`,
      [latitude, longitude]
    );
    if (nearestHospital.rows.length === 0) {
      console.log("No available hospitals with emergency facility");
      return;
    }
    const hospital = nearestHospital.rows[0];
    io.emit("hospital_notification", {
      emergency_id: emergencyId, hospital_id: hospital.hospital_id,
      hospital_name: hospital.hospital_name, message: `Incoming patient from emergency #${emergencyId}`,
      timestamp: new Date()
    });
  } catch (err) {
    console.error("Notify hospital error:", err);
  }
}

app.post("/hospital/notify", async (req, res) => {
  try {
    const { hospital_id, emergency_id, message } = req.body;
    io.emit("hospital_notification", { emergency_id, hospital_id, message, timestamp: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/* ---------------- MODULE 5: ROUTE OPTIMIZATION ---------------- */

app.get("/route/optimal", async (req, res) => {
  try {
    const { ambulance_id, emergency_id, destination_lat, destination_lng } = req.query;
    const ambulanceResult = await pool.query(
      `SELECT ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude
       FROM Ambulance WHERE ambulance_id = $1`, [ambulance_id]
    );
    if (ambulanceResult.rows.length === 0) {
      return res.status(404).json({ error: "Ambulance not found" });
    }
    const origin = ambulanceResult.rows[0];
    let destination;
    if (emergency_id) {
      const emergencyResult = await pool.query(
        `SELECT latitude, longitude FROM EmergencyRequest WHERE request_id = $1`, [emergency_id]
      );
      if (emergencyResult.rows.length === 0) {
        return res.status(404).json({ error: "Emergency not found" });
      }
      destination = emergencyResult.rows[0];
    } else if (destination_lat && destination_lng) {
      destination = { latitude: destination_lat, longitude: destination_lng };
    } else {
      return res.status(400).json({ error: "Destination required" });
    }

    try {
      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
      const osrmResponse = await axios.get(osrmUrl, { timeout: 5000 });
      if (osrmResponse.data.routes && osrmResponse.data.routes.length > 0) {
        const route = osrmResponse.data.routes[0];
        await pool.query(
          `INSERT INTO RouteOptimization (ambulance_id, emergency_id, route_geometry, estimated_time, distance, traffic_data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
           ON CONFLICT (ambulance_id, emergency_id) DO UPDATE 
           SET route_geometry = $3, estimated_time = $4, distance = $5, traffic_data = $6, created_at = CURRENT_TIMESTAMP`,
          [ambulance_id, emergency_id, JSON.stringify(route.geometry), Math.round(route.duration / 60), Math.round(route.distance / 1000), JSON.stringify({ legs: route.legs })]
        );
        res.json({
          coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
          duration: Math.round(route.duration / 60), distance: Math.round(route.distance / 1000), geometry: route.geometry
        });
      } else {
        throw new Error("No route found");
      }
    } catch (osrmError) {
      const directDistance = calculateDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
      res.json({
        coordinates: [[origin.latitude, origin.longitude], [destination.latitude, destination.longitude]],
        duration: Math.round(directDistance / 40 * 60), distance: Math.round(directDistance),
        geometry: null, note: "Direct route (OSRM unavailable)"
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Route calculation failed" });
  }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/* ---------------- SERVER STARTUP ---------------- */

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Smart Ambulance Routing System Server running on port ${PORT}`);
});