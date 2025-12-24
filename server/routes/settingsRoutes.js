const router = require('express').Router();
const SettingsController = require('../controllers/settingsController');
const auth = require('../middlewares/auth');

// All routes require authentication
router.use(auth);

// GET /api/settings
router.get('/', SettingsController.getSettings);

// PUT /api/settings
router.put('/', SettingsController.updateSettings);

module.exports = router;
