const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Token için ekledik

// --- KULLANICI KAYIT OLMA (REGISTER) İŞLEMİ ---
exports.register = async (req, res) => {
  try {
    const { name, email, password, studentId } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
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

    // 1. Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Bu e-posta ile kayıtlı kullanıcı bulunamadı!' });
    }

    // 2. Şifreyi kontrol et
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Hatalı şifre girdiniz!' });
    }

    // 3. Token oluştur
    const payload = {
      id: user._id,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    // 4. Yanıtı gönder
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