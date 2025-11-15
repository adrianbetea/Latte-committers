const db = require('../config/database');

// Get all incidents
exports.getAllIncidents = async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT 
        i.*,
        f.name as fine_name,
        f.value as fine_value
      FROM incidents i
      LEFT JOIN fines f ON i.fine_id = f.id
      ORDER BY i.datetime DESC
    `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get incident by ID with photos
exports.getIncidentById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get incident details
        const [incidents] = await db.query(`
      SELECT 
        i.*,
        f.name as fine_name,
        f.value as fine_value
      FROM incidents i
      LEFT JOIN fines f ON i.fine_id = f.id
      WHERE i.id = ?
    `, [id]);

        if (incidents.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        // Get photos for this incident
        const [photos] = await db.query(
            'SELECT * FROM incident_photo WHERE incident_id = ?',
            [id]
        );

        const incident = {
            ...incidents[0],
            photos: photos
        };

        res.json({
            success: true,
            data: incident
        });
    } catch (error) {
        console.error('Error fetching incident:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Create new incident
exports.createIncident = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const {
            address,
            latitude,
            longitude,
            datetime,
            ai_description,
            car_number,
            fine_id,
            photos // array of photo paths
        } = req.body;

        // Validate required fields
        if (!address || !latitude || !longitude || !datetime || !ai_description) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Insert incident
        const [result] = await connection.query(
            `INSERT INTO incidents 
       (address, latitude, longitude, datetime, ai_description, car_number, fine_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [address, latitude, longitude, datetime, ai_description, car_number || null, fine_id || null]
        );

        const incidentId = result.insertId;

        // Insert photos if provided
        if (photos && Array.isArray(photos) && photos.length > 0) {
            const photoValues = photos.map(photoPath => [incidentId, photoPath]);
            await connection.query(
                'INSERT INTO incident_photo (incident_id, photo_path) VALUES ?',
                [photoValues]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Incident created successfully',
            data: {
                id: incidentId,
                address,
                latitude,
                longitude,
                datetime,
                status: 'pending'
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating incident:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Update incident status
exports.updateIncidentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, car_number, fine_id, admin_notes } = req.body;

        // Validate status
        const validStatuses = ['pending', 'rejected', 'resolved_and_fined', 'resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const [result] = await db.query(
            `UPDATE incidents 
       SET status = ?, car_number = ?, fine_id = ?, admin_notes = ? 
       WHERE id = ?`,
            [status, car_number || null, fine_id || null, admin_notes || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        res.json({
            success: true,
            message: 'Incident updated successfully'
        });
    } catch (error) {
        console.error('Error updating incident:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Delete incident
exports.deleteIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM incidents WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        res.json({
            success: true,
            message: 'Incident deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting incident:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get incidents by status
exports.getIncidentsByStatus = async (req, res) => {
    try {
        const { status } = req.params;

        const [rows] = await db.query(`
      SELECT 
        i.*,
        f.name as fine_name,
        f.value as fine_value
      FROM incidents i
      LEFT JOIN fines f ON i.fine_id = f.id
      WHERE i.status = ?
      ORDER BY i.datetime DESC
    `, [status]);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching incidents by status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get incident statistics
exports.getIncidentStats = async (req, res) => {
    try {
        const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'resolved_and_fined' THEN 1 ELSE 0 END) as fined,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM incidents
    `);

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Error fetching incident statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get analytics data
exports.getAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, district } = req.query;

        // Build WHERE clause
        let whereConditions = [];
        let params = [];

        if (startDate && endDate) {
            whereConditions.push('i.datetime BETWEEN ? AND ?');
            params.push(startDate, endDate);
        }

        if (district && district !== 'all') {
            whereConditions.push('i.district = ?');
            params.push(district);
        }

        const whereClause = whereConditions.length > 0
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        // Get total violations
        const [totalStats] = await db.query(`
            SELECT 
                COUNT(*) as total_violations,
                COALESCE(SUM(CASE WHEN i.status = 'resolved_and_fined' THEN 1 ELSE 0 END), 0) as fines_issued,
                COALESCE(SUM(CASE WHEN i.status = 'resolved_and_fined' THEN COALESCE(f.value, 0) ELSE 0 END), 0) as revenue
            FROM incidents i
            LEFT JOIN fines f ON i.fine_id = f.id
            ${whereClause}
        `, params);

        // Get violations over time (last 7 days)
        const [violationsOverTime] = await db.query(`
            SELECT 
                DATE_FORMAT(datetime, '%b %d') as date,
                COUNT(*) as violations
            FROM incidents i
            ${whereClause}
            GROUP BY DATE(datetime), DATE_FORMAT(datetime, '%b %d')
            ORDER BY DATE(datetime) DESC
            LIMIT 7
        `, params);

        // Get district overview
        let districtOverview = [];
        
        if (district && district !== 'all') {
            // Single district view - get stats for that district for last week
            const [districtStatsLastWeek] = await db.query(`
                SELECT 
                    district,
                    COUNT(*) as count
                FROM incidents i
                WHERE i.district = ?
                  AND i.datetime >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY district
            `, [district]);
            
            // Also get total count for the selected period
            const [districtStatsTotal] = await db.query(`
                SELECT 
                    district,
                    COUNT(*) as count
                FROM incidents i
                ${whereClause}
                GROUP BY district
            `, params);
            
            if (districtStatsLastWeek.length > 0) {
                const weeklyCount = districtStatsLastWeek[0].count;
                const totalCount = districtStatsTotal.length > 0 ? districtStatsTotal[0].count : 0;
                let score = 'Low';
                let color = '#10b981'; // Green
                
                // Risk level based on weekly average (incidents per week)
                if (weeklyCount >= 10) {
                    score = 'Critical';
                    color = '#ef4444'; // Red
                } else if (weeklyCount >= 5) {
                    score = 'High';
                    color = '#f97316'; // Orange
                } else if (weeklyCount >= 2) {
                    score = 'Medium';
                    color = '#eab308'; // Yellow
                }
                
                districtOverview = [{
                    district: district,
                    count: totalCount,
                    weeklyCount: weeklyCount,
                    score: score,
                    color: color
                }];
            } else if (districtStatsTotal.length > 0) {
                // No incidents in last week, but has incidents in the period
                districtOverview = [{
                    district: district,
                    count: districtStatsTotal[0].count,
                    weeklyCount: 0,
                    score: 'Low',
                    color: '#10b981'
                }];
            }
        } else {
            // All districts view - get top 3 and worst 3
            const whereConditionsForDistricts = [];
            const paramsForDistricts = [];
            
            if (startDate && endDate) {
                whereConditionsForDistricts.push('datetime BETWEEN ? AND ?');
                paramsForDistricts.push(startDate, endDate);
            }
            
            const whereClauseForDistricts = whereConditionsForDistricts.length > 0
                ? 'WHERE ' + whereConditionsForDistricts.join(' AND ')
                : '';
            
            const [allDistricts] = await db.query(`
                SELECT 
                    district,
                    COUNT(*) as count
                FROM incidents
                ${whereClauseForDistricts}
                GROUP BY district
                HAVING district IS NOT NULL
                ORDER BY count DESC
            `, paramsForDistricts);
            
            if (allDistricts.length > 0) {
                // Get top 3
                const top3 = allDistricts.slice(0, 3).map(d => ({
                    district: d.district,
                    count: d.count,
                    type: 'top',
                    color: '#ef4444' // Red for high incidents
                }));
                
                // Get worst 3 (lowest incidents)
                const worst3 = allDistricts.slice(-3).reverse().map(d => ({
                    district: d.district,
                    count: d.count,
                    type: 'worst',
                    color: '#10b981' // Green for low incidents
                }));
                
                districtOverview = [...top3, ...worst3];
            }
        }

        // Get incidents reviewed
        const [reviewStats] = await db.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN status IN ('resolved_and_fined', 'resolved', 'rejected') THEN 1 ELSE 0 END), 0) as incidents_reviewed
            FROM incidents i
            ${whereClause}
        `, params);

        res.json({
            success: true,
            data: {
                stats: {
                    total_violations: totalStats[0].total_violations || 0,
                    fines_issued: totalStats[0].fines_issued || 0,
                    revenue: totalStats[0].revenue || 0,
                    incidents_reviewed: reviewStats[0].incidents_reviewed || 0
                },
                violations_over_time: violationsOverTime.reverse(),
                district_overview: districtOverview
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
