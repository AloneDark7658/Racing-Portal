const User = require('../models/User');
const bcrypt = require('bcryptjs');

// --- ADMIN: Kullanıcının departmanını güncelle (veya kaldır) ---
exports.updateDepartment = async (req, res) => {
  try {
    const { departmentId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { departmentId: departmentId || null },
      { returnDocument: 'after' }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    res.status(200).json({ message: 'Departman güncellendi.', user });
  } catch (error) {
    res.status(500).json({ message: 'Güncelleme başarısız.' });
  }
};


// --- GİRİŞ YAPAN KULLANICININ PROFİLİNİ GETİR (Şifre hariç) ---
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Profil Hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// --- PROFİL BİLGİLERİNİ GÜNCELLE ---
exports.updateProfile = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // E-posta güncelleme (benzersiz kontrolü)
    if (email) {
      const existingByEmail = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingByEmail) {
        return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda! 📧' });
      }
      user.email = email;
    }

    // Şifre değiştirme (isteğe bağlı)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Şifre değiştirmek için mevcut şifrenizi girin.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mevcut şifreniz hatalı!' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password -resetPasswordToken -resetPasswordExpire');
    res.status(200).json({ message: 'Profil başarıyla güncellendi! ✅', user: updatedUser });
  } catch (error) {
    console.error("Profil Güncelleme Hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// backend/controllers/userController.js içine ekle

// --- ADMIN: Kullanıcının cihaz kilidini sıfırla ---
exports.resetDeviceId = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

    user.deviceId = null; // Cihaz kimliğini siliyoruz
    await user.save();

    res.status(200).json({ message: `${user.name} kullanıcısının cihaz kilidi sıfırlandı. ✅` });
  } catch (error) {
    res.status(500).json({ message: 'Cihaz sıfırlama işlemi başarısız.' });
  }
};

// --- ADMIN/SUPERADMIN: Kullanıcının rolünü güncelle (FAZ 2) ---
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    // 3 geçerli rol: member, admin, superadmin
    if (!['member', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Geçersiz rol.' });
    }

    // Superadmin rolü SADECE mevcut superadmin tarafından verilebilir
    if (role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Superadmin rolünü sadece mevcut bir Superadmin atayabilir! 🔒' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

    // Kendine işlem yapmasını engelle
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Kendi rolünüzü değiştiremezsiniz!' });
    }

    targetUser.role = role;
    await targetUser.save();

    const labels = { member: 'Üye', admin: 'Yönetici', superadmin: 'Süper Admin' };
    res.status(200).json({ message: `${targetUser.name} → ${labels[role]} olarak güncellendi. ✅` });
  } catch (error) {
    res.status(500).json({ message: 'Rol güncelleme işlemi başarısız.' });
  }
};

exports.listAll = async (req, res) => {
  try {
    // DÜZELTME: .select() içine 'deviceId' eklendi!
    const users = await User.find()
      .select('name email studentId role departmentId deviceId') 
      .populate('departmentId', 'name')
      .sort({ name: 1 })
      .lean();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Kullanıcılar yüklenemedi.' });
  }
};