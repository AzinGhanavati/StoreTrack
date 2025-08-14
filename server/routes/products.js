const express = require('express');
const {
    addProduct,
    getProducts,
    getLowStockReport,
    addStock
} = require('../controllers/productController');

const router = express.Router();

router.route('/')
    .post(addProduct)
    .get(getProducts);

router.route('/low-stock').get(getLowStockReport);
router.route('/:id/add-stock').put(addStock);

module.exports = router;