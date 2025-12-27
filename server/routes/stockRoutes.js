const router = require('express').Router();
const StockController = require('../controllers/stockController');
const auth = require('../middlewares/auth');

// GET /api/stock - Get stock status for user's location
router.get('/', auth, StockController.getStock);

// GET /api/stock/all - Get all cached stock (admin)
router.get('/all', StockController.getAllStock);

// POST /api/stock/update - Receive stock update from Checker
router.post('/update', StockController.handleStockUpdate);

// POST /api/stock/blocked - Receive blocked notification from Checker
router.post('/blocked', StockController.handleBlocked);

module.exports = router;

