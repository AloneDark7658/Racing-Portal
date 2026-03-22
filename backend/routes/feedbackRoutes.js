const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { submitFeedback } = require('../controllers/feedbackController');

// Sadece giriş yapmış kullanıcılar yorum/hata bildirebilir
router.post('/', protect, upload.single('screenshot'), submitFeedback);

module.exports = router;
