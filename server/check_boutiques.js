// Check boutiques table
const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;

async function checkBoutiques() {
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    logging: false
  });

  try {
    const [results] = await sequelize.query(`
      SELECT location_id, city, name FROM boutiques ORDER BY location_id
    `);
    
    console.log('Boutiques in database:');
    console.log(JSON.stringify(results, null, 2));
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBoutiques();
