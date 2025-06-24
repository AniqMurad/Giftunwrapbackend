import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const registerUser = async (req, res) => {
    const { email, password, confirmPassword, name, phoneNumber } = req.body;

    if (!email || !password || !confirmPassword || !name || !phoneNumber) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword, name, phoneNumber });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('-__v'); // Exclude __v field
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, name: user.name, phoneNumber: user.phoneNumber }, // payload
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const userData = user.toObject(); // Convert Mongoose doc to plain object
        delete userData.password; // Don't expose hashed password

        res.json({
            message: 'Login successful',
            token,
            user: userData
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};


export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.status(200).json({ message: 'User found', token: resetToken });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const resetPassword = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Reset error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const changePassword = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'All fields are required: email, currentPassword, newPassword' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'New password cannot be the same as the current password' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};