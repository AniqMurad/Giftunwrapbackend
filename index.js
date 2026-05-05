import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import messageRoutes from './routes/messagesRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import giftBoxItemRoutes from './routes/giftBoxItemRoutes.js';
import boxRoutes from './routes/boxRoutes.js';
import cardRoutes from './routes/cardRoutes.js';

dotenv.config();

const app = express();

// Log startup information for debugging
console.log('Starting GiftUnwrap Backend...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('MongoDB URI configured:', !!process.env.MONGO_URI);
console.log('Port:', process.env.PORT || 5000);

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 


app.get('/', (req, res) => {
    res.send('GiftUnwrap Backend is running!');
});

// Health check endpoint
app.get('/health', (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: {
            connected: mongoose.connection.readyState === 1,
            state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
            host: mongoose.connection.host || 'N/A',
            name: mongoose.connection.name || 'N/A'
        },
        environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            mongoConfigured: !!process.env.MONGO_URI
        }
    };
    
    const httpStatus = health.mongodb.connected ? 200 : 503;
    res.status(httpStatus).json(health);
});


app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/gift-box-items', giftBoxItemRoutes);
app.use('/api/boxes', boxRoutes);
app.use('/api/cards', cardRoutes);

const connectDB = async (retries = 5, delay = 5000) => {
    if (mongoose.connection.readyState === 1) {
        console.log('MongoDB already connected.');
        return mongoose.connection;
    }

    if (!process.env.MONGO_URI) {
        console.warn('⚠️  MONGO_URI is not set. Configure it in environment variables.');
        return null;
    }

    console.log('Attempting to connect to MongoDB...');

    for (let i = 0; i < retries; i++) {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 15000,  // Increased timeout
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                minPoolSize: 1,
                family: 4,
                retryWrites: true,
                retryReads: true,
            });

            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            console.log(`   Database: ${conn.connection.name}`);
            return conn.connection;
        } catch (error) {
            console.error(`❌ MongoDB connection attempt ${i + 1}/${retries} failed:`);
            console.error(`   Error: ${error.message}`);
            
            if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
                console.error('   DNS resolution failed. Check your MONGO_URI.');
            } else if (error.message.includes('authentication')) {
                console.error('   Authentication failed. Check your credentials.');
            } else if (error.message.includes('whitelist') || error.message.includes('IP')) {
                console.error('   IP not whitelisted. Add your IP to MongoDB Atlas.');
            }
            
            if (i < retries - 1) {
                console.log(`   Retrying in ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    console.error('⚠️  MongoDB connection failed after all retries.');
    console.error('   App will continue, but database operations will fail.');
    return null;
};

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected! Attempting to reconnect...');
    connectDB().catch(err => console.error('Reconnection failed:', err.message));
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected!');
});

// Connect to MongoDB but don't block server startup
connectDB().catch((err) => {
    console.error(`Initial MongoDB connection failed: ${err.message}`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;