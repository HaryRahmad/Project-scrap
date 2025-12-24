const router = require('express').Router();
const LocationController = require('../controllers/locationController');

// GET /api/locations - Get all available locations
router.get('/', LocationController.getAllLocations);

module.exports = router;
