const Announcement = require('../models/Announcement');

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
    const { title, content, targetDepartments } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Başlık ve içerik zorunludur.' });
    }

    const announcement = new Announcement({
      title,
      content,
      author: req.user._id,
      targetDepartments: targetDepartments || [] // Eğer departman seçilmediyse boş liste yap
    });

    await announcement.save();
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
    res.status(200).json({ message: 'Duyuru güncellendi.', announcement });
  } catch (error) {
    res.status(500).json({ message: 'Duyuru güncellenemedi.' });
  }
};

// --- 4. DUYURU SİL (Sadece Adminler) ---
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Duyuru bulunamadı.' });
    }
    res.status(200).json({ message: 'Duyuru silindi.' });
  } catch (error) {
    res.status(500).json({ message: 'Duyuru silinemedi.' });
  }
};