const { Pool } = require('pg');

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "chaitu",
  database: "ambulance_system",
});

const seedData = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add Vijayawada ambulances (AP registration)
    await client.query(`
      INSERT INTO Ambulance (vehicle_number, driver_name, status, location, current_location)
      VALUES 
        ('AP-16-BZ-1234', 'Raju', 'active', ST_SetSRID(ST_MakePoint(80.6480, 16.5062), 4326)::geography, 'Benz Circle, Vijayawada'),
        ('AP-16-IB-5678', 'Kiran', 'active', ST_SetSRID(ST_MakePoint(80.5500, 16.6500), 4326)::geography, 'Ibrahimpatnam'),
        ('AP-16-PK-9012', 'Prasad', 'available', ST_SetSRID(ST_MakePoint(80.6700, 16.4700), 4326)::geography, 'Poranki'),
        ('AP-16-TG-3456', 'Venkatesh', 'active', ST_SetSRID(ST_MakePoint(80.6000, 16.4800), 4326)::geography, 'Tadigadapa'),
        ('AP-16-KK-7890', 'Suresh', 'active', ST_SetSRID(ST_MakePoint(80.4800, 16.5300), 4326)::geography, 'Kankipadu'),
        ('AP-16-VC-1111', 'Ramesh', 'available', ST_SetSRID(ST_MakePoint(80.6200, 16.5200), 4326)::geography, 'Vijayawada Central')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Vijayawada Ambulances added');

    // Add Vijayawada area hospitals
    await client.query(`
      INSERT INTO Hospital (hospital_name, location, capacity, emergency_facility)
      VALUES 
        ('Andhra Hospital', 'Benz Circle, Vijayawada', 400, true),
        ('Ramesh Hospitals', 'Ibrahimpatnam, Vijayawada', 300, true),
        ('Siddhartha Medical College', 'Tadigadapa, Vijayawada', 500, true),
        ('Kamineni Hospital', 'Poranki, Vijayawada', 350, true),
        ('City Cancer Center', 'Kankipadu, Vijayawada', 200, true),
        ('Vijayawada Government Hospital', 'Governorpet, Vijayawada', 600, true),
        ('Trust Hospital', 'Patamata, Vijayawada', 250, true),
        ('Vamsi Hospital', 'Moghalrajpuram, Vijayawada', 150, true)
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Vijayawada Hospitals added');

    // Add dispatcher
    await client.query(`
      INSERT INTO Dispatcher (name, contact_number)
      VALUES ('Vijayawada Control Room', '0866-2412345')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Dispatcher added');

    await client.query('COMMIT');
    console.log('\n✅ Vijayawada data seeded!');
    console.log('👉 Refresh web dashboard to see 6 ambulances and 8 hospitals');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
};

seedData();
