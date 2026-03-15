const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Görev başlığı zorunludur'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Yapılacak', 'Devam Ediyor', 'Bitti'],
    default: 'Yapılacak'
  },
  // Görev kime atandı? 3 mod: 'kisi', 'ekip', 'takim'
  assignmentType: {
    type: String,
    enum: ['kisi', 'ekip', 'takim'],
    default: 'takim'
  },
  // Birden fazla kişiye atanabilir
  assignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Birden fazla departmana atanabilir
  assignedDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deadline: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['Düşük', 'Normal', 'Yüksek'],
    default: 'Normal'
  },
  // Ek dosyalar
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String
  }]
}, { timestamps: true });

taskSchema.index({ status: 1 });
taskSchema.index({ assignedUsers: 1 });
taskSchema.index({ assignedDepartments: 1 });

module.exports = mongoose.model('Task', taskSchema);
