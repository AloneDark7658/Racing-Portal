const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true, 
    unique: true // Aynı güne iki farklı oturum açılmasını veritabanı seviyesinde engeller
  },
  startTime: { type: String, required: true },
  qrData: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  exemptDepartments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  extraDepartments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  mandatoryDepartments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }]
}, { timestamps: true });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);