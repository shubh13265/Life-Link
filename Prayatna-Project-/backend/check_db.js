const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'shubh'
});

connection.query('SHOW DATABASES', (err, results) => {
  if (err) { 
    console.error('Error connecting to MySQL:', err.message); 
    process.exit(1); 
  }
  
  const dbNames = results.map(r => r.Database);
  console.log('Available Databases:', dbNames.join(', '));
  
  const targetDb = dbNames.find(db => db.toLowerCase() === 'lifelink_dev');
  if (targetDb) {
    console.log(`\nFound schema: ${targetDb}`);
    connection.query(`USE ${targetDb}`, (err) => {
      if (err) { 
        console.error('Error selecting database:', err.message); 
        process.exit(1); 
      }
      connection.query('SHOW TABLES', (err, tables) => {
        if (err) { 
          console.error('Error showing tables:', err.message); 
          process.exit(1); 
        }
        if (tables.length > 0) {
          console.log('Tables inside schema:');
          tables.forEach(row => console.log('-', Object.values(row)[0]));
        } else {
          console.log('The schema is empty (no tables found).');
        }
        connection.end();
      });
    });
  } else {
    console.log('\n❌ Schema "lifeLink_dev" is NOT created yet.');
    connection.end();
  }
});
