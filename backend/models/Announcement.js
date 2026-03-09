const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  // Duyuruyu yayınlayan admin
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Duyurunun gideceği departmanlar. Liste boşsa "Tüm Takım" anlamına gelir!
  targetDepartments: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department' 
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Güncelleme yapıldığında saati otomatik yenile
announcementSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Announcement', announcementSchema);