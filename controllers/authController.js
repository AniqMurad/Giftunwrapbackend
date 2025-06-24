import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const registerUser = async (req, res) => {
    const { email, password, confirmPassword, name, phoneNumber } = req.body;

    // --- DEBUG LOG: Full request body received at signup ---
    console.log('RegisterUser: Incoming request body:', req.body);

    // Now requiring name and phoneNumber based on your provided code
    if (!email || !password || !confirmPassword || !name || !phoneNumber) {
        console.log('RegisterUser: Missing required fields. Email, password, confirm password, name, or phone number is missing.');
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
        console.log('RegisterUser: Passwords do not match.');
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('RegisterUser: User already exists for email:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Create new user with email, hashed password, name, and phoneNumber
        const newUser = new User({ 
            email, 
            password: hashedPassword, 
            name, 
            phoneNumber 
        });

        // --- DEBUG LOG: New user object prepared for saving to DB ---
        console.log('RegisterUser: New User object prepared for saving:', newUser);

        await newUser.save();
        console.log('RegisterUser: User registered successfully. Email:', newUser.email, 'Name:', newUser.name, 'Phone:', newUser.phoneNumber);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('RegisterUser: Server error during registration:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // --- DEBUG LOG: Login request body received ---
    console.log('LoginUser: Incoming request body:', req.body);

    try {
        // Retrieve user including name and phoneNumber, exclude __v and password
        const user = await User.findOne({ email }).select('-__v'); 
        
        // --- DEBUG LOG: User object retrieved from database (before password check) ---
        console.log('LoginUser: User object retrieved from database:', user);

        if (!user) {
            console.log('LoginUser: User not found for email:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('LoginUser: Password mismatch for user:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Include id, email, name, and phoneNumber in JWT payload
        const token = jwt.sign(
            { id: user._id, email: user.email, name: user.name, phoneNumber: user.phoneNumber }, 
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const userData = user.toObject(); // Convert Mongoose document to a plain JavaScript object
        delete userData.password; // Remove the hashed password before sending to the client

        // --- DEBUG LOG: Final user data sent to frontend ---
        console.log('LoginUser: User data sent to frontend:', userData);

        res.json({
            message: 'Login successful',
            token,
            user: userData // This object should now correctly contain name and phoneNumber
        });
    } catch (err) {
        console.error('LoginUser: Server error during login:', err);
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
