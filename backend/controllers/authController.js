const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Rastgele şifre sıfırlama kodu üretmek için
const sendEmail = require('../utils/sendEmail'); // Resend postacımız

// --- KULLANICI KAYIT OLMA (REGISTER) İŞLEMİ ---
exports.register = async (req, res) => {
  try {
    const { name, email, password, studentId } = req.body;

    // 1. E-posta kontrolü
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda! 📧' });
    }

    // 2. Öğrenci No kontrolü (YENİ EKLENDİ)
    let userByStudentId = await User.findOne({ studentId });
    if (userByStudentId) {
      return res.status(400).json({ message: 'Bu öğrenci numarası zaten kayıtlı! 🪪' });
    }

    // 3. Şifreyi güvenli hale getir (Hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Yeni kullanıcıyı oluştur
    const user = new User({
      name,
      email,
      password: hashedPassword,
      studentId
    });

    await user.save();
    res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu! 🎉' });
  } catch (error) {
    console.error("Kayıt Hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// --- KULLANICI GİRİŞ YAPMA (LOGIN) İŞLEMİ ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Bu e-posta ile kayıtlı kullanıcı bulunamadı!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Hatalı şifre girdiniz!' });
    }

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Giriş başarılı! 🏎️',
      token: token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Giriş Hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// --- ŞİFREMİ UNUTTUM (FORGOT PASSWORD) İŞLEMİ ---
exports.forgotPassword = async (req, res) => {
  try {
    // 1. Kullanıcıyı e-postasından bul
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı! 🕵️' });
    }

    // 2. Rastgele güvenli bir token (şifre) oluştur
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 3. Bu tokeni veritabanına kaydetmek için şifrele (Güvenlik için DB'de açık tutmuyoruz)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 dakika geçerlilik süresi ⏳

    await user.save();

    // 4. Frontend'deki (React) şifre sıfırlama sayfamızın linkini hazırla
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // 5. Postacıyı (Resend) çağır ve maili yolla
    const message = `İTÜ Racing hesabınızın şifresini sıfırlamak için bir talepte bulundunuz.\n\nŞifrenizi sıfırlamak için lütfen aşağıdaki linke tıklayın (Link 10 dakika geçerlidir):\n\n${resetUrl}\n\nEğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.`;

    try {
      await sendEmail({
        email: user.email,
        subject: '🔐 İTÜ Racing - Şifre Sıfırlama Talebi',
        message: message
      });

      res.status(200).json({ message: 'Şifre sıfırlama linki e-postanıza gönderildi! 📩 Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.' });
    } catch (error) {
      // Eğer mail giderken hata olursa, veritabanına yazdığımız tokenleri geri sil
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      console.error('Mail Gönderme Hatası:', error);
      return res.status(500).json({ message: 'E-posta gönderilemedi.' });
    }
  } catch (error) {
    console.error("Şifremi Unuttum Hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// --- YENİ ŞİFREYİ KAYDETME (RESET PASSWORD) İŞLEMİ ---
exports.resetPassword = async (req, res) => {
  try {
    // 1. URL'den gelen tokeni al ve veritabanındaki şifrelenmiş haliyle karşılaştırmak için aynı yöntemle şifrele
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // 2. Bu tokena sahip ve süresi "ŞU ANDAN DAHA İLERİ BİR SAATTE" (yani dolmamış) olan kullanıcıyı bul
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş bir link kullandınız! 🚫' });
    }

    // 3. Kullanıcı bulunduysa, yeni şifresini al ve güvenli hale getir (Hash)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // 4. Şifre sıfırlama tokenlerini temizle (İşleri bitti)
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Şifreniz başarıyla güncellendi! Artık yeni şifrenizle giriş yapabilirsiniz. 🏎️🏁' });
  } catch (error) {
    console.error("Şifre Sıfırlama Hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};