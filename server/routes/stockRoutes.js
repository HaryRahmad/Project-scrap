const router = require('express').Router();
const StockController = require('../controllers/stockController');
const auth = require('../middlewares/auth');

// GET /api/stock - Get stock status for user's location
router.get('/', auth, StockController.getStock);

// GET /api/stock/all - Get all cached stock (admin)
router.get('/all', StockController.getAllStock);

module.exports = router;
