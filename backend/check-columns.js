const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 4201,
  user: 'supervision_user',
  password: 'supervision_password',
  database: 'supervision_maintenance',
});

async function checkColumns() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'interventions'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Interventions table columns:');
    console.log('================================');
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(30)} ${row.data_type.padEnd(20)} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check for new columns
    const newColumns = ['hasIntervention', 'hasPerteProduction', 'hasPerteCommunication', 'rapportAttendu', 'rapportRecu'];
    console.log('\n🔍 Checking for new toggle columns:');
    console.log('====================================');
    newColumns.forEach(col => {
      const exists = result.rows.find(row => row.column_name === col);
      console.log(`${col.padEnd(30)} ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkColumns();
