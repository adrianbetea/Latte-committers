const db = require('../config/database');

const authMiddleware = async (req, res, next) => {
    try {
        const userId = req.cookies.userSession;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Verify user exists
        const [users] = await db.query(
            'SELECT id, name, email, isAdmin FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            res.clearCookie('userSession');
            return res.status(401).json({
                success: false,
                message: 'Invalid session'
            });
        }

        // Attach user to request
        req.user = users[0];
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = authMiddleware;
