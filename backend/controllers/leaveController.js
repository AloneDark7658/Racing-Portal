const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// --- Tarihi YYYY-MM-DD UTC olarak normalize et (timezone tutarlılığı) ---
const toDateOnly = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const str = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  return new Date(str + 'T00:00:00.000Z');
};

// --- 1. ÜYENİN İZİN TALEBİ OLUŞTURMASI (AYNI GÜN KORUMALI) ---
exports.createLeaveRequest = async (req, res) => {
  try {
    const { requestedDate, reason } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Kullanıcı bilgisi bulunamadı, lütfen tekrar giriş yapın.' });
    }

    const userId = req.user._id;

    if (!requestedDate || !reason) {
      return res.status(400).json({ message: 'Lütfen tarih ve mazeret alanlarını doldurun.' });
    }

    // AYNI GÜN KONTROLÜ
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingLeave = await LeaveRequest.findOne({
      userId,
      requestedDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingLeave) {
      return res.status(400).json({ message: 'Bu tarih için zaten bir izin talebiniz var! 🚫' });
    }

    const leaveRequest = new LeaveRequest({
      userId, 
      requestedDate: toDateOnly(new Date(requestedDate)),
      reason
    });

    await leaveRequest.save();

    // Adminlere Mail Atma
    try {
      const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } });
      const adminEmails = admins.map(admin => admin.email);

      if (adminEmails.length > 0) {
        const requestingUser = await User.findById(userId);
        await sendEmail({
          email: adminEmails,
          subject: '⚠️ Yeni İzin Talebi - İTÜ Racing',
          message: `${requestingUser.name} adlı üye, ${new Date(requestedDate).toLocaleDateString('tr-TR')} tarihi için izin talebinde bulundu.\n\nMazeret: ${reason}`
        });
      }
    } catch (emailError) {
      console.error("E-posta gönderilemedi:", emailError.message);
    }
    
    res.status(201).json({ message: 'İzin talebiniz başarıyla oluşturuldu! 📩' });
  } catch (error) {
    console.error("İzin Talebi Hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// --- 2. ÜYENİN KENDİ İZİNLERİNİ GETİRMESİ ---
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ userId: req.user._id }).sort({ requestedDate: -1 });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'İzinleriniz getirilirken hata oluştu.' });
  }
};

// --- 3. ÜYENİN KENDİ İZNİNİ DÜZENLEMESİ ---
exports.updateMyLeave = async (req, res) => {
  try {
    const { reason } = req.body;
    const leave = await LeaveRequest.findOne({ _id: req.params.id, userId: req.user._id });

    if (!leave) return res.status(404).json({ message: 'İzin bulunamadı!' });
    
    leave.reason = reason;
    await leave.save();
    res.status(200).json({ message: 'Mazeretiniz güncellendi! ✏️' });
  } catch (error) {
    res.status(500).json({ message: 'Güncelleme hatası oluştu.' });
  }
};

// --- 4. ÜYENİN İZİN TALEBİNİ GERİ ÇEKMESİ (SİLMESİ) ---
exports.deleteMyLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findOne({ _id: req.params.id, userId: req.user._id });
    if (!leave) return res.status(404).json({ message: 'İzin bulunamadı!' });

    // Eğer onaylanmış bir izin siliniyorsa, yoklamadaki kaydı da temizleyelim
    const dateOnly = toDateOnly(leave.requestedDate);
    const nextDay = new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000);
    await Attendance.deleteMany({ 
      userId: req.user._id, 
      date: { $gte: dateOnly, $lt: nextDay },
      status: 'İzinli Yok' 
    });

    await LeaveRequest.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'İzin talebiniz başarıyla silindi. 🗑️' });
  } catch (error) {
    res.status(500).json({ message: 'Silme işlemi başarısız.' });
  }
};

// --- 5. TÜM İZİNLERİ GETİRME (ADMİNLER İÇİN) ---
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find()
      .populate({
        path: 'userId',
        select: 'name email studentId departmentId',
        populate: { path: 'departmentId', select: 'name' }
      })
      .sort({ createdAt: -1 });
      
    const formattedLeaves = leaves.map(leave => ({
      ...leave._doc,
      user: leave.userId 
    }));

    res.status(200).json(formattedLeaves);
  } catch (error) {
    res.status(500).json({ message: 'İzinler getirilirken hata oluştu.' });
  }
};

// --- 6. İZİN DURUMUNU GÜNCELLEME (ADMİNLER İÇİN) ---
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body; 
    const adminId = req.user._id;

    if (!['Onaylandı', 'Reddedildi', 'Bekliyor'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz statü.' });
    }

    const request = await LeaveRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'İzin bulunamadı!' });

    request.status = status;
    request.reviewedBy = status === 'Bekliyor' ? null : adminId; 
    await request.save();

    if (status === 'Onaylandı') {
      const dateOnly = toDateOnly(request.requestedDate);
      const nextDay = new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000);
      let attendance = await Attendance.findOne({ 
        userId: request.userId, 
        date: { $gte: dateOnly, $lt: nextDay }
      });
      if (!attendance) {
        attendance = new Attendance({
          userId: request.userId,
          date: dateOnly,
          status: 'İzinli Yok',
          colorCode: 'gray' 
        });
        await attendance.save();
      }
    } else if (status === 'Bekliyor' || status === 'Reddedildi') {
      const dateOnly = toDateOnly(request.requestedDate);
      const nextDay = new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000);
      await Attendance.deleteMany({ 
        userId: request.userId, 
        date: { $gte: dateOnly, $lt: nextDay },
        status: 'İzinli Yok' 
      });
    }

    res.status(200).json({ message: `İşlem başarılı: ${status}`, leave: request });
  } catch (error) {
    res.status(500).json({ message: 'İşlem sırasında hata oluştu.' });
  }
};