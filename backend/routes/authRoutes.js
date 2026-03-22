const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { check, validationResult } = require('express-validator');

// 1. Controller dosyasındaki tüm fonksiyonları içeri alıyoruz
const { register, login, forgotPassword, resetPassword, verifyEmail, resendVerification } = require('../controllers/authController');

// --- RATE LIMITER (İstek Sınırlandırma) ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 10, // 15 dakika içinde en fazla 10 istek
  message: {
    message: 'Çok fazla giriş denemesi, lütfen daha sonra tekrar deneyin'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- VERİ DOĞRULAMA (Validation) ---
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({ message: errors.array()[0].msg });
  };
};

const registerValidation = [
  check('name', 'Lütfen geçerli bir isim giriniz.').notEmpty().trim(),
  check('email', 'Lütfen geçerli bir e-posta adresi giriniz.').isEmail().normalizeEmail(),
  check('password', 'Şifreniz en az 6 karakter uzunluğunda olmalıdır.').isLength({ min: 6 }),
  check('studentId', 'Lütfen geçerli bir öğrenci numarası giriniz.').notEmpty()
];

const loginValidation = [
  check('email', 'Geçerli bir e-posta adresi giriniz.').isEmail().normalizeEmail(),
  check('password', 'Lütfen şifrenizi giriniz.').notEmpty()
];

// --- MEVCUT ROTALAR ---
router.post('/register', authLimiter, validate(registerValidation), register);
router.post('/login', authLimiter, validate(loginValidation), login);

// --- E-POSTA DOĞRULAMA ROTALARI ---
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);

// --- ŞİFRE SIFIRLAMA ROTALARI ---
router.post('/forgotpassword', authLimiter, forgotPassword);
router.put('/resetpassword/:token', resetPassword);

module.exports = router;