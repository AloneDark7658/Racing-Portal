const express = require('express');
const router = express.Router();

// YENİ: scanQR fonksiyonunu da içeri aktardık
const { generateQR, scanQR } = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/authMiddleware');

// QR OLUŞTURMA ROTASI (Sadece Admin)
router.post('/generate-qr', protect, admin, generateQR);

// YENİ: QR OKUTMA ROTASI (Tüm Üyeler)
// Adres: /api/attendance/scan-qr
// Sadece giriş yapmış olması (protect) yeterli, admin olmasına gerek yok!
router.post('/scan-qr', protect, scanQR);

module.exports = router;