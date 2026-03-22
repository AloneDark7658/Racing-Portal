const sendEmail = require('../utils/sendEmail');
const path = require('path');
const fs = require('fs');

exports.submitFeedback = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      // Dosya yüklenmişse de mesaj yok diye reddediyorsak, dosyayı temizleyelim
      if (req.file) {
        fs.unlink(path.join(__dirname, '..', 'uploads', req.file.filename), () => { });
      }
      return res.status(400).json({ message: 'Lütfen bir geri bildirim mesajı girin.' });
    }

    const userName = req.user ? req.user.name : 'Bilinmeyen Kullanıcı';
    const userEmail = req.user ? req.user.email : 'Bilinmeyen E-posta';

    const emailOptions = {
      email: ['bahadirkart0@gmail.com', 'ossaggelen@gmail.com'], // Placeholder developer emails
      subject: `🚨 Yeni Hata/Geri Bildirim Bildirimi - ${userName}`,
      message: `İTÜ Racing Portal üzerinden yeni bir geri bildirim aldınız.\n\nGönderen: ${userName} (${userEmail})\n\nMesaj:\n${message}\n`,
      attachments: []
    };

    if (req.file) {
      try {
        emailOptions.attachments.push({
          filename: req.file.originalname || req.file.filename,
          content: fs.readFileSync(path.join(__dirname, '..', 'uploads', req.file.filename))
        });
      } catch (err) {
        console.error("Geri bildirim eki okunamadı:", err.message);
      }
    }

    await sendEmail(emailOptions);

    // Diski doldurmaması açısından geri bildirim için yüklenen logları/ss'leri eposta atıldıktan sonra siliyoruz
    if (req.file) {
      fs.unlink(path.join(__dirname, '..', 'uploads', req.file.filename), (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error(`Geri bildirim dosyası silinemedi:`, err.message);
        }
      });
    }

    res.status(200).json({ message: 'Geri bildirim başarıyla iletildi! Teşekkür ederiz.' });
  } catch (error) {
    if (req.file) {
      fs.unlink(path.join(__dirname, '..', 'uploads', req.file.filename), () => { });
    }
    res.status(500).json({ message: 'Geri bildirim gönderilirken bir hata oluştu.', error: error.message });
  }
};
