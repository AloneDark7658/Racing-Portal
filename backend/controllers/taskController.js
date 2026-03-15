const Task = require('../models/Task');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const fs = require('fs');
const path = require('path');

const populateTask = (query) => query
  .populate('assignedUsers', 'name email')
  .populate('assignedDepartments', 'name')
  .populate('createdBy', 'name');

// Tüm görevleri getir (admin: hepsi, üye: sadece kendine atananlar)
exports.getAllTasks = async (req, res) => {
  try {
    let filter = {};

    // Admin/Superadmin tüm görevleri görür
    // Normal üyeler sadece kendileriyle ilgili görevleri görür
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      filter = {
        $or: [
          { assignmentType: 'takim' },                          // Tüm takıma atanan
          { assignmentType: 'kisi', assignedUsers: req.user._id },  // Kendisine atanan
          ...(req.user.departmentId
            ? [{ assignmentType: 'ekip', assignedDepartments: req.user.departmentId }]  // Departmanına atanan
            : [])
        ]
      };
    }

    const tasks = await populateTask(Task.find(filter).sort({ createdAt: -1 }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Görevler yüklenirken hata oluştu.' });
  }
};

// Yeni görev oluştur
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignmentType, deadline, priority } = req.body;
    // FormData ile gelince array'ler string olabiliyor
    let assignedUsers = req.body.assignedUsers || [];
    let assignedDepartments = req.body.assignedDepartments || [];
    if (typeof assignedUsers === 'string') { try { assignedUsers = JSON.parse(assignedUsers); } catch { assignedUsers = []; } }
    if (typeof assignedDepartments === 'string') { try { assignedDepartments = JSON.parse(assignedDepartments); } catch { assignedDepartments = []; } }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Görev başlığı zorunludur.' });
    }

    const attachments = (req.files || []).map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype
    }));

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      assignmentType: assignmentType || 'takim',
      assignedUsers: assignmentType === 'kisi' ? assignedUsers : [],
      assignedDepartments: assignmentType === 'ekip' ? assignedDepartments : [],
      createdBy: req.user._id,
      deadline: deadline || null,
      priority: priority || 'Normal',
      attachments
    });
    const populated = await populateTask(Task.findById(task._id));

    // E-Posta Bildirimi Gönderme
    try {
      let emailQuery = null;
      if (assignmentType === 'takim') {
        emailQuery = {}; // Tüm kullanıcılar
      } else if (assignmentType === 'ekip' && assignedDepartments.length > 0) {
        emailQuery = { departmentId: { $in: assignedDepartments } };
      } else if (assignmentType === 'kisi' && assignedUsers.length > 0) {
        emailQuery = { _id: { $in: assignedUsers } };
      }

      if (emailQuery) {
        const usersToNotify = await User.find(emailQuery).select('email');
        const emails = usersToNotify.map(u => u.email).filter(Boolean);

        if (emails.length > 0) {
          // Varsa dosyaları mail eki için hazırla
          let emailAttachments = [];
          if (attachments && attachments.length > 0) {
            try {
              emailAttachments = attachments.map(f => ({
                filename: f.originalName,
                content: fs.readFileSync(path.join(__dirname, '..', 'uploads', f.filename))
              }));
            } catch (err) {
              console.error("Ekler okunamadı:", err.message);
            }
          }

          await sendEmail({
             email: emails,
             subject: `📝 Yeni Görev: ${title}`,
             message: `İTÜ Racing Portalında size veya ekibinize yeni bir görev atandı:\n\nGörev: ${title}\nÖncelik: ${priority || 'Normal'}\nBitiş Tarihi: ${deadline ? new Date(deadline).toLocaleDateString('tr-TR') : 'Belirtilmedi'}\n\nDetaylar için portala giriş yapın:\n${process.env.FRONTEND_URL}`,
             attachments: emailAttachments
          });
        }
      }
    } catch (emailErr) {
       console.error('Görev maili gönderirken hata oluştu', emailErr.message);
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Görev oluşturulamadı.' });
  }
};

