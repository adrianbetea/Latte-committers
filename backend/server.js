require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
const authRoutes = require('./routes/authRoutes');

app.use('/api/incidents', incidentRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
