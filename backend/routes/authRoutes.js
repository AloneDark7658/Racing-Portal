const express = require('express');
const router = express.Router();
// YENİ: login fonksiyonunu da içeri aktardık
const { register, login } = require('../controllers/authController'); 

// Kayıt Rotası
router.post('/register', register);

// YENİ: Giriş Rotası (POST isteği ile çalışır)
// Adres: /api/auth/login
router.post('/login', login);

module.exports = router;