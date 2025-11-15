const db = require('../config/database');

// Get all fines
exports.getAllFines = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM fines ORDER BY value ASC');

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching fines:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get fine by ID
exports.getFineById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM fines WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fine not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching fine:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Create new fine
exports.createFine = async (req, res) => {
    try {
        const { name, value } = req.body;

        if (!name || !value) {
            return res.status(400).json({
                success: false,
                message: 'Name and value are required'
            });
        }

        const [result] = await db.query(
            'INSERT INTO fines (name, value) VALUES (?, ?)',
            [name, value]
        );

        res.status(201).json({
            success: true,
            message: 'Fine created successfully',
            data: {
                id: result.insertId,
                name,
                value
            }
        });
    } catch (error) {
        console.error('Error creating fine:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update fine
exports.updateFine = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, value } = req.body;

        const [result] = await db.query(
            'UPDATE fines SET name = ?, value = ? WHERE id = ?',
            [name, value, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fine not found'
            });
        }

        res.json({
            success: true,
            message: 'Fine updated successfully'
        });
    } catch (error) {
        console.error('Error updating fine:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Delete fine
exports.deleteFine = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM fines WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fine not found'
            });
        }

        res.json({
            success: true,
            message: 'Fine deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting fine:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
