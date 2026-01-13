// Check user settings locations
const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;

async function checkLocations() {
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    logging: false
  });

  try {
    // Query user_settings directly
    const [results] = await sequelize.query(`
      SELECT id, user_id, location_id, location_ids, is_active 
      FROM user_settings 
      WHERE is_active = true
    `);
    
    console.log('Active User Settings:');
    console.log(JSON.stringify(results, null, 2));
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkLocations();
