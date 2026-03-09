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
      req.user = await User.findById(decoded.id).select('-password');

      // DÜZELTME: İşlem başarılıysa fonksiyonu burada bitirip sonraki adıma geçiyoruz.
      return next(); 
    } catch (error) {
      console.error(error);
      // DÜZELTME: Hata durumunda fonksiyonu sonlandırıp cevap dönüyoruz.
      return res.status(401).json({ message: 'Yetkisiz erişim, biletiniz (token) geçersiz veya süresi dolmuş!' });
    }
  }

  if (!token) {
    // DÜZELTME: Token yoksa fonksiyonu sonlandırıp cevap dönüyoruz.
    return res.status(401).json({ message: 'Yetkisiz erişim, bilet (token) bulunamadı!' });
  }
};

// --- 2. ADMİN Mİ KONTROLÜ (Sadece Yöneticiler için) ---
exports.admin = (req, res, next) => {
  // Yukarıdaki 'protect' adımını geçen kullanıcının rolü admin veya superadmin mi?
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    // DÜZELTME: Başarılıysa fonksiyonu bitir ve route'a (create) ilerle
    return next(); 
  } else {
    // DÜZELTME: Yetki yoksa işlemi durdur ve hata dön
    return res.status(403).json({ message: 'Bu işlemi yapmak için Admin yetkisine sahip olmalısınız!' });
  }
};