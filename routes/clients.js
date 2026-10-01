const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const clientsController = require('../controllers/clientsController');

router.get('/', verifyToken, authorize('boss', 'seller'), clientsController.getAllClients);
router.get('/:id', verifyToken, authorize('boss', 'seller', 'customer'), clientsController.getClientById);
router.post('/', verifyToken, authorize('boss'), clientsController.createClient);
router.put('/:id', verifyToken, authorize('boss'), clientsController.updateClient);
router.delete('/:id', verifyToken, authorize('boss'), clientsController.deleteClient);

module.exports = router;