const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Lütfen bir isim girin'] 
  },
  email: { 
    type: String, 
    required: [true, 'Lütfen bir e-posta girin'], 
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Lütfen geçerli bir e-posta adresi girin']
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
    unique: true
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

  // --- Başka telefondan QR okutmayı engellemek için ---
  deviceId: { 
    type: String, 
    default: null 
  },

  // --- E-POSTA DOĞRULAMA ---
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  
  // --- ŞİFRE SIFIRLAMA ---
  resetPasswordToken: String,
  resetPasswordExpire: Date
});

module.exports = mongoose.model('User', userSchema);