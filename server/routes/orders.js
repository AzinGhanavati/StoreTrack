const express = require('express');
const {
    createOrder,
    getOrders,
    updateOrderStatus,
    getSalesReport
} = require('../controllers/orderController');

const router = express.Router();

router.route('/')
    .post(createOrder)
    .get(getOrders);
    
router.route('/sales-report').get(getSalesReport);

router.route('/:id/status').put(updateOrderStatus);

module.exports = router;
