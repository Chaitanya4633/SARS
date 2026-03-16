const { Pool } = require('pg');

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "chaitu",
  database: "ambulance_system",
});

async function checkDatabase() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Connected!\n');

    // Check tables
    console.log('📋 TABLES:');
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    tables.rows.forEach(t => console.log(`  - ${t.table_name}`));

    // Check counts
    console.log('\n📊 RECORD COUNTS:');
    for (const table of tables.rows) {
      const count = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`  ${table.table_name}: ${count.rows[0].count}`);
    }

    // Check PostGIS
    console.log('\n🌐 POSTGIS:');
    const postgis = await client.query(`SELECT PostGIS_Version()`);
    console.log(`  ${postgis.rows[0].postgis_version}`);

    client.release();
    console.log('\n✅ Database check complete!');
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    console.log('\n🔧 FIX:');
    console.log('1. Ensure PostgreSQL is running');
    console.log('2. Check password in db.js matches your postgres password');
    console.log('3. Create database: CREATE DATABASE ambulance_system;');
    console.log('4. Enable PostGIS: CREATE EXTENSION postgis;');
  } finally {
    pool.end();
  }
}

checkDatabase();
