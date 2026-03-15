const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // YENİ: Benzersiz, tek kullanımlık şifreler üretmek için eklendi
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession'); 
const User = require('../models/User');
const Leave = require('../models/LeaveRequest'); // Senin model adın ✅

// --- YARDIMCI SENSÖR: Tarihleri UTC ile YYYY-MM-DD olarak eşleştirir (timezone tutarlılığı için) ---
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

// 1. MEVCUT OTURUMU GETİR (Admin için)
exports.getActiveSession = async (req, res) => {
  try {
    const todayStr = formatDate(new Date());
    // Bugünün tarihine sahip oturumu bul
    const session = await AttendanceSession.findOne({ date: new Date(todayStr) });
    
    if (!session) {
      return res.status(404).json({ message: 'Bugün için henüz bir oturum açılmamış.' });
    }
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Oturum bilgisi alınamadı.' });
  }
};

// 2. YENİ QR ÜRET VEYA MEVCUDU VER (Admin için)
exports.generateQR = async (req, res) => {
  try {
    const { startTime } = req.body;
    const todayStr = formatDate(new Date());
    const todayDate = new Date(todayStr);

    let session = await AttendanceSession.findOne({ date: todayDate });

    if (session) {
      return res.status(200).json({ qrData: session.qrData, startTime: session.startTime, message: 'Mevcut oturum getirildi.' });
    }

    // YENİ: QR'ın benzersiz (kopyalanamaz) olması için 'salt' ekledik
    const qrPayload = {
      purpose: 'itu_racing_attendance',
      date: todayStr,
      startTime: startTime || '18:00',
      salt: crypto.randomBytes(8).toString('hex') 
    };

    const qrData = jwt.sign(qrPayload, process.env.JWT_SECRET, { expiresIn: '12h' });

    session = new AttendanceSession({
      date: todayDate,
      startTime: qrPayload.startTime,
      qrData: qrData,
      createdBy: req.user._id
    });

    await session.save();
    res.status(201).json({ qrData: session.qrData, startTime: session.startTime, message: 'Yeni oturum oluşturuldu!' });
  } catch (error) {
    res.status(500).json({ message: 'Oturum yönetimi hatası!' });
  }
};

// 3. QR OKUTMA (Üyeler için)
exports.scanQR = async (req, res) => {
  try {
    const { qrToken, deviceId } = req.body; // Frontend'den cihaz kimliği de gelecek
    console.log("Gelen Token:", qrToken); // Bunu ekle
    console.log("Gelen Cihaz ID:", deviceId); // Bunu ekle


    const userId = req.user._id;

    const decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
    const todayStr = formatDate(new Date());

    if (decoded.date !== todayStr) {
      return res.status(400).json({ message: 'Bu QR dünden kalmış veya geçersiz!' });
    }

    // A) KAREKOD YANMIŞ MI KONTROLÜ (Sadece veritabanındaki güncel QR kabul edilir)
    const session = await AttendanceSession.findOne({ date: new Date(todayStr) });
    if (!session || session.qrData !== qrToken) {
      return res.status(400).json({ 
        message: 'Bu karekod az önce başkası tarafından kullanıldı (Süresi doldu)! Lütfen ekrandaki yeni karekodu okutun.' 
      });
    }

    // B) CİHAZ (DEVICE ID) EŞLEŞTİRMESİ
    const user = await User.findById(userId);
    if (!user.deviceId) {
      // Üye ilk kez okutuyor, cihazı mühürle
      user.deviceId = deviceId;
      await user.save();
    } else if (user.deviceId !== deviceId) {
      // Başka telefondan kopya girişimi!
      return res.status(403).json({ 
        message: 'Güvenlik İhlali: Bu cihaz hesabınızla eşleşmiyor. Lütfen kendi telefonunuzu kullanın.' 
      });
    }

    // C) YOKLAMA KAYDI (Giriş veya Çıkış)
    let attendance = await Attendance.findOne({ userId, date: new Date(todayStr) });
    const scanTime = new Date();
    let responseMessage = '';

    if (!attendance) {
      // --- GİRİŞ İŞLEMİ (Eski algoritman korundu) ---
      const [h, m] = session.startTime.split(':');
      const targetTime = new Date();
      targetTime.setHours(parseInt(h), parseInt(m), 0, 0);

      let delay = 0;
      if (scanTime > targetTime) {
        delay = Math.floor((scanTime - targetTime) / (1000 * 60));
      }

      let color = 'green';
      if (delay > 0 && delay <= 15) color = 'yellow';
      else if (delay > 15 && delay <= 30) color = 'orange';
      else if (delay > 30) color = 'red';

      await Attendance.create({
        userId,
        date: new Date(todayStr),
        scanTime,
        status: 'Geldi',
        delayMinutes: delay,
        colorCode: color
      });
      responseMessage = 'Piste giriş başarılı! İyi mesailer. ✅';
    } else {
      // --- ÇIKIŞ İŞLEMİ ---
      attendance.checkOutTime = scanTime;
      await attendance.save();
      responseMessage = 'Çıkış saatiniz güncellendi. İyi dinlenmeler! 🏁';
    }

    // D) KAREKODU YAK VE YENİSİNİ ÜRET
    const newToken = jwt.sign({
      purpose: 'itu_racing_attendance',
      date: todayStr,
      startTime: session.startTime,
      salt: crypto.randomBytes(8).toString('hex') // Karekodu değiştiren sihirli tuz
    }, process.env.JWT_SECRET);
    
    session.qrData = newToken;
    await session.save();

    res.status(200).json({ message: responseMessage });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Geçersiz QR kod!' });
  }
};

