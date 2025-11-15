const db = require('../config/database');
const bcrypt = require('bcrypt');

// Login
exports.login = async (req, res) => {
    try {
        console.log('Login attempt received:', { email: req.body.email, passwordLength: req.body.password?.length });

        const { email, password } = req.body;

        if (!email || !password) {
            console.log('Missing credentials');
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        console.log('Users found:', users.length);

        if (users.length === 0) {
            console.log('No user found with email:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];
        console.log('User found:', { id: user.id, name: user.name, email: user.email });

        // Compare password
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isValidPassword);

        if (!isValidPassword) {
            console.log('Invalid password for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Set cookie with user session
        res.cookie('userSession', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'lax'
        });

        console.log('Login successful for:', email);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                admin: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin
                }
            }
        });
    } catch (error) {
        console.log('Error during login:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Logout
exports.logout = (req, res) => {
    res.clearCookie('userSession');
    res.json({
        success: true,
        message: 'Logout successful'
    });
};

// Check authentication status
exports.checkAuth = async (req, res) => {
    try {
        const userId = req.cookies.userSession;

        if (!userId) {
            return res.json({
                success: true,
                authenticated: false
            });
        }

        const [users] = await db.query(
            'SELECT id, name, email, isAdmin FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            res.clearCookie('userSession');
            return res.json({
                success: true,
                authenticated: false
            });
        }

        res.json({
            success: true,
            authenticated: true,
            data: {
                admin: users[0]
            }
        });
    } catch (error) {
        console.error('Error checking auth:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Register (optional - for creating admin accounts)
exports.register = async (req, res) => {
    try {
        const { name, email, password, isAdmin } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        // Check if email already exists
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, isAdmin ? 1 : 0]
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: result.insertId,
                name,
                email
            }
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
