# Smart Ambulance Routing System (SARS)

A complete production-ready Smart Ambulance Routing System with real-time tracking, route optimization, and multi-platform support.

## System Overview

SARS addresses critical issues in emergency response:
- **Delayed ambulance response** → Real-time GPS tracking with nearest ambulance auto-assignment
- **Inefficient routing** → OSRM-based optimal route calculation with PostGIS spatial queries
- **Poor coordination** → Web dashboard, mobile apps, and real-time Socket.io events

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │     │    Backend API  │     │  Web Dashboard  │
│  (React Native) │◄───►│  (Node.js/Ex.)  │◄───►│   (React.js)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                           │
                    ┌──────────────┐
                    │   PostgreSQL  │
                    │  + PostGIS   │
                    └──────────────┘
```

## Project Structure

```
SARS/
├── backend/              # Node.js + Express API
│   ├── server.js        # Main server with all modules
│   ├── db.js            # PostgreSQL queries with PostGIS
│   └── package.json
├── mobile-app/          # React Native with Expo
│   ├── App.js           # Navigation setup
│   ├── screens/         # All screen components
│   └── package.json
├── web-dashboard/       # React.js dashboard
│   ├── src/
│   │   ├── App.js       # Router and layout
│   │   ├── components/  # Reusable components
│   │   └── pages/       # Dashboard pages
│   └── package.json
└── README.md
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js, Express, Socket.io |
| Database | PostgreSQL 15, PostGIS 3.4 |
| Mobile | React Native, Expo, Maps |
| Web | React.js, Leaflet, Recharts |
| Routing | OSRM API / OpenStreetMap |
| Real-time | Socket.io |

## Prerequisites

- **Node.js** 18+ and npm/yarn
- **PostgreSQL** 15+ with PostGIS extension
- **Expo CLI** for mobile (`npm install -g expo-cli`)

## Installation & Setup

### 1. Database Setup

```sql
-- Create database
CREATE DATABASE ambulance_system;

-- Enable PostGIS
CREATE EXTENSION postgis;

-- Run the provided SQL schema to create tables
-- (Assumes existing schema: Ambulance, Hospital, EmergencyRequest, GPSTracking, RouteOptimization, Dispatcher, Admin)
```

Database credentials (update in `backend/db.js`):
- Host: localhost
- Port: 5432
- User: postgres
- Password: chaitu
- Database: ambulance_system

### 2. Backend Setup

```bash
cd backend
npm install
npm start          # Production
npm run dev        # Development with nodemon
```

Server runs on `http://localhost:5001`

**Key API Endpoints:**
- `POST /request` - Register emergency
- `GET /ambulances` - List all ambulances
- `GET /route/optimal` - Calculate optimal route
- `GET /admin/analytics` - System analytics

### 3. Web Dashboard Setup

```bash
cd web-dashboard
npm install
npm start
```

Dashboard runs on `http://localhost:3000`

**Dashboard Pages:**
- Dashboard - Live stats, map, recent emergencies
- Emergency Requests - Manage and dispatch emergencies
- Ambulance Tracking - Real-time ambulance locations
- Fleet Management - Add/edit ambulances
- Hospitals - Manage hospital capacities
- Reports - Analytics and statistics

### 4. Mobile App Setup

```bash
cd mobile-app
npm install

# Update SERVER_URL in screen files to your backend IP
# Default: http://192.168.1.100:5001

expo start
# Scan QR code with Expo Go app (iOS/Android)
```

**Mobile Screens:**
- Driver Login - Authenticate ambulance drivers
- Driver Home - View assigned emergencies, update status
- Driver Navigation - Live GPS tracking, route optimization
- Emergency Registration - Report new emergencies
- Dispatcher Dashboard - Monitor and assign emergencies

## PostGIS Spatial Queries

The system uses advanced PostGIS functions:

```sql
-- Find nearest ambulance using KNN search
SELECT ambulance_id, 
       ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 AS distance_km
FROM Ambulance
WHERE status = 'active'
ORDER BY location <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
LIMIT 1;

-- Find ambulances within radius
SELECT * FROM Ambulance
WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3 * 1000);
```

## Socket.io Real-Time Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `ambulance_location_update` | Client → Server | Driver GPS updates |
| `ambulance_assigned` | Server → Client | New assignment notification |
| `new_emergency` | Server → Client | New emergency broadcast |
| `emergency_status_update` | Bidirectional | Status changes |
| `hospital_notification` | Server → Client | Hospital alerts |

## Environment Variables (Optional)

Create `.env` in backend folder:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=chaitu
DB_NAME=ambulance_system
SERVER_PORT=5001
OSRM_URL=http://router.project-osrm.org
```

## Production Deployment

### Backend
```bash
cd backend
npm install --production
npm start
# Use PM2 or systemd for process management
```

### Web Dashboard
```bash
cd web-dashboard
npm run build
# Serve build/ folder with nginx or similar
```

### Mobile App
```bash
cd mobile-app
expo build:android   # Build APK
expo build:ios       # Build for iOS (requires Mac + Apple Dev account)
```

## Key Features

1. **Automatic Emergency Assignment** - System finds and assigns nearest available ambulance
2. **Route Optimization** - OSRM API calculates fastest routes considering traffic
3. **Real-time Tracking** - Live GPS updates every 5 seconds
4. **Hospital Integration** - Automatic nearest hospital selection with capacity checks
5. **Analytics Dashboard** - Response times, utilization rates, emergency patterns
6. **Multi-role Support** - Admin, Dispatcher, Driver, and Public interfaces

## Troubleshooting

**Database connection errors:**
- Verify PostgreSQL is running: `pg_ctl status`
- Check credentials in `backend/db.js`
- Ensure PostGIS is installed: `SELECT PostGIS_Version();`

**Mobile can't connect to backend:**
- Update `SERVER_URL` in all screen files to your machine's IP address
- Ensure firewall allows port 5001
- Backend and mobile must be on same network

**OSRM routing fails:**
- System falls back to direct distance calculation
- For production, consider self-hosting OSRM or using Mapbox

## License

MIT License - Free for personal and commercial use.

## Support

For issues or questions, contact the development team or create an issue in the repository.

---

**Built with** Node.js, React, React Native, PostgreSQL, PostGIS, Socket.io, and OpenStreetMap.
