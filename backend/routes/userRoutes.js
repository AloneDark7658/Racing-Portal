const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, listAll, updateDepartment, resetDeviceId, updateRole } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/list', protect, admin, listAll);
router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.put('/:id/department', protect, admin, updateDepartment);
router.put('/:id/reset-device', protect, admin, resetDeviceId);
router.put('/:id/role', protect, admin, updateRole); // FAZ 2: Rol yönetimi

module.exports = router;
