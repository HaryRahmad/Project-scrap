// Fix migration script - run with: node fix_migration.js
const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;

async function run() {
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    logging: console.log
  });

  try {
    // Insert old migration record
    await sequelize.query(`
      INSERT INTO "SequelizeMeta" (name) 
      VALUES ('20241230051500-add-telegram-username.js') 
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Fixed migration record');
    
    // Close connection
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

run();
