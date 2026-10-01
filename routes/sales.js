const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const salesController = require('../controllers/salesController');

router.get('/', verifyToken, authorize('boss', 'seller', 'customer'), salesController.getAllSales);
router.get('/:id', verifyToken, authorize('boss', 'seller', 'customer'), salesController.getSaleById);
router.post('/', verifyToken, authorize('seller'), salesController.createSale);
router.put('/:id', verifyToken, authorize('boss'), salesController.updateSale);
router.delete('/:id', verifyToken, authorize('boss'), salesController.deleteSale);

module.exports = router;