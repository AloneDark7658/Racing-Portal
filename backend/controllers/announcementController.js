const Announcement = require('../models/Announcement');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const fs = require('fs');
const path = require('path');

// --- 1. DUYURULARI GETİR ---
exports.getAnnouncements = async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    // Eğer istek atan kişi admin değilse, filtreleme yapıyoruz:
    // Ya "Tüm Takım"a (targetDepartments boş olanlar) atılanları görecek
    // Ya da hedef departmanların içinde kendi departmanı olanları görecek.
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      query = {
        $or: [
          { targetDepartments: { $exists: true, $size: 0 } }, // Tüm takım
          { targetDepartments: user.departmentId } // Üyenin kendi departmanı
        ]
      };
    }

    // Duyuruları en yeniden eskiye doğru sıralıyoruz ve yazar/departman isimlerini ekliyoruz
    const announcements = await Announcement.find(query)
      .populate('author', 'name')
      .populate('targetDepartments', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Duyurular getirilemedi.' });
  }
};

// --- 2. DUYURU OLUŞTUR (Sadece Adminler) ---
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    // targetDepartments FormData ile gelince string olarak gelebilir
    let targetDepartments = req.body.targetDepartments || [];
    if (typeof targetDepartments === 'string') {
      try { targetDepartments = JSON.parse(targetDepartments); } catch { targetDepartments = []; }
    }

    if (!title || !content) {
      return res.status(400).json({ message: 'Başlık ve içerik zorunludur.' });
    }

    // Multer'dan gelen dosyaları attachments formatına çevir
    const attachments = (req.files || []).map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype
    }));

    const announcement = new Announcement({
      title,
      content,
      author: req.user._id,
      targetDepartments,
      attachments
    });

    await announcement.save();

    // E-posta Bildirimi Gönderme
    try {
      let emailQuery = {};
      if (targetDepartments && targetDepartments.length > 0) {
        emailQuery = { departmentId: { $in: targetDepartments } };
      }
      let finalQuery = emailQuery;
      if (Object.keys(emailQuery).length > 0) {
        finalQuery = { $or: [emailQuery, { role: { $in: ['admin', 'superadmin'] } }] };
      }
      
      const usersToNotify = await User.find(finalQuery).select('email');
      const emails = [...new Set(usersToNotify.map(u => u.email).filter(Boolean))];

      // Varsa dosyaları mail eki için hazırla
      let emailAttachments = [];
      if (attachments && attachments.length > 0) {
        try {
          emailAttachments = attachments.map(f => ({
            filename: f.originalName,
            content: fs.readFileSync(path.join(__dirname, '..', 'uploads', f.filename))
          }));
        } catch (err) {
          console.error("Ekler okunamadı:", err.message);
        }
      }

      if (emails.length > 0) {
        // Postacıyı (Resend) çağır
        await sendEmail({
          email: emails, // array of emails
          subject: `📢 Yeni Duyuru: ${title}`,
          message: `İTÜ Racing Portalında yeni bir duyuru yayınlandı:\n\nBaşlık: ${title}\nDetay: ${content}\n\nLütfen portala giriş yaparak detayları kontrol ediniz.\n${process.env.FRONTEND_URL}`,
          attachments: emailAttachments
        });
      }
    } catch (emailErr) {
      console.error('Duyuru maili gönderilirken hata oluştu:', emailErr.message);
    }

    res.status(201).json({ message: 'Duyuru başarıyla oluşturuldu.', announcement });
  } catch (error) {
    res.status(500).json({ message: 'Duyuru oluşturulamadı.', error: error.message });
  }
};

// --- 3. DUYURU GÜNCELLE (Sadece Adminler) ---
exports.updateAnnouncement = async (req, res) => {
  try {
    const { title, content, targetDepartments } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Duyuru bulunamadı.' });
    }

    // Yeni gelen veriler varsa üstüne yazıyoruz
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (targetDepartments !== undefined) announcement.targetDepartments = targetDepartments;

    await announcement.save();

    // E-posta Bildirimi Gönderme (Güncelleme)
    try {
      let emailQuery = {};
      const updatedTargets = targetDepartments !== undefined ? targetDepartments : announcement.targetDepartments;
      if (updatedTargets && updatedTargets.length > 0) {
        emailQuery = { departmentId: { $in: updatedTargets } };
      }
      let finalQuery = emailQuery;
      if (Object.keys(emailQuery).length > 0) {
        finalQuery = { $or: [emailQuery, { role: { $in: ['admin', 'superadmin'] } }] };
      }
      
      const usersToNotify = await User.find(finalQuery).select('email');
      const emails = [...new Set(usersToNotify.map(u => u.email).filter(Boolean))];

      // Duyurunun mevcut eklerini mail eki için hazırla
      let emailAttachments = [];
      if (announcement.attachments && announcement.attachments.length > 0) {
        try {
          emailAttachments = announcement.attachments.map(f => ({
            filename: f.originalName,
            content: fs.readFileSync(path.join(__dirname, '..', 'uploads', f.filename))
          }));
        } catch (err) {
          console.error("Ekler okunamadı:", err.message);
        }
      }

      if (emails.length > 0) {
        // Postacıyı (Resend) çağır
        await sendEmail({
          email: emails, // array of emails
          subject: `📢 Duyuru Güncellendi: ${title || announcement.title}`,
          message: `İTÜ Racing Portalındaki bir duyuru GÜNCELLENDİ:\n\nBaşlık: ${title || announcement.title}\nDetay: ${content || announcement.content}\n\nLütfen portala giriş yaparak güncel detayları kontrol ediniz.\n${process.env.FRONTEND_URL}`,
          attachments: emailAttachments
        });
      }
    } catch (emailErr) {
      console.error('Duyuru güncelleme maili gönderilirken hata oluştu:', emailErr.message);
    }

    res.status(200).json({ message: 'Duyuru güncellendi.', announcement });
  } catch (error) {
    res.status(500).json({ message: 'Duyuru güncellenemedi.' });
  }
};

// --- 4. DUYURU SİL (Sadece Adminler — dosyaları diskten de temizle) ---
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Duyuru bulunamadı.' });
    }

    // Dosyaları diskten sil
    if (announcement.attachments && announcement.attachments.length > 0) {
      announcement.attachments.forEach(f => {
        const filePath = path.join(__dirname, '..', 'uploads', f.filename);
        fs.unlink(filePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error(`Dosya silinemedi: ${filePath}`, err.message);
          }
        });
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Duyuru silindi.' });
  } catch (error) {
    res.status(500).json({ message: 'Duyuru silinemedi.' });
  }
};