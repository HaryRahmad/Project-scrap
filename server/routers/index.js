/**
 * API Routes - All endpoints in one file
 */

const router = require('express').Router();

// Controllers
const AuthController = require('../controllers/authController');
const SettingsController = require('../controllers/settingsController');
const StockController = require('../controllers/stockController');
const MasterController = require('../controllers/masterController');

// Middleware
const auth = require('../middleware/authen');

// ============================================
// AUTH ROUTES (/api/auth)
// ============================================
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/me', auth, AuthController.getMe);

// ============================================
// SETTINGS ROUTES (/api/settings)
// ============================================
router.get('/settings', auth, SettingsController.getSettings);
router.put('/settings', auth, SettingsController.updateSettings);

// ============================================
// STOCK ROUTES (/api/stock)
// ============================================
router.get('/stock', auth, StockController.getStock);
router.get('/stock/all', StockController.getAllStock);
router.post('/stock/update', StockController.handleStockUpdate);
router.post('/stock/blocked', StockController.handleBlocked);

// ============================================
// MASTER DATA ROUTES (/api/master)
// ============================================
router.get('/master/boutiques', MasterController.getBoutiques);
router.get('/master/weights', MasterController.getWeights);

module.exports = router;

