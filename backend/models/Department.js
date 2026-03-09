const mongoose = require('mongoose');

const workScheduleSchema = new mongoose.Schema({
  // Çalışma günleri: 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
  daysOfWeek: { 
    type: [Number], 
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.every(d => d >= 0 && d <= 6),
      message: 'Her gün 0-6 arasında olmalı (0=Pazar, 6=Cumartesi)'
    }
  },
  startTime: { type: String, required: true }, // Örn: "18:00"
  endTime: { type: String, required: true }   // Örn: "21:00"
}, { _id: false });

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Üst departman (null = en üst seviye)
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department', 
    default: null 
  },
  // Mesai ayarları (bu departman ve alt birimleri için varsayılan)
  workSchedule: { 
    type: workScheduleSchema, 
    required: true 
  },
  // Sıralama
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// DÜZELTİLEN KISIM: next parametresi ve çağrısı tamamen kaldırıldı.
departmentSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Department', departmentSchema);