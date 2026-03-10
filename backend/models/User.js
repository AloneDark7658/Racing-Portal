const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Lütfen bir isim girin'] 
  },
  email: { 
    type: String, 
    required: [true, 'Lütfen bir e-posta girin'], 
    unique: true // Aynı e-posta ile iki kişi kayıt olamaz
  },
  password: { 
    type: String, 
    required: [true, 'Lütfen bir şifre belirleyin'] 
  },
  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'member'], 
    default: 'member' 
  },
  studentId: { 
    type: String,
    unique: true // Aynı öğrenci numarasıyla iki kişi kayıt olamaz (Bunu da ekledik)
  },
  departmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department',
    default: null 
  }, 
  createdAt: { 
    type: Date, 
    default: Date.now 
  },

  // --- YENİ: Başka telefondan QR okutmayı engellemek için ---
  deviceId: { 
    type: String, 
    default: null 
  },
  
  // --- ŞİFRE SIFIRLAMA İÇİN EKLENEN YENİ ALANLAR ---
  resetPasswordToken: String,
  resetPasswordExpire: Date
  // ------------------------------------------------
});

module.exports = mongoose.model('User', userSchema);