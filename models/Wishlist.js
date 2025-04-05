const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
    buyerEmail: { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    price: Number
});

module.exports = mongoose.model('Wishlist', WishlistSchema);
