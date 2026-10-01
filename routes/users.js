const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const usersController = require('../controllers/usersController');

router.post('/login', usersController.login); // public — no token needed

router.get('/', verifyToken, authorize('boss'), usersController.getAllUsers);
router.get('/:id', verifyToken, authorize('boss'), usersController.getUserById);
router.post('/', verifyToken, authorize('boss'), usersController.createUser);
router.put('/:id', verifyToken, authorize('boss'), usersController.updateUser);
router.delete('/:id', verifyToken, authorize('boss'), usersController.deleteUser);

module.exports = router;