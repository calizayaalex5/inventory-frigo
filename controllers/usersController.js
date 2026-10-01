const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongodb = require('../mongoConnect');

const getAllUsers = async (req, res) => {
    try {
        const users = await mongodb
            .getDatabase()
            .collection('users')
            .find()
            .project({ password: 0 })  // never return password hashes
            .toArray();

        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const userId = new ObjectId(req.params.id);

        const user = await mongodb
            .getDatabase()
            .collection('users')
            .findOne({ _id: userId }, { projection: { password: 0 } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Used for staff roles (boss, seller, warehouse) created directly by the boss.
// Customers are created through POST /clients instead (creates user + client together).
const createUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const validRoles = ['boss', 'seller', 'warehouse'];

        if (!email || !password || !validRoles.includes(role)) {
            return res.status(400).json({ message: 'Missing or invalid fields: email, password, role' });
        }

        const db = mongodb.getDatabase();
        const existing = await db.collection('users').findOne({ email });

        if (existing) {
            return res.status(409).json({ message: 'A user with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = { email, password: hashedPassword, role };

        const result = await db.collection('users').insertOne(newUser);

        res.status(201).json({ _id: result.insertedId, email, role });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const userId = new ObjectId(req.params.id);
        const { email, password, role } = req.body;

        const updatedFields = {};
        if (email !== undefined) updatedFields.email = email;
        if (role !== undefined) updatedFields.role = role;
        if (password !== undefined) updatedFields.password = await bcrypt.hash(password, 10);

        const result = await mongodb
            .getDatabase()
            .collection('users')
            .updateOne({ _id: userId }, { $set: updatedFields });

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = new ObjectId(req.params.id);

        const result = await mongodb
            .getDatabase()
            .collection('users')
            .deleteOne({ _id: userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await mongodb
            .getDatabase()
            .collection('users')
            .findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({ token, role: user.role });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    login
};