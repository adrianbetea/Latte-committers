const db = require('../config/database');

// Get resolved incidents with user info - optionally filter by user name
exports.getResolvedIncidents = async (req, res) => {
  try {
    const { userName } = req.query;

    let query = `
      SELECT 
        i.id,
        i.address,
        i.car_number,
        i.status,
        i.resolved_at,
        i.admin_notes,
        i.fine_id,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        f.name as fine_name,
        f.value as fine_value
      FROM incidents i
      LEFT JOIN users u ON i.resolved_by = u.id
      LEFT JOIN fines f ON i.fine_id = f.id
      WHERE i.status IN ('resolved', 'resolved_and_fined')
    `;

    const params = [];

    if (userName && userName.trim() !== '') {
      query += ` AND u.name LIKE ?`;
      params.push(`%${userName}%`);
    }

    query += ` ORDER BY i.resolved_at DESC`;

    const [rows] = await db.query(query, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching resolved incidents:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get list of all users (for search suggestions)
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, email, isAdmin
      FROM users
      ORDER BY name ASC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update user information
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, isAdmin } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    // Check if email is already taken by another user
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'Email is already in use' });
    }

    // Update user
    const [result] = await db.query(
      'UPDATE users SET name = ?, email = ?, isAdmin = ? WHERE id = ?',
      [name, email, isAdmin ? 1 : 0, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting the current logged-in user
    if (req.user && req.user.id == userId) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    // Delete user
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
