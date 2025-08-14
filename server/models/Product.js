const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'لطفا نام کالا را وارد کنید'],
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    history: [
        {
            type: { type: String, enum: ['ورود', 'خروج'] },
            quantity: Number,
            date: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model('Product', ProductSchema);