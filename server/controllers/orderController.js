const Order = require('../models/Order');
const Product = require('../models/Product');

// ثبت سفارش
exports.createOrder = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, error: 'کالا یافت نشد' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ success: false, error: 'موجودی کالا کافی نیست' });
        }

        // کاهش موجودی
        product.stock -= quantity;
        product.history.push({ type: 'خروج', quantity: quantity, date: new Date() });
        await product.save();

        const order = await Order.create({
            product: productId,
            quantity,
            totalPrice: product.price * quantity
        });

        res.status(201).json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// دریافت سفارشات و فیلتر کردن
exports.getOrders = async (req, res) => {
    try {
        const { status, productName } = req.query;

        const pipeline = [];

        // برای دسترسی به نام کالا، باید دو جدول را به هم متصل کنیم
        pipeline.push({
            $lookup: {
                from: 'products',
                localField: 'product',
                foreignField: '_id',
                as: 'product'
            }
        });
        pipeline.push({ $unwind: '$product' });

        // مرحله فیلتر کردن
        const matchStage = {};
        if (status) {
            matchStage.status = status;
        }
        if (productName) {
            // فیلتر بر اساس نام کالا
            matchStage['product.name'] = { $regex: productName, $options: 'i' };
        }
        
        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        pipeline.push({ $sort: { orderDate: -1 } });

        const orders = await Order.aggregate(pipeline);
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// exports.getOrders = async (req, res) => {
//     try {
//         let query;
//         let queryStr = JSON.stringify(req.query);
//         queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
        
//         query = Order.find(JSON.parse(queryStr)).populate('product', 'name category');

//         const orders = await query;
//         res.status(200).json({ success: true, count: orders.length, data: orders });
//     } catch (err) {
//         res.status(400).json({ success: false, error: err.message });
//     }
// };

// تغییر وضعیت سفارش

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, {
            new: true,
            runValidators: true
        });

        if (!order) {
            return res.status(404).json({ success: false, error: 'سفارش یافت نشد' });
        }
        
        // اگر سفارش لغو شد، موجودی را برگردان
        if(status === 'لغو شده'){
            const product = await Product.findById(order.product);
            product.stock += order.quantity;
            product.history.push({ type: 'ورود', quantity: order.quantity, date: new Date() });
            await product.save();
        }

        res.status(200).json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};


// گزارش فروش
exports.getSalesReport = async (req, res) => {
    try {
        const sales = await Order.aggregate([
            { 
                $match: { status: 'ارسال شده' } 
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: '$productDetails'
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
                    totalSales: { $sum: "$totalPrice" },
                    itemsSold: {
                        $push: {
                            name: "$productDetails.name",
                            quantity: "$quantity",
                            price: "$totalPrice"
                        }
                    }
                }
            },
            { 
                $sort: { _id: 1 } 
            }
        ]);

        res.status(200).json({ success: true, data: sales });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
// exports.getSalesReport = async (req, res) => {
//     try {
//         const sales = await Order.aggregate([
//             { $match: { status: 'ارسال شده' } },
//             {
//                 $group: {
//                     _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
//                     totalSales: { $sum: "$totalPrice" },
//                     count: { $sum: 1 }
//                 }
//             },
//             { $sort: { _id: 1 } }
//         ]);
//         res.status(200).json({ success: true, data: sales });
//     } catch (err) {
//         res.status(400).json({ success: false, error: err.message });
//     }
// };
