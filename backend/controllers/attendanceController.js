const jwt = require('jsonwebtoken');
const Attendance = require('../models/Attendance');

// --- 1. GÜNLÜK QR KOD İÇERİĞİ OLUŞTURMA (Sadece Admin) ---
exports.generateQR = async (req, res) => {
  try {
    // O güne özel şifreli bir metin (QR içeriği) hazırlıyoruz.
    // İçine bugünün tarihini koyuyoruz.
    const today = new Date().toISOString().split('T')[0]; // Örn: "2026-03-07"

    const qrPayload = {
      purpose: 'itu_racing_attendance',
      date: today
    };

    // Bu veriyi gizli anahtarımızla şifreliyoruz. (12 saat sonra QR geçersiz olacak)
    const secureQrString = jwt.sign(qrPayload, process.env.JWT_SECRET, { expiresIn: '12h' });

    res.status(200).json({
      message: 'Bugün için QR kod metni başarıyla oluşturuldu! 🏎️',
      qrData: secureQrString,
      date: today
    });

  } catch (error) {
    console.error("QR Oluşturma Hatası:", error.message);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// --- 2. ÜYENİN QR KODU OKUTMASI VE YOKLAMA ALINMASI (Tüm Üyeler) ---
exports.scanQR = async (req, res) => {
  try {
    const { qrToken } = req.body; // Frontend'den (telefondan okutulan) şifreli metin
    const userId = req.user._id;  // Giriş yapmış olan üyenin ID'si (Middleware'den geliyor)

    // 1. QR Kod geçerli mi ve bizim sistemin mi?
    const decodedQr = jwt.verify(qrToken, process.env.JWT_SECRET);
    
    // 2. Bugünün QR kodu mu? (Dünün fotoğrafını çekip okutmayı engeller)
    const today = new Date().toISOString().split('T')[0];
    if (decodedQr.date !== today) {
       return res.status(400).json({ message: 'Bu QR kodun süresi geçmiş veya bugüne ait değil!' });
    }

    // 3. Kullanıcı bugün zaten yoklama almış mı kontrolü
    // Dikkat: Burada new Date(today) kullanarak sadece tarihi baz alıyoruz
    let attendance = await Attendance.findOne({ userId, date: new Date(today) });
    if (attendance) {
       return res.status(400).json({ message: 'Bugün zaten yoklamanızı aldınız! 🏎️' });
    }

    // 4. Geç kalma hesabı (Örn: Mesai 09:00'da başlıyor diyelim - bunu sonra dinamik yapabiliriz)
    const scanTime = new Date();
    const workStartTime = new Date();
    workStartTime.setHours(9, 0, 0, 0); // İşe başlama saati: 09:00

    let delayMinutes = 0;
    if (scanTime > workStartTime) {
        // Aradaki farkı milisaniyeden dakikaya çeviriyoruz
        delayMinutes = Math.floor((scanTime - workStartTime) / (1000 * 60));
    }

    // 5. PRD'ye göre Renk Kodu Belirleme
    let colorCode = 'green'; // Zamanında geldi
    if (delayMinutes > 0 && delayMinutes <= 15) colorCode = 'yellow';
    else if (delayMinutes > 15 && delayMinutes <= 30) colorCode = 'orange';
    else if (delayMinutes > 30) colorCode = 'red';

    // 6. Veri tabanına kaydet
    attendance = new Attendance({
      userId,
      date: new Date(today), // Sadece gün bilgisini kaydediyoruz
      scanTime, // Tam okutma anı
      status: 'Geldi',
      delayMinutes,
      colorCode
    });

    await attendance.save();

    res.status(200).json({ 
        message: 'Yoklama başarıyla alındı! 🏁', 
        delayMinutes: `${delayMinutes} dakika gecikme`,
        colorCode
    });

  } catch (error) {
    console.error("Yoklama Okutma Hatası:", error.message);
    res.status(400).json({ message: 'Geçersiz veya bozuk QR kod okutuldu!' });
  }
};