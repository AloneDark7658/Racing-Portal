const express = require('express');
const router = express.Router();
const { 
  getAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} = require('../controllers/announcementController');

// Güvenlik ara katmanlarımız (authMiddleware)
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// GET: /api/announcements -> Tüm üyeler giriş yapmışsa kendi duyurularını görebilir
router.get('/', protect, getAnnouncements);

// POST, PUT, DELETE -> Sadece admin yetkisi olanlar yapabilir
router.post('/', protect, admin, upload.array('files', 5), createAnnouncement);
router.put('/:id', protect, admin, updateAnnouncement);
router.delete('/:id', protect, admin, deleteAnnouncement);

module.exports = router;