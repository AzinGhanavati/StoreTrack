const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Set static folder 
app.use(express.static(path.join(__dirname, '../client')));

// Mount routers
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Low stock check interval
const { checkLowStock } = require('./controllers/productController');
setInterval(checkLowStock, 600000); // Check every 10 minutes