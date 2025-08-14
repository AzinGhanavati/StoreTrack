const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['در انتظار', 'ارسال شده', 'لغو شده'],
        default: 'در انتظار'
    }
});

module.exports = mongoose.model('Order', OrderSchema);