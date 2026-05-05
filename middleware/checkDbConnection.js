import mongoose from 'mongoose';

// Middleware to check if MongoDB is connected
export const checkDbConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
            message: 'Database connection unavailable. Please try again later.',
            error: 'Service temporarily unavailable'
        });
    }
    next();
};
