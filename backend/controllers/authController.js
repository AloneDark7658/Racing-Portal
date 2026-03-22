const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// --- KULLANICI KAYIT OLMA (REGISTER) İŞLEMİ ---
exports.register = async (req, res) => {
  try {
    const { name, email, password, studentId } = req.body;

    // 1. E-posta kontrolü
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda! 📧' });
    }

    // 2. Öğrenci No kontrolü
    let userByStudentId = await User.findOne({ studentId });
    if (userByStudentId) {
      return res.status(400).json({ message: 'Bu öğrenci numarası zaten kayıtlı! 🪪' });
    }

    // 3. Şifreyi güvenli hale getir (Hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. 6 haneli doğrulama kodu oluştur
    const verificationCode = crypto.randomInt(100000, 999999).toString();

    // 5. Yeni kullanıcıyı oluştur (doğrulanmamış olarak)
    const user = new User({
      name,
      email,
      password: hashedPassword,
      studentId,
      isVerified: false,
      verificationCode
    });

    await user.save();

    // 6. Doğrulama kodunu e-posta ile gönder
    try {
      await sendEmail({
        email: user.email,
        subject: '📧 İTÜ Racing - E-posta Doğrulama Kodu',
        message: `İTÜ Racing portalına hoş geldiniz!\n\nHesabınızı etkinleştirmek için aşağıdaki doğrulama kodunu kullanın:\n\n🔑 Doğrulama Kodu: ${verificationCode}\n\nBu kodu kayıt sonrası açılan doğrulama ekranına girin.\n\nEğer bu hesabı siz oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz.`
      });
    } catch (emailError) {
      console.error('Doğrulama maili gönderilemedi:', emailError.message);
    }

    res.status(201).json({ 
      message: 'Kayıt başarılı! E-postanıza gönderilen doğrulama kodunu girin. 📧',
      requiresVerification: true,
      email: user.email
    });
  } catch (error) {
    console.error("Kayıt Hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// --- E-POSTA DOĞRULAMA (VERIFY EMAIL) İŞLEMİ ---
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'E-posta ve doğrulama kodu gereklidir.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Bu hesap zaten doğrulanmış.' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Doğrulama kodu hatalı! Lütfen tekrar deneyin. 🚫' });
    }

    // Doğrulama başarılı
    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    res.status(200).json({ message: 'E-posta doğrulandı! Artık giriş yapabilirsiniz. ✅' });
  } catch (error) {
    console.error("Doğrulama Hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// --- DOĞRULAMA KODUNU YENİDEN GÖNDER ---
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Bu hesap zaten doğrulanmış.' });
    }

    // Yeni kod oluştur
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    user.verificationCode = verificationCode;
    await user.save();

    await sendEmail({
      email: user.email,
      subject: '📧 İTÜ Racing - Yeni Doğrulama Kodu',
      message: `Yeni doğrulama kodunuz:\n\n🔑 Doğrulama Kodu: ${verificationCode}\n\nBu kodu kayıt sonrası açılan doğrulama ekranına girin.`
    });

    res.status(200).json({ message: 'Yeni doğrulama kodu e-postanıza gönderildi! 📩' });
  } catch (error) {
    console.error("Yeniden gönderme hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// --- KULLANICI GİRİŞ YAPMA (LOGIN) İŞLEMİ ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'E-posta veya şifre hatalı!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'E-posta veya şifre hatalı!' });
    }

    // E-posta doğrulanmamışsa girişi engelle
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Hesabınız henüz doğrulanmamış! Lütfen e-postanıza gönderilen doğrulama kodunu girin. 📧',
        requiresVerification: true,
        email: user.email
      });
    }

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Giriş başarılı! 🏎️',
      token: token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId
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
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı! 🕵️' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 dakika

    await user.save();

    // FRONTEND_URL kontrol — tanımsızsa fallback kullan
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `İTÜ Racing hesabınızın şifresini sıfırlamak için bir talepte bulundunuz.\n\nŞifrenizi sıfırlamak için lütfen aşağıdaki linke tıklayın (Link 10 dakika geçerlidir):\n\n${resetUrl}\n\nEğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.`;

    try {
      await sendEmail({
        email: user.email,
        subject: '🔐 İTÜ Racing - Şifre Sıfırlama Talebi',
        message: message
      });

      res.status(200).json({ message: 'Şifre sıfırlama linki e-postanıza gönderildi! 📩 Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.' });
    } catch (error) {
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
    // Şifre uzunluğu kontrolü
    if (!req.body.password || req.body.password.length < 6) {
      return res.status(400).json({ message: 'Yeni şifreniz en az 6 karakter uzunluğunda olmalıdır! 🔒' });
    }

    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş bir link kullandınız! 🚫' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Şifreniz başarıyla güncellendi! Artık yeni şifrenizle giriş yapabilirsiniz. 🏎️🏁' });
  } catch (error) {
    console.error("Şifre Sıfırlama Hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};