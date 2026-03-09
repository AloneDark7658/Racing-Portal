const jwt = require('jsonwebtoken');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession'); 
const User = require('../models/User');
const Leave = require('../models/LeaveRequest'); // Senin model adın ✅

// --- YARDIMCI SENSÖR: Tarihleri UTC sapması olmadan YYYY-MM-DD olarak eşleştirir ---
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
      return res.status(200).json({ 
        qrData: session.qrData, 
        startTime: session.startTime, 
        message: 'Mevcut oturum getirildi.' 
      });
    }

    const qrPayload = {
      purpose: 'itu_racing_attendance',
      date: todayStr,
      startTime: startTime || '18:00'
    };

    const qrData = jwt.sign(qrPayload, process.env.JWT_SECRET, { expiresIn: '12h' });

    session = new AttendanceSession({
      date: todayDate,
      startTime: qrPayload.startTime,
      qrData: qrData,
      createdBy: req.user._id
    });

    await session.save();

    res.status(201).json({ 
      qrData: session.qrData, 
      startTime: session.startTime, 
      message: 'Yeni oturum başarıyla oluşturuldu! 🏁' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Oturum yönetimi hatası!' });
  }
};

// 3. QR OKUTMA (Üyeler için)
exports.scanQR = async (req, res) => {
  try {
    const { qrToken } = req.body;
    const userId = req.user._id;

    const decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
    const todayStr = formatDate(new Date());

    if (decoded.date !== todayStr) {
      return res.status(400).json({ message: 'Bu QR dünden kalmış veya geçersiz!' });
    }

    const scanTime = new Date();
    const [h, m] = decoded.startTime.split(':');
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

    const attendance = await Attendance.findOneAndUpdate(
      { userId, date: new Date(todayStr) },
      { status: 'Geldi', scanTime, delayMinutes: delay, colorCode: color },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Piste giriş başarılı! ✅', delay, color });
  } catch (error) {
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

// 5. LİDERLİK TABLOSU ÖZETİ (Admin İçin - İZİNLİ DESTEKLİ)
exports.getAttendanceSummary = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find().sort({ date: 1 });
    const users = await User.find().select('name role'); 
    
    const summary = await Promise.all(users.map(async (user) => {
      const userAtts = await Attendance.find({ userId: user._id });
      const userLeaves = await Leave.find({ userId: user._id, status: 'Onaylandı' });

      let green = 0, yellow = 0, red = 0, leave = 0;

      sessions.forEach(session => {
        const sDate = formatDate(session.date);
        const att = userAtts.find(a => formatDate(a.date) === sDate);
        
        if (att) {
          if (att.colorCode === 'green') green++;
          else if (att.colorCode === 'yellow' || att.colorCode === 'orange') yellow++;
          else if (att.colorCode === 'red') red++;
        } else {
          // requestedDate üzerinden tarih kontrolü
          const isOnLeave = userLeaves.find(l => formatDate(l.requestedDate) === sDate);
          if (isOnLeave) leave++;
        }
      });

      let absent = sessions.length - (green + yellow + red + leave);
      return {
        _id: user._id,
        name: user.name,
        role: user.role,
        green, yellow, red, leave,
        absent: absent < 0 ? 0 : absent,
        totalSessions: sessions.length
      };
    }));

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
      if (record.colorCode === 'green') { score = 3; status = 'Zamanında'; }
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
        if (att.colorCode === 'green') green++;
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