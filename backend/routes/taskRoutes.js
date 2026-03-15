const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
  getAllTasks,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

// Tüm route'lar giriş yapmış kullanıcılar için
router.get('/', protect, getAllTasks);
router.post('/', protect, admin, upload.array('files', 5), createTask);
router.put('/:id', protect, admin, upload.array('files', 5), updateTask);
router.put('/:id/status', protect, admin, updateTaskStatus);
router.delete('/:id', protect, admin, deleteTask);

module.exports = router;
