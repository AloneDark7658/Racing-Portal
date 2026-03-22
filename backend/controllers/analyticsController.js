const User = require('../models/User');
const Attendance = require('../models/Attendance');

const AttendanceSession = require('../models/AttendanceSession');
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

// --- YARDIMCI: Date-keyed Map (O(1) lookup) ---
const buildDateMap = (records, dateField = 'date') => {
  const map = new Map();
  records.forEach(r => {
    const key = formatDate(r[dateField]);
    if (key) map.set(key, r);
  });
  return map;
};

// --- ADMİN DASHBOARD İSTATİSTİKLERİNİ GETİRME (N+1 OPTİMİZE - FAZ 2) ---
exports.getDashboardStats = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find().sort({ date: 1 }).lean();
    const members = await User.find({ role: 'member' }).select('-password').populate('departmentId', 'name workSchedule').lean();
    
    const memberIds = members.map(m => m._id);
    const allRecords = await Attendance.find({ userId: { $in: memberIds } }).lean();
    const allLeaves = await Leave.find({ userId: { $in: memberIds }, status: 'Onaylandı' }).lean();

    const recordsByUser = {};
    allRecords.forEach(record => {
      const uid = record.userId.toString();
      if (!recordsByUser[uid]) recordsByUser[uid] = [];
      recordsByUser[uid].push(record);
    });

    const leavesByUser = {};
    allLeaves.forEach(l => {
      const uid = l.userId.toString();
      if (!leavesByUser[uid]) leavesByUser[uid] = [];
      leavesByUser[uid].push(l);
    });

    const teamStats = members.map(member => {
      const userRecords = recordsByUser[member._id.toString()] || [];
      const userLeaves = leavesByUser[member._id.toString()] || [];

      const attMap = buildDateMap(userRecords, 'date');
      const leaveMap = buildDateMap(userLeaves, 'requestedDate');

      let presentDays = 0, absentDays = 0, leaveDays = 0, totalDelayMinutes = 0;

      const userDeptId = member.departmentId ? member.departmentId._id.toString() : null;

      sessions.forEach(session => {
        const mandatoryIds = session.mandatoryDepartments ? session.mandatoryDepartments.map(id => id.toString()) : [];
        const isMandatory = userDeptId && mandatoryIds.includes(userDeptId);

        if (isMandatory) {
          const sDate = formatDate(session.date);
          const att = attMap.get(sDate);
          
          if (att) {
            if (att.status === 'İzinli Yok') leaveDays++;
            else {
              presentDays++;
              if (att.delayMinutes) totalDelayMinutes += att.delayMinutes;
            }
          } else {
            const isOnLeave = leaveMap.get(sDate);
            if (isOnLeave) leaveDays++;
            else absentDays++;
          }
        }
      });

      return {
        user: { 
          id: member._id, 
          name: member.name, 
          studentId: member.studentId,
          department: member.departmentId ? member.departmentId.name : ''
        },
        stats: {
          presentDays,
          absentDays,
          leaveDays,
          totalDelayMinutes
        }
      };
    });

    res.status(200).json({
      message: 'Takım istatistikleri başarıyla hesaplandı! 📊',
      data: teamStats
    });

  } catch (error) {
    console.error("Analiz Hatası:", error.message);
    res.status(500).json({ message: 'İstatistikler hesaplanırken sunucu hatası oluştu.' });
  }
};