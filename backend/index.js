const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

connectDB();

const app = express();

// Disable ETag generation to prevent caching issues
app.set('etag', false);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/chits', require('./routes/chitRoutes'));
app.use('/api/auctions', require('./routes/auctionRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/lifts', require('./routes/liftRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.use(errorHandler);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));

// Trigger restart
