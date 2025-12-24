const router = require('express').Router();
const authRoutes = require('./authRoutes');
const settingsRoutes = require('./settingsRoutes');
const stockRoutes = require('./stockRoutes');
const locationRoutes = require('./locationRoutes');

router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);
router.use('/stock', stockRoutes);
router.use('/locations', locationRoutes);

module.exports = router;