// Görev durumunu güncelle
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Yapılacak', 'Devam Ediyor', 'Bitti'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz durum.' });
    }

    const task = await populateTask(
      Task.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' })
    );
    if (!task) return res.status(404).json({ message: 'Görev bulunamadı.' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Durum güncellenemedi.' });
  }
};

// Görev düzenle
exports.updateTask = async (req, res) => {
  try {
    const { title, description, assignmentType, deadline, priority, status } = req.body;
    let assignedUsers = req.body.assignedUsers || [];
    let assignedDepartments = req.body.assignedDepartments || [];
    if (typeof assignedUsers === 'string') { try { assignedUsers = JSON.parse(assignedUsers); } catch { assignedUsers = []; } }
    if (typeof assignedDepartments === 'string') { try { assignedDepartments = JSON.parse(assignedDepartments); } catch { assignedDepartments = []; } }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (assignmentType) {
      updateData.assignmentType = assignmentType;
      updateData.assignedUsers = assignmentType === 'kisi' ? assignedUsers : [];
      updateData.assignedDepartments = assignmentType === 'ekip' ? assignedDepartments : [];
    }
    if (deadline !== undefined) updateData.deadline = deadline || null;
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;

    // Yeni dosya eklendiyse mevcut dosyaların üstüne ekle
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(f => ({
        filename: f.filename,
        originalName: f.originalname,
        mimetype: f.mimetype
      }));
      const existing = await Task.findById(req.params.id);
      updateData.attachments = [...(existing?.attachments || []), ...newAttachments];
    }

    const task = await populateTask(
      Task.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' })
    );
    if (!task) return res.status(404).json({ message: 'Görev bulunamadı.' });

    // E-Posta Bildirimi Gönderme (Güncelleme)
    try {
      let emailQuery = null;
      if (task.assignmentType === 'takim') {
        emailQuery = {}; // Tüm kullanıcılar
      } else if (task.assignmentType === 'ekip' && task.assignedDepartments?.length > 0) {
        emailQuery = { departmentId: { $in: task.assignedDepartments.map(d => d._id) } };
      } else if (task.assignmentType === 'kisi' && task.assignedUsers?.length > 0) {
        emailQuery = { _id: { $in: task.assignedUsers.map(u => u._id) } };
      }

      if (emailQuery) {
        const usersToNotify = await User.find(emailQuery).select('email');
        const emails = usersToNotify.map(u => u.email).filter(Boolean);

        // Görevin mevcut eklerini mail eki için hazırla
        let emailAttachments = [];
        if (task.attachments && task.attachments.length > 0) {
          try {
            emailAttachments = task.attachments.map(f => ({
              filename: f.originalName,
              content: fs.readFileSync(path.join(__dirname, '..', 'uploads', f.filename))
            }));
          } catch (err) {
            console.error("Ekler okunamadı:", err.message);
          }
        }

        if (emails.length > 0) {
          await sendEmail({
             email: emails,
             subject: `🔄 Görev Güncellendi: ${task.title}`,
             message: `İTÜ Racing Portalında size veya ekibinize atanmış bir görev GÜNCELLENDİ:\n\nGörev: ${task.title}\nÖncelik: ${task.priority || 'Normal'}\nBitiş Tarihi: ${task.deadline ? new Date(task.deadline).toLocaleDateString('tr-TR') : 'Belirtilmedi'}\nGüncel Durum: ${task.status}\n\nDetaylar için portala giriş yapın:\n${process.env.FRONTEND_URL}`,
             attachments: emailAttachments
          });
        }
      }
    } catch (emailErr) {
       console.error('Görev güncelleme maili gönderirken hata oluştu', emailErr.message);
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Görev güncellenemedi.' });
  }
};

// Görev sil
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Görev bulunamadı.' });
    res.json({ message: 'Görev silindi.' });
  } catch (err) {
    res.status(500).json({ message: 'Görev silinemedi.' });
  }
};
