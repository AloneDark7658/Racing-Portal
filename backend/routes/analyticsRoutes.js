const express = require('express');
const router = express.Router();

const { getDashboardStats } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

// Sadece Adminler takım istatistiklerini görebilir
// Adres: GET /api/analytics/dashboard
router.get('/dashboard', protect, admin, getDashboardStats);

module.exports = router;