const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Generate JWT
const generateToken = (id, email, role) => {
    return jwt.sign({ id, email, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/register
exports.registerUser = async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    try {
        // Check if user exists
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const [result] = await db.query(
            'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
            [name, email, phone || null, hashedPassword]
        );

        if (result.insertId) {
            res.status(201).json({
                id: result.insertId,
                name,
                email,
                role: 'user',
                token: generateToken(result.insertId, email, 'user'),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check for user email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id, user.email, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Forgot Password (Mock)
// @route   POST /api/forgot-password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        // In a real app, you would send an email with a reset link here.
        res.json({ message: 'Password reset instructions sent to email (Mocked)' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
