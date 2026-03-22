const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession'); 
const User = require('../models/User');
const Department = require('../models/Department');
const Leave = require('../models/LeaveRequest');

// --- YARDIMCI: Tarihleri UTC ile YYYY-MM-DD olarak eşleştirir ---
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

// --- YARDIMCI: JS getDay() (0=Pazar) formatını bizim formata (0=Pazartesi, 6=Pazar) çevirir ---
const getLocalDayIndex = (date) => {
  const jsDay = new Date(date).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
};

// --- YARDIMCI: Attendance array'ini date-keyed Map'e dönüştürür (O(1) lookup) ---
const buildDateMap = (records, dateField = 'date') => {
  const map = new Map();
  records.forEach(r => {
    const key = formatDate(r[dateField]);
    if (key) map.set(key, r);
  });
  return map;
};

// 1. MEVCUT OTURUMU GETİR (Admin için)
exports.getActiveSession = async (req, res) => {
  try {
    const todayStr = formatDate(new Date());
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
    const { startTime, exemptDepartments = [], extraDepartments = [] } = req.body;
    const todayStr = formatDate(new Date());
    const todayDate = new Date(todayStr);

    const localDay = getLocalDayIndex(todayDate);
    const allDepartments = await Department.find().lean();
    
    // Compute mandatoryDepartments
    const mandatorySet = new Set();
    
    allDepartments.forEach(dept => {
      const isNormallyWorking = dept.workSchedule && dept.workSchedule.daysOfWeek && dept.workSchedule.daysOfWeek.includes(localDay);
      const deptIdStr = dept._id.toString();
      
      const isExempt = exemptDepartments.some(id => id.toString() === deptIdStr);
      const isExtra = extraDepartments.some(id => id.toString() === deptIdStr);

      if ((isNormallyWorking && !isExempt) || isExtra) {
        mandatorySet.add(deptIdStr);
      }
    });
    
    const mandatoryDepartments = Array.from(mandatorySet);

    let session = await AttendanceSession.findOne({ date: todayDate });

    if (session) {
      if (req.body.exemptDepartments || req.body.extraDepartments) {
        session.exemptDepartments = exemptDepartments;
        session.extraDepartments = extraDepartments;
        session.mandatoryDepartments = mandatoryDepartments;
        await session.save();
      }
      return res.status(200).json({ qrData: session.qrData, startTime: session.startTime, message: 'Mevcut oturum getirildi ve güncellendi.' });
    }

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
      createdBy: req.user._id,
      exemptDepartments: exemptDepartments,
      extraDepartments: extraDepartments,
      mandatoryDepartments: mandatoryDepartments
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
    const { qrToken, deviceId } = req.body;

    const userId = req.user._id;

    const decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
    const todayStr = formatDate(new Date());

    if (decoded.date !== todayStr) {
      return res.status(400).json({ message: 'Bu QR dünden kalmış veya geçersiz!' });
    }

    // A) KAREKOD YANMIŞ MI KONTROLÜ
    const session = await AttendanceSession.findOne({ date: new Date(todayStr) });
    if (!session || session.qrData !== qrToken) {
      return res.status(400).json({ 
        message: 'Bu karekod az önce başkası tarafından kullanıldı (Süresi doldu)! Lütfen ekrandaki yeni karekodu okutun.' 
      });
    }

    // B) CİHAZ EŞLEŞTİRMESİ
    const user = await User.findById(userId);
    if (!user.deviceId) {
      user.deviceId = deviceId;
      await user.save();
    } else if (user.deviceId !== deviceId) {
      return res.status(403).json({ 
        message: 'Güvenlik İhlali: Bu cihaz hesabınızla eşleşmiyor. Lütfen kendi telefonunuzu kullanın.' 
      });
    }

    // C) YOKLAMA KAYDI (Giriş veya Çıkış)
    let attendance = await Attendance.findOne({ userId, date: new Date(todayStr) });
    const scanTime = new Date();
    let responseMessage = '';

    if (!attendance) {
      // --- GİRİŞ İŞLEMİ ---
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

    // D) KAREKODU YAK VE YENİSİNİ ÜRET (expiresIn eklendi!)
    const newToken = jwt.sign({
      purpose: 'itu_racing_attendance',
      date: todayStr,
      startTime: session.startTime,
      salt: crypto.randomBytes(8).toString('hex')
    }, process.env.JWT_SECRET, { expiresIn: '12h' });
    
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
    const todayDate = new Date(todayStr);

    const session = await AttendanceSession.findOne({ date: todayDate }).lean();
    if (!session) return res.status(200).json([]);

    const localDay = getLocalDayIndex(session.date);
    const exemptIds = session.exemptDepartments ? session.exemptDepartments.map(id => id.toString()) : [];

    const attendances = await Attendance.find({ date: todayDate })
      .populate({
        path: 'userId',
        select: 'name departmentId',
        populate: { path: 'departmentId', select: 'name workSchedule' }
      })
      .sort({ scanTime: -1 })
      .lean();

    const mandatoryIds = session.mandatoryDepartments ? session.mandatoryDepartments.map(id => id.toString()) : [];

    const filteredAttendances = attendances.filter(att => {
      const user = att.userId;
      if (!user) return false;
      
      const userDeptId = user.departmentId ? user.departmentId._id.toString() : null;
      const isMandatory = userDeptId && mandatoryIds.includes(userDeptId);

      return isMandatory;
    });

    res.status(200).json(filteredAttendances);
  } catch (error) {
    res.status(500).json({ message: 'Canlı liste alınamadı.' });
  }
};

// 5. LİDERLİK TABLOSU ÖZETİ (Admin İçin - Map ile O(1) lookup)
exports.getAttendanceSummary = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find().sort({ date: 1 }).lean();
    const users = await User.find().select('name role studentId departmentId').populate('departmentId', 'name workSchedule').lean();
    
    // TEK SORGUDA tüm yoklama ve izin kayıtlarını çek
    const allAttendances = await Attendance.find().lean();
    const allLeaves = await Leave.find({ status: 'Onaylandı' }).lean();

    // Kullanıcı bazlı date-keyed Map'ler oluştur (O(1) erişim)
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

      // Array.find() yerine Map kullan → O(1) lookup
      const attMap = buildDateMap(userAtts, 'date');
      const leaveMap = buildDateMap(userLeaves, 'requestedDate');

      let green = 0, yellow = 0, red = 0, leave = 0, totalValidSessions = 0;

      const userDeptId = user.departmentId ? user.departmentId._id.toString() : null;

      sessions.forEach(session => {
        const mandatoryIds = session.mandatoryDepartments ? session.mandatoryDepartments.map(id => id.toString()) : [];
        const isMandatory = userDeptId && mandatoryIds.includes(userDeptId);

        if (isMandatory) {
          totalValidSessions++;

          const sDate = formatDate(session.date);
          const att = attMap.get(sDate);
          
          if (att) {
            if (att.status === 'İzinli Yok') leave++;
            else if (att.colorCode === 'green') green++;
            else if (att.colorCode === 'yellow' || att.colorCode === 'orange') yellow++;
            else if (att.colorCode === 'red') red++;
          } else {
            const isOnLeave = leaveMap.get(sDate);
            if (isOnLeave) leave++;
          }
        }
      });

      let absent = totalValidSessions - (green + yellow + red + leave);
      return {
        _id: user._id,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
        department: user.departmentId ? user.departmentId.name : '',
        departmentId: user.departmentId ? user.departmentId._id : '',
        green, yellow, red, leave,
        absent: absent < 0 ? 0 : absent,
        totalSessions: totalValidSessions
      };
    });

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Özet tablo hatası.' });
  }
};