// 4. BUGÜNÜN YOKLAMA LİSTESİNİ GETİR (Admin İçin)
exports.getTodayAttendance = async (req, res) => {
  try {
    const todayStr = formatDate(new Date());
    const attendances = await Attendance.find({ date: new Date(todayStr) })
      .populate('userId', 'name') 
      .sort({ scanTime: -1 });
    res.status(200).json(attendances);
  } catch (error) {
    res.status(500).json({ message: 'Canlı liste alınamadı.' });
  }
};

// 5. LİDERLİK TABLOSU ÖZETİ (Admin İçin - N+1 SORGU OPTİMİZE EDİLDİ - FAZ 2)
exports.getAttendanceSummary = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find().sort({ date: 1 });
    const users = await User.find().select('name role studentId departmentId').populate('departmentId', 'name');
    
    // TEK SORGUDA tüm yoklama ve izin kayıtlarını çek (N+1 yerine 2 sorgu)
    const allAttendances = await Attendance.find().lean();
    const allLeaves = await Leave.find({ status: 'Onaylandı' }).lean();

    // Hafızada kullanıcı bazlı grupla (Map ile O(1) erişim)
    const attByUser = {};
    allAttendances.forEach(a => {
      const uid = a.userId.toString();
      if (!attByUser[uid]) attByUser[uid] = [];
      attByUser[uid].push(a);
    });

    const leaveByUser = {};
    allLeaves.forEach(l => {
      const uid = l.userId.toString();
      if (!leaveByUser[uid]) leaveByUser[uid] = [];
      leaveByUser[uid].push(l);
    });

    const summary = users.map(user => {
      const uid = user._id.toString();
      const userAtts = attByUser[uid] || [];
      const userLeaves = leaveByUser[uid] || [];

      let green = 0, yellow = 0, red = 0, leave = 0;

      sessions.forEach(session => {
        const sDate = formatDate(session.date);
        const att = userAtts.find(a => formatDate(a.date) === sDate);
        
        if (att) {
          if (att.status === 'İzinli Yok') leave++;
          else if (att.colorCode === 'green') green++;
          else if (att.colorCode === 'yellow' || att.colorCode === 'orange') yellow++;
          else if (att.colorCode === 'red') red++;
        } else {
          const isOnLeave = userLeaves.find(l => formatDate(l.requestedDate) === sDate);
          if (isOnLeave) leave++;
        }
      });

      let absent = sessions.length - (green + yellow + red + leave);
      return {
        _id: user._id,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
        department: user.departmentId ? user.departmentId.name : '',
        departmentId: user.departmentId ? user.departmentId._id : '',
        green, yellow, red, leave,
        absent: absent < 0 ? 0 : absent,
        totalSessions: sessions.length
      };
    });

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Özet tablo hatası.' });
  }
};

// 6. DOLAR GRAFİĞİ İÇİN KİŞİSEL VERİ (Ortak Motor)
const generateGraphData = async (userId) => {
  const sessions = await AttendanceSession.find().sort({ date: 1 });
  const userAttendances = await Attendance.find({ userId });
  const userLeaves = await Leave.find({ userId, status: 'Onaylandı' });

  return sessions.map(session => {
    const sDate = formatDate(session.date);
    const record = userAttendances.find(a => formatDate(a.date) === sDate);
    const isOnLeave = userLeaves.find(l => formatDate(l.requestedDate) === sDate);

    let score = 0, status = 'Devamsız', delay = 0;

    if (record) {
      delay = record.delayMinutes;
      if (record.status === 'İzinli Yok') { score = 0; status = 'İzinli'; }
      else if (record.colorCode === 'green') { score = 3; status = 'Zamanında'; }
      else if (record.colorCode === 'yellow' || record.colorCode === 'orange') { score = 2; status = 'Gecikmeli'; }
      else if (record.colorCode === 'red') { score = 1; status = 'Çok Geç'; }
    } else if (isOnLeave) {
      score = 0; 
      status = 'İzinli'; 
    }

    return { date: sDate, score, status, delay };
  });
};

exports.getUserAttendanceGraph = async (req, res) => {
  try {
    const data = await generateGraphData(req.params.userId);
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: 'Grafik hatası.' }); }
};

exports.getMyGraph = async (req, res) => {
  try {
    const data = await generateGraphData(req.user._id);
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: 'Grafik hatası.' }); }
};

// 7. SÜRÜCÜ KENDİ ÖZETİ (Dashboard Kutuları)
exports.getMySummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessions = await AttendanceSession.find().sort({ date: 1 });
    const userAtts = await Attendance.find({ userId });
    const userLeaves = await Leave.find({ userId, status: 'Onaylandı' });

    let green = 0, yellow = 0, red = 0, leave = 0;

    sessions.forEach(session => {
      const sDate = formatDate(session.date);
      const att = userAtts.find(a => formatDate(a.date) === sDate);
      const isOnLeave = userLeaves.find(l => formatDate(l.requestedDate) === sDate);

      if (att) {
        if (att.status === 'İzinli Yok') leave++;
        else if (att.colorCode === 'green') green++;
        else if (att.colorCode === 'yellow' || att.colorCode === 'orange') yellow++;
        else if (att.colorCode === 'red') red++;
      } else if (isOnLeave) {
        leave++;
      }
    });

    let absent = sessions.length - (green + yellow + red + leave);
    res.status(200).json({ 
      green, yellow, red, leave, 
      absent: absent < 0 ? 0 : absent, 
      totalSessions: sessions.length 
    });
  } catch (error) {
    res.status(500).json({ message: 'Kişisel özet hatası.' });
  }
};