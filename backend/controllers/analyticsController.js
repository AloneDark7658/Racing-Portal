const User = require('../models/User');
const Attendance = require('../models/Attendance');

// --- ADMİN DASHBOARD İSTATİSTİKLERİNİ GETİRME (N+1 OPTİMİZE - FAZ 2) ---
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Sistemdeki sadece normal 'member' (üye) rolündeki kullanıcıları bulalım
    const members = await User.find({ role: 'member' }).select('-password').lean();
    
    // 2. TÜM yoklama kayıtlarını TEK SORGUDA çek (N+1 yerine 1 sorgu)
    const memberIds = members.map(m => m._id);
    const allRecords = await Attendance.find({ userId: { $in: memberIds } }).lean();

    // 3. Hafızada kullanıcı bazlı grupla
    const recordsByUser = {};
    allRecords.forEach(record => {
      const uid = record.userId.toString();
      if (!recordsByUser[uid]) recordsByUser[uid] = [];
      recordsByUser[uid].push(record);
    });

    // 4. Her üye için hesaplama yap (DB sorgusu SIFIR)
    const teamStats = members.map(member => {
      const records = recordsByUser[member._id.toString()] || [];
      
      let totalDelay = 0;
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;

      records.forEach(record => {
        if (record.status === 'Geldi') {
          presentCount++;
          totalDelay += record.delayMinutes;
        } else if (record.status === 'İzinsiz Yok') {
          absentCount++;
        } else if (record.status === 'İzinli Yok') {
          leaveCount++;
        }
      });

      return {
        user: { 
          id: member._id, 
          name: member.name, 
          studentId: member.studentId 
        },
        stats: {
          presentDays: presentCount,
          absentDays: absentCount,
          leaveDays: leaveCount,
          totalDelayMinutes: totalDelay
        }
      };
    });

    // 5. Tüm takımın verisini Admin'e gönder
    res.status(200).json({
      message: 'Takım istatistikleri başarıyla hesaplandı! 📊',
      data: teamStats
    });

  } catch (error) {
    console.error("Analiz Hatası:", error.message);
    res.status(500).json({ message: 'İstatistikler hesaplanırken sunucu hatası oluştu.' });
  }
};