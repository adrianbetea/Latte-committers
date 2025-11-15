const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

// GET all incidents
router.get('/', incidentController.getAllIncidents);

// GET incident statistics
router.get('/stats', incidentController.getIncidentStats);

// GET analytics data
router.get('/analytics', incidentController.getAnalytics);

// GET incidents by status
router.get('/status/:status', incidentController.getIncidentsByStatus);

// GET incident by ID
router.get('/:id', incidentController.getIncidentById);

// POST create new incident
router.post('/', incidentController.createIncident);

// PUT update incident status
router.put('/:id', incidentController.updateIncidentStatus);

// DELETE incident
router.delete('/:id', incidentController.deleteIncident);

module.exports = router;
