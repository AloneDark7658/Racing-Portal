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
    enum: ['superadmin', 'admin', 'member'], // Sadece bu üç rolden biri olabilir
    default: 'member' // Varsayılan olarak herkes üye kaydedilir
  },
  studentId: { 
    type: String 
  }, // İTÜ Öğrenci Numarası
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);