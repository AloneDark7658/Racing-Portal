const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const User = require('../models/User'); // EKLENDİ: Adminleri bulmak için
const sendEmail = require('../utils/sendEmail'); // EKLENDİ: Postacımız

// --- 1. ÜYENİN İZİN TALEBİ OLUŞTURMASI ---
exports.createLeaveRequest = async (req, res) => {
  try {
    const { requestedDate, reason } = req.body;
    const userId = req.user._id; // İstek atan üye

    // 1. O gün için zaten bir talep var mı?
    const existingRequest = await LeaveRequest.findOne({ userId, requestedDate: new Date(requestedDate) });
    if (existingRequest) {
      return res.status(400).json({ message: 'Bu tarih için zaten bir izin talebiniz bulunuyor!' });
    }

    // 2. Yeni talebi oluştur
    const leaveRequest = new LeaveRequest({
      userId,
      requestedDate: new Date(requestedDate),
      reason
    });

    await leaveRequest.save();

    // --- YENİ EKLENEN KISIM: ADMİNLERE E-POSTA GÖNDERME (RESEND İLE) ---
    try {
      // 1. Sistemdeki tüm Adminleri (veya Süperadminleri) bul
      const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } });
      
      // 2. Adminlerin e-postalarını bir dizi (array) haline getir
      const adminEmails = admins.map(admin => admin.email);

      // 3. Eğer sistemde en az bir admin varsa e-posta gönder
      if (adminEmails.length > 0) {
        // İzni isteyen üyenin adını bulalım
        const requestingUser = await User.findById(userId);

        // Postacıyı çağır ve mesajı gönder
        await sendEmail({
          email: adminEmails, // Tüm admin e-postaları
          subject: '⚠️ Yeni İzin Talebi - İTÜ Racing',
          message: `${requestingUser.name} adlı üye, ${new Date(requestedDate).toLocaleDateString('tr-TR')} tarihi için izin talebinde bulundu.\n\nMazeret: ${reason}\n\nLütfen sisteme girerek talebi onaylayın veya reddedin.`
        });
      }
    } catch (emailError) {
      console.error("E-posta gönderilemedi:", emailError.message);
      // E-posta gitmese bile izin veri tabanına kaydedildiği için sistemi çökertmiyoruz, sadece hatayı logluyoruz.
    }
    // --- YENİ EKLENEN KISIM SONU ---
    
    res.status(201).json({ message: 'İzin talebiniz başarıyla oluşturuldu ve Admin onayına sunuldu. 📩' });
  } catch (error) {
    console.error("İzin Talebi Hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// --- 2. ADMİNİN İZİN TALEBİNİ ONAYLAMASI VEYA REDDETMESİ ---
exports.reviewLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params; // URL'den gelecek ID
    const { status } = req.body; // 'Onaylandı' veya 'Reddedildi'
    const adminId = req.user._id;

    if (!['Onaylandı', 'Reddedildi'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz statü. Sadece Onaylandı veya Reddedildi olabilir.' });
    }

    // 1. Talebi bul ve güncelle
    const request = await LeaveRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'İzin talebi bulunamadı!' });
    }

    request.status = status;
    request.reviewedBy = adminId;
    await request.save();

    // 2. Eğer onaylandıysa, Yoklama tablosuna 'İzinli Yok' olarak işle
    if (status === 'Onaylandı') {
      // Önce o gün için bir yoklama kaydı var mı diye bakıyoruz
      let attendance = await Attendance.findOne({ userId: request.userId, date: request.requestedDate });
      
      if (!attendance) {
        // Yoksa yeni bir kayıt oluşturuyoruz
        attendance = new Attendance({
          userId: request.userId,
          date: request.requestedDate,
          status: 'İzinli Yok',
          colorCode: 'gray' // İzinli olduğu için gri
        });
        await attendance.save();
      } else {
         // Varsa güncelliyoruz (Nadiren olur ama garantiye alalım)
         attendance.status = 'İzinli Yok';
         attendance.colorCode = 'gray';
         await attendance.save();
      }
    }

    res.status(200).json({ message: `İzin talebi başarıyla ${status}! ✅` });
  } catch (error) {
    console.error("İzin Onay Hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};