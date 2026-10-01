const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const productsController = require('../controllers/productsController');

router.get('/', verifyToken, productsController.getAllProducts);
router.get('/:id', verifyToken, productsController.getProductById);
router.post('/', verifyToken, authorize('boss'), productsController.createProduct);
router.put('/:id', verifyToken, authorize('boss', 'warehouse'), productsController.updateProduct);
router.delete('/:id', verifyToken, authorize('boss'), productsController.deleteProduct);

module.exports = router;