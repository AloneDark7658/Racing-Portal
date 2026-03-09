const express = require('express');
const router = express.Router();

const { 
  generateQR, 
  scanQR, 
  getActiveSession,
  getTodayAttendance, // YENİ EKLENEN
  getAttendanceSummary, // EKLENDİ
  getUserAttendanceGraph, // EKLENDİ
  getMySummary, // EKLENDİ
  getMyGraph    // EKLENDİ
} = require('../controllers/attendanceController');

const { protect, admin } = require('../middleware/authMiddleware');

router.get('/active-session', protect, admin, getActiveSession);
router.get('/today', protect, admin, getTodayAttendance); // YENİ: Bugünün listesi
router.post('/generate', protect, admin, generateQR);
router.post('/scan', protect, scanQR);
router.get('/summary', protect, admin, getAttendanceSummary); // Tüm takımın tablosu
router.get('/graph/:userId', protect, admin, getUserAttendanceGraph); // Tek adamın Dolar Grafiği
router.get('/my-summary', protect, getMySummary);
router.get('/my-graph', protect, getMyGraph);

module.exports = router;