// 6. KİŞİSEL GRAFİK VERİSİ (Ortak Motor — Map ile optimize edildi)
const generateGraphData = async (userId) => {
  const [sessions, userAttendances, userLeaves, user] = await Promise.all([
    AttendanceSession.find().sort({ date: 1 }).lean(),
    Attendance.find({ userId }).lean(),
    Leave.find({ userId, status: 'Onaylandı' }).lean(),
    User.findById(userId).populate('departmentId', 'workSchedule').lean()
  ]);

  const attMap = buildDateMap(userAttendances, 'date');
  const leaveMap = buildDateMap(userLeaves, 'requestedDate');

  const userDeptId = user && user.departmentId ? user.departmentId._id.toString() : null;

  const graphData = [];

  sessions.forEach(session => {
    const mandatoryIds = session.mandatoryDepartments ? session.mandatoryDepartments.map(id => id.toString()) : [];
    const isMandatory = userDeptId && mandatoryIds.includes(userDeptId);

    const sDate = formatDate(session.date);

    if (isMandatory) {
      const record = attMap.get(sDate);
      const isOnLeave = leaveMap.get(sDate);

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

      graphData.push({ date: sDate, score, status, delay });
    } else {
      graphData.push({ date: sDate, score: 0, status: 'Mesai Yok', delay: 0 });
    }
  });

  return graphData;
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

// 7. SÜRÜCÜ KENDİ ÖZETİ (Dashboard Kutuları — Map ile optimize edildi)
exports.getMySummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const [sessions, userAtts, userLeaves, user] = await Promise.all([
      AttendanceSession.find().sort({ date: 1 }).lean(),
      Attendance.find({ userId }).lean(),
      Leave.find({ userId, status: 'Onaylandı' }).lean(),
      User.findById(userId).populate('departmentId', 'workSchedule').lean()
    ]);

    const attMap = buildDateMap(userAtts, 'date');
    const leaveMap = buildDateMap(userLeaves, 'requestedDate');

    let green = 0, yellow = 0, red = 0, leave = 0, totalValidSessions = 0;

    const userDeptId = user && user.departmentId ? user.departmentId._id.toString() : null;

    sessions.forEach(session => {
      const mandatoryIds = session.mandatoryDepartments ? session.mandatoryDepartments.map(id => id.toString()) : [];
      const isMandatory = userDeptId && mandatoryIds.includes(userDeptId);

      if (isMandatory) {
        totalValidSessions++;

        const sDate = formatDate(session.date);
        const att = attMap.get(sDate);
        const isOnLeave = leaveMap.get(sDate);

        if (att) {
          if (att.status === 'İzinli Yok') leave++;
          else if (att.colorCode === 'green') green++;
          else if (att.colorCode === 'yellow' || att.colorCode === 'orange') yellow++;
          else if (att.colorCode === 'red') red++;
        } else if (isOnLeave) {
          leave++;
        }
      }
    });

    let absent = totalValidSessions - (green + yellow + red + leave);
    res.status(200).json({ 
      green, yellow, red, leave, 
      absent: absent < 0 ? 0 : absent, 
      totalSessions: totalValidSessions 
    });
  } catch (error) {
    res.status(500).json({ message: 'Kişisel özet hatası.' });
  }
};