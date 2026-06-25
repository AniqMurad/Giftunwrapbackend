import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import messageRoutes from './routes/messagesRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import giftBoxItemRoutes from './routes/giftBoxItemRoutes.js';
import boxRoutes from './routes/boxRoutes.js';
import cardRoutes from './routes/cardRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import blogRoutes from './routes/blogRoutes.js';

dotenv.config();

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.send('GiftUnwrap Backend is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/gift-box-items', giftBoxItemRoutes);
app.use('/api/boxes', boxRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/blogs', blogRoutes);

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not set. Configure it in environment variables.');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 1,
        family: 4,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
};

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected!');
});

connectDB().catch((err) => {
    console.error(`Initial MongoDB connection failed: ${err.message}`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
export default app;