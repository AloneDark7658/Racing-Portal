const express = require('express');
const router = express.Router();

const { createLeaveRequest, reviewLeaveRequest } = require('../controllers/leaveController');
const { protect, admin } = require('../middleware/authMiddleware');

// Üye: İzin Talebi Oluştur
// POST /api/leave
router.post('/', protect, createLeaveRequest);

// Admin: İzin Talebini Onayla/Reddet
// PUT /api/leave/:requestId
router.put('/:requestId', protect, admin, reviewLeaveRequest);

module.exports = router;