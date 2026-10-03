const { ObjectId } = require('mongodb');
const mongodb = require('../mongoConnect');

const getAllSales = async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === 'seller') {
            filter = { sellerId: new ObjectId(req.user.userId) };
        } else if (req.user.role === 'customer') {
            filter = { customerId: new ObjectId(req.user.userId) };
        }
        // boss sees everything — filter stays empty

        const sales = await mongodb
            .getDatabase()
            .collection('sales')
            .find(filter)
            .toArray();

        res.status(200).json(sales);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getSaleById = async (req, res) => {
    try {
        const saleId = new ObjectId(req.params.id);

        const sale = await mongodb
            .getDatabase()
            .collection('sales')
            .findOne({ _id: saleId });

        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        res.status(200).json(sale);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createSale = async (req, res) => {
    try {
        const { customerId, sellerId, store, products, paymentType, paymentMethod } = req.body;

        if (!customerId || !sellerId || !store || !products || !products.length || !paymentType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const db = mongodb.getDatabase();
        const productsCollection = db.collection('products');

        const saleItems = [];
        
        for (const item of products) {
            const product = await productsCollection.findOne({ _id: new ObjectId(item.productId) });

            if (!product) {
                return res.status(404).json({ message: `Product ${item.productId} not found` });
            }

            const storeStock = product.stock.find(s => s.store === store);

            if (!storeStock || storeStock.quantity < item.quantity) {
                return res.status(400).json({
                    message: `Not enough stock for product "${product.name}" in store "${store}"`
                });
            }

            const subtotal = product.price * item.quantity;

            saleItems.push({
                productId: product._id,
                quantity: item.quantity,
                unitPrice: product.price,
                subtotal
            });
        }

        for (const item of saleItems) {
            await productsCollection.updateOne(
                { _id: item.productId, "stock.store": store },
                { $inc: { "stock.$.quantity": -item.quantity } }
            );
        }

        const total = saleItems.reduce((sum, item) => sum + item.subtotal, 0);

        const newSale = {
            customerId: new ObjectId(customerId),
            sellerId: new ObjectId(sellerId),
            store,
            products: saleItems,
            total,
            paymentType,
            paymentMethod: paymentType === 'cash' ? paymentMethod : null,
            date: new Date()
        };

        const result = await db.collection('sales').insertOne(newSale);

        res.status(201).json({ _id: result.insertedId, ...newSale });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateSale = async (req, res) => {
    try {
        const saleId = new ObjectId(req.params.id);
        const { paymentType, paymentMethod } = req.body;

        const updatedFields = {};
        if (paymentType !== undefined) updatedFields.paymentType = paymentType;
        if (paymentMethod !== undefined) updatedFields.paymentMethod = paymentMethod;

        const result = await mongodb
            .getDatabase()
            .collection('sales')
            .updateOne({ _id: saleId }, { $set: updatedFields });

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        res.status(200).json({ message: 'Sale updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteSale = async (req, res) => {
    try {
        const saleId = new ObjectId(req.params.id);

        const result = await mongodb
            .getDatabase()
            .collection('sales')
            .deleteOne({ _id: saleId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        res.status(200).json({ message: 'Sale deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllSales,
    getSaleById,
    createSale,
    updateSale,
    deleteSale
};