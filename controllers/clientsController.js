const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const mongodb = require('../mongoConnect');

const getAllClients = async (req, res) => {
    try {
        const clients = await mongodb
            .getDatabase()
            .collection('clients')
            .find()
            .toArray();

        res.status(200).json(clients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getClientById = async (req, res) => {
    try {
        const clientId = new ObjectId(req.params.id);

        const client = await mongodb
            .getDatabase()
            .collection('clients')
            .findOne({ _id: clientId });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Customers can only view their own record
        if (req.user.role === 'customer' && client.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: 'You can only view your own client record' });
        }

        res.status(200).json(client);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Creates BOTH the login user (role: customer) and the client business record together
const createClient = async (req, res) => {
    try {
        const {
            email, password,
            firstName, lastName,
            address1, address2,
            district1, district2,
            phone1, phone2,
            personalId, companyId, companyName
        } = req.body;

        if (!email || !password || !firstName || !lastName || !personalId) {
            return res.status(400).json({
                message: 'Missing required fields: email, password, firstName, lastName, personalId'
            });
        }

        const db = mongodb.getDatabase();
        const usersCollection = db.collection('users');
        const clientsCollection = db.collection('clients');

        const existing = await usersCollection.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'A user with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { email, password: hashedPassword, role: 'customer' };
        const userResult = await usersCollection.insertOne(newUser);

        const newClient = {
            userId: userResult.insertedId,
            firstName,
            lastName,
            address1,
            address2: address2 || null,
            district1,
            district2: district2 || null,
            phone1,
            phone2: phone2 || null,
            email,
            personalId,
            companyId: companyId || null,
            companyName: companyName || null
        };

        const clientResult = await clientsCollection.insertOne(newClient);

        res.status(201).json({ _id: clientResult.insertedId, ...newClient });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateClient = async (req, res) => {
    try {
        const clientId = new ObjectId(req.params.id);
        const {
            firstName, lastName,
            address1, address2,
            district1, district2,
            phone1, phone2,
            companyId, companyName
        } = req.body;

        const updatedFields = {};
        if (firstName !== undefined) updatedFields.firstName = firstName;
        if (lastName !== undefined) updatedFields.lastName = lastName;
        if (address1 !== undefined) updatedFields.address1 = address1;
        if (address2 !== undefined) updatedFields.address2 = address2;
        if (district1 !== undefined) updatedFields.district1 = district1;
        if (district2 !== undefined) updatedFields.district2 = district2;
        if (phone1 !== undefined) updatedFields.phone1 = phone1;
        if (phone2 !== undefined) updatedFields.phone2 = phone2;
        if (companyId !== undefined) updatedFields.companyId = companyId;
        if (companyName !== undefined) updatedFields.companyName = companyName;

        const result = await mongodb
            .getDatabase()
            .collection('clients')
            .updateOne({ _id: clientId }, { $set: updatedFields });

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.status(200).json({ message: 'Client updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteClient = async (req, res) => {
    try {
        const clientId = new ObjectId(req.params.id);

        const db = mongodb.getDatabase();
        const client = await db.collection('clients').findOne({ _id: clientId });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        await db.collection('clients').deleteOne({ _id: clientId });
        await db.collection('users').deleteOne({ _id: client.userId });

        res.status(200).json({ message: 'Client deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient
};