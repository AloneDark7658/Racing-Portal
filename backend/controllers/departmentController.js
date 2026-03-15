const Department = require('../models/Department');
const User = require('../models/User');

// Gün isimleri (0=Pazar, 1=Pazartesi, ...)
const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

// --- TÜM DEPARTMANLARI GETİR (düz liste, üye sayısı ile) ---
exports.getAll = async (req, res) => {
  try {
    const depts = await Department.find().sort({ order: 1, name: 1 }).lean();
    const memberCounts = await User.aggregate([
      { $match: { departmentId: { $ne: null } } },
      { $group: { _id: '$departmentId', count: { $sum: 1 } } }
    ]);
    const countMap = Object.fromEntries(memberCounts.map(m => [m._id.toString(), m.count]));
    const result = depts.map(d => ({ ...d, memberCount: countMap[d._id] || 0 }));
    res.status(200).json(result);
  } catch (error) {
    console.error('Departman listesi hatası:', error.message);
    res.status(500).json({ message: 'Departmanlar yüklenemedi.' });
  }
};

// --- DÜZ LİSTE (form select için) ---
exports.getFlatList = async (req, res) => {
  try {
    const depts = await Department.find().sort({ order: 1, name: 1 }).select('name parentId workSchedule').lean();
    res.status(200).json(depts);
  } catch (error) {
    res.status(500).json({ message: 'Departmanlar yüklenemedi.' });
  }
};

// --- TEK DEPARTMAN GETİR ---
exports.getOne = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Departman bulunamadı.' });
    res.status(200).json(dept);
  } catch (error) {
    res.status(500).json({ message: 'Departman yüklenemedi.' });
  }
};

// --- DEPARTMAN OLUŞTUR ---
exports.create = async (req, res) => {
  try {
    const { name, parentId, workSchedule, order } = req.body;

    if (!name || !workSchedule?.daysOfWeek || !workSchedule?.startTime || !workSchedule?.endTime) {
      return res.status(400).json({ message: 'Ad, çalışma günleri, başlangıç ve bitiş saati zorunludur.' });
    }

    const maxOrder = await Department.countDocuments();
    const dept = new Department({
      name,
      parentId: parentId || null,
      workSchedule: {
        daysOfWeek: workSchedule.daysOfWeek,
        startTime: workSchedule.startTime,
        endTime: workSchedule.endTime
      },
      order: order ?? maxOrder
    });
    await dept.save();
    res.status(201).json({ message: 'Departman oluşturuldu.', department: dept });
  } catch (error) {
    console.error('Departman oluşturma hatası:', error.message);
    res.status(500).json({ message: error.message || 'Departman oluşturulamadı.' });
  }
};

// --- DEPARTMAN GÜNCELLE ---
exports.update = async (req, res) => {
  try {
    const { name, parentId, workSchedule, order } = req.body;
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Departman bulunamadı.' });

    if (name) dept.name = name;
    if (parentId !== undefined) dept.parentId = parentId || null;
    if (order !== undefined) dept.order = order;
    if (workSchedule) {
      if (workSchedule.daysOfWeek) dept.workSchedule.daysOfWeek = workSchedule.daysOfWeek;
      if (workSchedule.startTime) dept.workSchedule.startTime = workSchedule.startTime;
      if (workSchedule.endTime) dept.workSchedule.endTime = workSchedule.endTime;
    }
    await dept.save();
    res.status(200).json({ message: 'Departman güncellendi.', department: dept });
  } catch (error) {
    console.error('Departman güncelleme hatası:', error.message);
    res.status(500).json({ message: 'Departman güncellenemedi.' });
  }
};

// --- DEPARTMAN SİL ---
exports.delete = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Departman bulunamadı.' });

    const hasChildren = await Department.exists({ parentId: dept._id });
    if (hasChildren) {
      return res.status(400).json({ message: 'Alt departmanı olan birim silinemez. Önce alt birimleri silin.' });
    }

    await User.updateMany({ departmentId: dept._id }, { departmentId: null });
    await Department.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Departman silindi.' });
  } catch (error) {
    res.status(500).json({ message: 'Departman silinemedi.' });
  }
};

// --- ÜYE ATAMA (Admin: kullanıcıyı departmana ata) ---
exports.assignMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const { departmentId } = req.params;

    const dept = await Department.findById(departmentId);
    if (!dept) return res.status(404).json({ message: 'Departman bulunamadı.' });

    const user = await User.findByIdAndUpdate(userId, { departmentId }, { returnDocument: 'after' }).select('-password');
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    res.status(200).json({ message: 'Üye atandı.', user });
  } catch (error) {
    res.status(500).json({ message: 'Üye atanamadı.' });
  }
};

// Yardımcı: Gün isimlerini döndür
exports.getDayNames = (req, res) => {
  res.json(DAY_NAMES);
};
