const db = require('../config/database');

// Get list of non-admin users with last action timestamp
exports.getUsersHistory = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, MAX(ua.created_at) AS last_access
      FROM users u
      LEFT JOIN user_actions ua ON ua.actor_id = u.id
      WHERE u.isAdmin = 0
      GROUP BY u.id, u.name, u.email
      ORDER BY COALESCE(MAX(ua.created_at), u.id) DESC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching users history:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get activity for a single user (actions), ordered desc
exports.getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT ua.*, i.address AS incident_address, i.car_number, i.status as incident_status
       FROM user_actions ua
       LEFT JOIN incidents i ON i.id = ua.incident_id
       WHERE ua.actor_id = ?
       ORDER BY ua.created_at DESC`,
      [id]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Optional: endpoint to create an action manually (not exposed to UI by default)
exports.createAction = async (req, res) => {
  try {
    const { actor_id, incident_id, action_type, details } = req.body;
    const [result] = await db.query(
      'INSERT INTO user_actions (actor_id, incident_id, action_type, details) VALUES (?, ?, ?, ?)',
      [actor_id, incident_id || null, action_type, details || null]
    );

    res.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error('Error creating action:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = exports;
