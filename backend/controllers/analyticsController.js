const User = require('../models/User');
const Attendance = require('../models/Attendance');

// --- ADMİN DASHBOARD İSTATİSTİKLERİNİ GETİRME ---
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Sistemdeki sadece normal 'member' (üye) rolündeki kullanıcıları bulalım
    // Şifreleri çekmemize gerek yok, o yüzden select('-password') diyoruz
    const members = await User.find({ role: 'member' }).select('-password');
    
    const teamStats = [];

    // 2. Her bir üye için tek tek yoklama geçmişini hesaplayalım
    for (let member of members) {
      // Bu üyeye ait tüm yoklama kayıtlarını bul
      const records = await Attendance.find({ userId: member._id });
      
      let totalDelay = 0;
      let presentCount = 0;
      let absentCount = 0; // İzinsiz yok
      let leaveCount = 0;  // İzinli yok

      // Kayıtları dönerek sayıları toplayalım
      records.forEach(record => {
        if (record.status === 'Geldi') {
          presentCount++;
          totalDelay += record.delayMinutes; // Sadece geldiği günlerdeki gecikmeleri topla
        } else if (record.status === 'İzinsiz Yok') {
          absentCount++;
        } else if (record.status === 'İzinli Yok') {
          leaveCount++;
        }
      });

      // 3. Üyenin özet istatistiğini listeye ekle
      teamStats.push({
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
      });
    }

    // 4. Tüm takımın verisini Admin'e gönder
    res.status(200).json({
      message: 'Takım istatistikleri başarıyla hesaplandı! 📊',
      data: teamStats
    });

  } catch (error) {
    console.error("Analiz Hatası:", error.message);
    res.status(500).json({ message: 'İstatistikler hesaplanırken sunucu hatası oluştu.' });
  }
};