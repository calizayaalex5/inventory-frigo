const { ObjectId } = require('mongodb');
const mongodb = require('../mongoConnect');

const filterProductByRole = (product, role) => {
    const result = { ...product };

    if (role !== 'boss') {
        delete result.cost;
    }
    if (role === 'warehouse') {
        delete result.price;
    }

    return result;
};

const getAllProducts = async (req, res) => {
    try {
        const products = await mongodb
            .getDatabase()
            .collection('products')
            .find()
            .toArray();

        const filtered = products.map(p => filterProductByRole(p, req.user.role));

        res.status(200).json(filtered);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const productId = new ObjectId(req.params.id);

        const product = await mongodb
            .getDatabase()
            .collection('products')
            .findOne({ _id: productId });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(filterProductByRole(product, req.user.role));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, price, cost, stock } = req.body;

        if (!name || price === undefined || cost === undefined) {
            return res.status(400).json({ message: 'Missing required fields: name, price, cost' });
        }

        const newProduct = {
            name,
            price,
            cost,
            stock: stock || [
                { store: 'Manuel Bulnes', quantity: 0 },
                { store: 'Barros Arana', quantity: 0 }
            ]
        };

        const result = await mongodb
            .getDatabase()
            .collection('products')
            .insertOne(newProduct);

        res.status(201).json({ _id: result.insertedId, ...newProduct });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const productId = new ObjectId(req.params.id);
        const { name, price, cost, stock } = req.body;

        const updatedFields = {};

        if (req.user.role === 'warehouse') {
            // Warehouse can ONLY update stock, regardless of what else is in the body
            if (stock !== undefined) updatedFields.stock = stock;
        } else {
            // boss can update everything
            if (name !== undefined) updatedFields.name = name;
            if (price !== undefined) updatedFields.price = price;
            if (cost !== undefined) updatedFields.cost = cost;
            if (stock !== undefined) updatedFields.stock = stock;
        }

        if (Object.keys(updatedFields).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update for your role' });
        }

        const result = await mongodb
            .getDatabase()
            .collection('products')
            .updateOne(
                { _id: productId },
                { $set: updatedFields }
            );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
const deleteProduct = async (req, res) => {
    try {
        const productId = new ObjectId(req.params.id);

        const result = await mongodb
            .getDatabase()
            .collection('products')
            .deleteOne({ _id: productId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};