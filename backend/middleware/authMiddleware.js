const jwt = require('jsonwebtoken');
const User = require('../models/User');

// --- 1. GİRİŞ YAPILMIŞ MI KONTROLÜ (Tüm üyeler için) ---
exports.protect = async (req, res, next) => {
  let token;

  // İstek başlığında (Header) 'Bearer' ile başlayan bir bilet var mı bakıyoruz
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 'Bearer jwtsifresi123...' metninden sadece şifreli kısmı ayırıyoruz
      token = req.headers.authorization.split(' ')[1];

      // Bileti kendi gizli anahtarımızla çözüyoruz (İçinden kullanıcının ID'si çıkacak)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // O ID'ye sahip kullanıcıyı veri tabanından bulup, şifresini gizleyerek req.user içine koyuyoruz
      // Böylece sonraki işlemlerde "Giriş yapan kişi kimdi?" diye veri tabanına tekrar sormamıza gerek kalmıyor
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Güvenlikten geçti, asıl gitmek istediği yere (fonksiyona) devam etsin
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Yetkisiz erişim, biletiniz (token) geçersiz veya süresi dolmuş!' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Yetkisiz erişim, bilet (token) bulunamadı!' });
  }
};

// --- 2. ADMİN Mİ KONTROLÜ (Sadece Yöneticiler için) ---
exports.admin = (req, res, next) => {
  // Yukarıdaki 'protect' adımını geçen kullanıcının rolü admin veya superadmin mi?
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next(); // Adminsin, geçebilirsin
  } else {
    res.status(403).json({ message: 'Bu işlemi yapmak için Admin yetkisine sahip olmalısınız!' });
  }
};