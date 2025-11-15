require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
db.getConnection()
    .then(connection => {
        console.log('MySQL Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });

// Routes
const incidentRoutes = require('./routes/incidentRoutes');
const fineRoutes = require('./routes/fineRoutes');

app.use('/api/incidents', incidentRoutes);
app.use('/api/fines', fineRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
