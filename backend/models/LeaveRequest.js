const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  requestedDate: { 
    type: Date, 
    required: true // Hangi gün için izin isteniyor?
  },
  reason: { 
    type: String, 
    required: true // Mazeret metni
  },
  status: { 
    type: String, 
    enum: ['Bekliyor', 'Onaylandı', 'Reddedildi'], 
    default: 'Bekliyor' 
  },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' // Hangi admin bu izni inceledi?
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);