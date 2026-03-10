const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Hangi kullanıcının yoklaması olduğunu User tablosuyla bağlarız
    required: true 
  },
  date: { 
    type: Date, 
    required: true // Çalışma günü (Örn: 8 Mart 2026)
  },
  scanTime: { 
    type: Date // QR kodun tam olarak okutulduğu saat ve dakika
  },
  status: { 
    type: String, 
    enum: ['Geldi', 'İzinli Yok', 'İzinsiz Yok'], 
    required: true 
  },
  delayMinutes: { 
    type: Number, 
    default: 0 // Kaç dakika geç kaldı?
  },
  colorCode: { 
    type: String, 
    enum: ['green', 'yellow', 'orange', 'red', 'gray'], 
    default: 'gray'
  },

  // --- YENİ: Mesai bitimi çıkış saati ---
  checkOutTime: { 
    type: Date,
    default: null
  }

});

module.exports = mongoose.model('Attendance', attendanceSchema);