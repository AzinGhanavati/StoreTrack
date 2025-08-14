const Product = require('../models/Product');

// افزودن کالا
exports.addProduct = async (req, res) => {
    try {
        const { name, stock, price, category } = req.body;
        const product = await Product.create({ name, stock, price, category });
        // Add to history
        product.history.push({ type: 'ورود', quantity: stock });
        await product.save();
        res.status(201).json({ success: true, data: product });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// دریافت همه کالاها و فیلتر کردن
exports.getProducts = async (req, res) => {
    try {
        const { name, category } = req.query;
        const queryConditions = {};

        if (name) {
            queryConditions.name = { $regex: name, $options: 'i' };
        }
        if (category) {
            queryConditions.category = { $regex: category, $options: 'i' };
        }

        const products = await Product.find(queryConditions);
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
// exports.getProducts = async (req, res) => {
//     try {
//         let query;
//         let queryStr = JSON.stringify(req.query);
//         queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
//         query = Product.find(JSON.parse(queryStr));

//         if (req.query.search) {
//             query = Product.find({ name: { $regex: req.query.search, $options: 'i' } });
//         }

//         const products = await query;
//         res.status(200).json({ success: true, count: products.length, data: products });
//     } catch (err) {
//         res.status(400).json({ success: false, error: err.message });
//     }
// };

// گزارش موجودی پایین

exports.getLowStockReport = async (req, res) => {
    try {
        const products = await Product.find({ stock: { $lt: 10 } }); // مثلا کمتر از ۱۰ عدد
        res.status(200).json({ success: true, data: products });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// چک کردن خودکار موجودی پایین (برای نوتیفیکیشن)
exports.checkLowStock = async () => {
    try {
        const lowStockProducts = await Product.find({ stock: { $lt: 10 } });
        if (lowStockProducts.length > 0) {
            console.log("هشدار: کالاهای زیر موجودی کمی دارند:");
            lowStockProducts.forEach(p => console.log(`- ${p.name} (موجودی: ${p.stock})`));
            // اینجا می‌توانید منطق ارسال نوتیفیکیشن واقعی (ایمیل، پیامک و...) را اضافه کنید.
        }
    } catch (err) {
        console.error('خطا در بررسی موجودی کم:', err);
    }
};


exports.addStock = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, error: 'کالا یافت نشد' });
        }

        const quantityToAdd = parseInt(req.body.quantity, 10);

        if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
            return res.status(400).json({ success: false, error: 'مقدار وارد شده نامعتبر است' });
        }

        // افزایش موجودی
        product.stock += quantityToAdd;

        // ثبت در تاریخچه
        product.history.push({
            type: 'ورود',
            quantity: quantityToAdd,
            date: new Date()
        });

        await product.save();

        res.status(200).json({ success: true, data: product });

    } catch (err) {
        res.status(500).json({ success: false, error: 'خطای سرور' });
    }
};