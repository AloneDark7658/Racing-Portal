import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Plus, Clock, User, Users, Trash2, Pencil,
  X, Save, Loader2, Calendar, Building, Paperclip, FileText, Download,
  Circle, PlayCircle, CheckCircle2, ChevronRight, ChevronDown
} from 'lucide-react';
import { API_URL as API } from '../config';
const BACKEND_URL = API.replace('/api', '');

const COLUMNS = [
  { key: 'Yapılacak', label: 'Yapılacak', icon: Circle, colClass: 'bg-white/5 border-white/10', headerClass: 'text-gray-400', badgeClass: 'bg-gray-400/20 text-gray-400', btnClass: 'bg-gray-400/10 hover:bg-gray-400/20 text-gray-400 border-gray-400/20', btnLabel: 'Geri' },
  { key: 'Devam Ediyor', label: 'Devam Ediyor', icon: PlayCircle, colClass: 'bg-blue-500/5 border-blue-500/20', headerClass: 'text-blue-400', badgeClass: 'bg-blue-400/20 text-blue-400', btnClass: 'bg-blue-400/10 hover:bg-blue-400/20 text-blue-400 border-blue-400/20', btnLabel: 'Başla' },
  { key: 'Bitti', label: 'Tamamlanan', icon: CheckCircle2, colClass: 'bg-green-500/5 border-green-500/20', headerClass: 'text-green-400', badgeClass: 'bg-green-400/20 text-green-400', btnClass: 'bg-green-400/10 hover:bg-green-400/20 text-green-400 border-green-400/20', btnLabel: 'Bitir' },
];

const PRIORITIES = [
  { value: 'Düşük', label: 'Düşük', color: 'text-gray-400', dot: 'bg-gray-400' },
  { value: 'Normal', label: 'Normal', color: 'text-blue-400', dot: 'bg-blue-400' },
  { value: 'Yüksek', label: 'Yüksek', color: 'text-red-400', dot: 'bg-red-400' },
];

const ASSIGN_TABS = [
  { key: 'takim', label: 'Tüm Takım', icon: Users },
  { key: 'ekip', label: 'Ekip', icon: Building },
  { key: 'kisi', label: 'Kişi', icon: User },
];

const TaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [collapsedCols, setCollapsedCols] = useState({});
  const [editingTask, setEditingTask] = useState(null);
  const [files, setFiles] = useState([]);
  const [adminTab, setAdminTab] = useState('tum_gorevler'); // 'tum_gorevler' veya 'benim_gorevlerim'
  const [form, setForm] = useState({
    title: '', description: '', deadline: '', priority: 'Normal',
    assignmentType: 'takim', assignedUsers: [], assignedDepartments: []
  });

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';

  const fetchAll = async () => {
    try {
      // Görevler herkes için yüklenir
      const taskRes = await axios.get(`${API}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
      setTasks(taskRes.data);
    } catch (err) {
      console.error('Görevler yüklenemedi:', err);
    }

    // Kullanıcı ve departman listeleri sadece admin için — hata olursa görev listesi etkilenmesin
    if (isAdmin) {
      try {
        const userRes = await axios.get(`${API}/users/list`, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(userRes.data);
      } catch (err) { console.error('Kullanıcılar yüklenemedi'); }

      try {
        const deptRes = await axios.get(`${API}/departments`, { headers: { Authorization: `Bearer ${token}` } });
        setDepartments(deptRes.data);
      } catch (err) { console.error('Departmanlar yüklenemedi'); }
    }

    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setForm({
      title: '', description: '', deadline: '', priority: 'Normal',
      assignmentType: 'takim', assignedUsers: [], assignedDepartments: []
    });
    setEditingTask(null);
    setFiles([]);
  };

  // Düzenleme modal'ını açarken formu mevcut görev verileriyle doldur
  const openEditModal = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      deadline: task.deadline ? task.deadline.slice(0, 10) : '',
      priority: task.priority || 'Normal',
      assignmentType: task.assignmentType || 'takim',
      assignedUsers: (task.assignedUsers || []).map(u => typeof u === 'object' ? u._id : u),
      assignedDepartments: (task.assignedDepartments || []).map(d => typeof d === 'object' ? d._id : d),
    });
    setModalOpen(true);
  };

  // Oluştur veya Güncelle — editingTask olup olmadığına göre karar verir
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitLoading(true);

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('assignmentType', form.assignmentType);
    formData.append('assignedUsers', JSON.stringify(form.assignedUsers));
    formData.append('assignedDepartments', JSON.stringify(form.assignedDepartments));
    formData.append('deadline', form.deadline || '');
    formData.append('priority', form.priority);
    files.forEach(f => formData.append('files', f));

    try {
      if (editingTask) {
        await axios.put(`${API}/tasks/${editingTask._id}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Görev güncellendi!');
      } else {
        await axios.post(`${API}/tasks`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Görev oluşturuldu!');
      }
      resetForm();
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'İşlem başarısız!');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`${API}/tasks/${taskId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      toast.success('Durum güncellendi');
    } catch (err) {
      toast.error('Durum güncellenemedi!');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API}/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Görev silindi');
    } catch (err) {
      toast.error('Silme başarısız!');
    }
  };

  const toggleCol = (key) => setCollapsedCols(prev => ({ ...prev, [key]: !prev[key] }));
  const getPriorityInfo = (p) => PRIORITIES.find(pr => pr.value === p) || PRIORITIES[1];
  const isOverdue = (deadline) => deadline && new Date(deadline) < new Date();
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) : null;

  const toggleUserSelection = (userId) => {
    setForm(prev => ({
      ...prev,
      assignedUsers: prev.assignedUsers.includes(userId)
        ? prev.assignedUsers.filter(id => id !== userId)
        : [...prev.assignedUsers, userId]
    }));
  };

  const toggleDeptSelection = (deptId) => {
    setForm(prev => ({
      ...prev,
      assignedDepartments: prev.assignedDepartments.includes(deptId)
        ? prev.assignedDepartments.filter(id => id !== deptId)
        : [...prev.assignedDepartments, deptId]
    }));
  };

  // Görev kartındaki atama bilgisini render et
  const renderAssignmentBadge = (task) => {
    if (task.assignmentType === 'takim') {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-orange-500/10 px-2 py-1 rounded-md text-orange-400 border border-orange-500/10">
          <Users size={10} /> Tüm Takım
        </span>
      );
    }
    if (task.assignmentType === 'ekip' && task.assignedDepartments?.length > 0) {
      return task.assignedDepartments.map(dept => (
        <span key={dept._id} className="flex items-center gap-1 text-[10px] bg-blue-500/5 px-2 py-1 rounded-md text-blue-400 border border-blue-500/10">
          <Building size={10} /> {dept.name}
        </span>
      ));
    }
    if (task.assignmentType === 'kisi' && task.assignedUsers?.length > 0) {
      return task.assignedUsers.map(u => (
        <span key={u._id} className="flex items-center gap-1 text-[10px] bg-white/5 px-2 py-1 rounded-md text-gray-300 border border-white/5">
          <User size={10} /> {u.name}
        </span>
      ));
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-2 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Üst Başlık */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 bg-white/5 hover:bg-red-600/20 hover:text-red-500 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tighter italic">
                GÖREV <span className="text-red-600">PANOSU</span>
              </h1>
              <p className="text-sm text-gray-400">Takımın görevlerini Kanban görünümünde yönetin.</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => { resetForm(); setModalOpen(true); }}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 w-full md:w-auto"
            >
              <Plus size={18} /> Yeni Görev
            </button>
          )}
        </div>

        {/* Admin Görev Filtreleme Sekmeleri */}
        {isAdmin && (
          <div className="flex items-center gap-2 mb-6 bg-white/5 p-1 rounded-xl w-full md:w-max">
            <button
              onClick={() => setAdminTab('tum_gorevler')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminTab === 'tum_gorevler' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              Tüm Görevler
            </button>
            <button
              onClick={() => setAdminTab('benim_gorevlerim')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminTab === 'benim_gorevlerim' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              Bana Atananlar
            </button>
          </div>
        )}

        {/* Kanban Board */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {COLUMNS.map(col => {
              // Görevleri admin sekmesine göre filtrele
              let displayedTasks = tasks;
              const currentUserId = currentUser._id || currentUser.id;
              const fullCurrentUser = users.find(u => u._id === currentUserId) || currentUser;

              const isAssignedToMe = (task) => {
                if (task.assignmentType === 'takim') return true;
                if (task.assignmentType === 'kisi' && task.assignedUsers?.some(u => 
                  String(typeof u === 'object' ? u._id : u) === String(currentUserId)
                )) return true;
                if (task.assignmentType === 'ekip' && task.assignedDepartments?.some(d => 
                  String(typeof d === 'object' ? d._id : d) === String(fullCurrentUser.departmentId)
                )) return true;
                return false;
              };

              if (isAdmin && adminTab === 'benim_gorevlerim') {
                displayedTasks = tasks.filter(isAssignedToMe);
              } else if (!isAdmin) {
                // Normal kullanıcılar sadece kendi görevlerini/ekip/takım görevlerini görebilir
                 displayedTasks = tasks.filter(isAssignedToMe);
              }

              const colTasks = displayedTasks.filter(t => t.status === col.key);
              const isCollapsed = collapsedCols[col.key];
              const Icon = col.icon;

              return (
                <div key={col.key} className={`border rounded-2xl overflow-hidden ${col.colClass}`}>
                  <button
                    onClick={() => toggleCol(col.key)}
                    className="w-full flex items-center justify-between p-4 border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={18} className={col.headerClass} />
                      <h3 className="font-bold text-sm">{col.label}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${col.badgeClass}`}>
                        {colTasks.length}
                      </span>
                    </div>
                    {isCollapsed ? <ChevronRight size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </button>

                  {!isCollapsed && (
                    <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
                      {colTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          <p>Bu kolonda görev yok</p>
                        </div>
                      ) : (
                        colTasks.map(task => {
                          const prio = getPriorityInfo(task.priority);
                          const overdue = task.status !== 'Bitti' && isOverdue(task.deadline);

                          return (
                            <div key={task._id} className={`bg-black/40 border rounded-xl p-4 group transition-all hover:border-white/20 ${overdue ? 'border-red-500/40' : 'border-white/5'}`}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-bold text-sm text-white leading-tight">{task.title}</h4>
                                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase shrink-0 ${prio.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                                  {prio.label}
                                </span>
                              </div>

                              {task.description && (
                                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{task.description}</p>
                              )}

                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {renderAssignmentBadge(task)}
                                {task.deadline && (
                                  <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border ${overdue ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-gray-300 border-white/5'}`}>
                                    <Calendar size={10} /> {formatDate(task.deadline)}
                                    {overdue && ' ⚠️'}
                                  </span>
                                )}
                              </div>

                              {/* Ek Dosyalar */}
                              {task.attachments && task.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {task.attachments.map((file, i) => (
                                    <a
                                      key={i}
                                      href={`${BACKEND_URL}/uploads/${file.filename}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-[10px] bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2 py-1 rounded-md text-purple-400 transition-all"
                                    >
                                      {file.mimetype?.startsWith('image/') ? (
                                        <img src={`${BACKEND_URL}/uploads/${file.filename}`} alt="" className="w-3 h-3 rounded object-cover" />
                                      ) : (
                                        <FileText size={10} />
                                      )}
                                      <span className="max-w-[80px] truncate">{file.originalName}</span>
                                    </a>
                                  ))}
                                </div>
                              )}

                              {isAdmin && (
                                <div className="flex gap-1.5 pt-2 border-t border-white/5">
                                  {COLUMNS.filter(s => s.key !== task.status).map(s => {
                                    const BtnIcon = s.icon;
                                    return (
                                      <button
                                        key={s.key}
                                        onClick={() => handleStatusChange(task._id, s.key)}
                                        className={`flex-1 text-[10px] py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 border ${s.btnClass}`}
                                      >
                                        <BtnIcon size={12} /> {s.btnLabel}
                                      </button>
                                    );
                                  })}
                                  <button
                                    onClick={() => openEditModal(task)}
                                    className="px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                                    title="Düzenle"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(task._id)}
                                    className="px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                    title="Sil"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========== YENİ GÖREV MODAL ========== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-[#1a1a1a] z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold">{editingTask ? 'Görevi Düzenle' : 'Yeni Görev'}</h2>
              <button onClick={() => { setModalOpen(false); resetForm(); }} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Başlık */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Başlık *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600 text-sm"
                  placeholder="Görev başlığı..."
                  required
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600 text-sm h-20 resize-none"
                  placeholder="Görev detayları..."
                />
              </div>

              {/* ===== ATAMA SEÇİMİ (Kişi / Ekip / Tüm Takım) ===== */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Görevi Ata</label>
                {/* 3 Tab */}
                <div className="flex gap-1 bg-black/40 rounded-xl p-1 border border-white/10 mb-3">
                  {ASSIGN_TABS.map(tab => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setForm({ ...form, assignmentType: tab.key, assignedUsers: [], assignedDepartments: [] })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                          form.assignmentType === tab.key
                            ? 'bg-red-600 text-white'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <TabIcon size={14} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Kişi Seçimi */}
                {form.assignmentType === 'kisi' && (
                  <div className="border border-white/10 rounded-xl max-h-40 overflow-y-auto divide-y divide-white/5">
                    {users.map(u => (
                      <label
                        key={u._id}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                          form.assignedUsers.includes(u._id) ? 'bg-red-600/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.assignedUsers.includes(u._id)}
                          onChange={() => toggleUserSelection(u._id)}
                          className="w-4 h-4 rounded border-gray-600 text-red-600 focus:ring-red-500 bg-black/50"
                        />
                        <div>
                          <span className="text-sm font-semibold">{u.name}</span>
                          <span className="text-gray-500 text-xs ml-2">{u.email}</span>
                        </div>
                      </label>
                    ))}
                    {users.length === 0 && (
                      <div className="p-4 text-center text-gray-500 text-sm">Kullanıcı bulunamadı</div>
                    )}
                  </div>
                )}

                {/* Ekip Seçimi */}
                {form.assignmentType === 'ekip' && (
                  <div className="border border-white/10 rounded-xl max-h-40 overflow-y-auto divide-y divide-white/5">
                    {departments.map(d => (
                      <label
                        key={d._id}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                          form.assignedDepartments.includes(d._id) ? 'bg-blue-600/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.assignedDepartments.includes(d._id)}
                          onChange={() => toggleDeptSelection(d._id)}
                          className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-black/50"
                        />
                        <div className="flex items-center gap-2">
                          <Building size={14} className="text-blue-400" />
                          <span className="text-sm font-semibold">{d.name}</span>
                          {d.memberCount > 0 && (
                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">{d.memberCount} üye</span>
                          )}
                        </div>
                      </label>
                    ))}
                    {departments.length === 0 && (
                      <div className="p-4 text-center text-gray-500 text-sm">Departman bulunamadı</div>
                    )}
                  </div>
                )}

                {/* Tüm Takım bilgilendirme */}
                {form.assignmentType === 'takim' && (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 text-center">
                    <Users size={24} className="text-orange-400 mx-auto mb-2" />
                    <p className="text-sm text-orange-400 font-semibold">Bu görev tüm takıma atanacak</p>
                    <p className="text-[11px] text-gray-500 mt-1">Herkes görev panosunda görebilir</p>
                  </div>
                )}

                {/* Seçim sayısı göstergesi */}
                {form.assignmentType === 'kisi' && form.assignedUsers.length > 0 && (
                  <p className="text-xs text-red-400 mt-2 font-bold">{form.assignedUsers.length} kişi seçildi</p>
                )}
                {form.assignmentType === 'ekip' && form.assignedDepartments.length > 0 && (
                  <p className="text-xs text-blue-400 mt-2 font-bold">{form.assignedDepartments.length} ekip seçildi</p>
                )}
              </div>

              {/* Son Tarih + Öncelik */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Son Tarih</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Öncelik</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600 text-sm"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dosya Ekleme */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Dosya Ekle</label>
                <label className="flex items-center gap-2 p-3 bg-black/40 border border-dashed border-white/20 hover:border-red-500/50 rounded-xl cursor-pointer transition-colors">
                  <Paperclip size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-400">{files.length > 0 ? `${files.length} dosya seçildi` : 'Resim, PDF, döküman ekleyin...'}</span>
                  <input type="file" multiple onChange={(e) => setFiles([...e.target.files])} className="sr-only" />
                </label>
                {files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {[...files].map((f, i) => (
                      <span key={i} className="text-[10px] bg-white/10 text-gray-300 px-2 py-1 rounded">{f.name}</span>
                    ))}
                  </div>
                )}
                {editingTask && editingTask.attachments?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-gray-500 mb-1">Mevcut dosyalar:</p>
                    <div className="flex flex-wrap gap-1">
                      {editingTask.attachments.map((file, i) => (
                        <a key={i} href={`${BACKEND_URL}/uploads/${file.filename}`} target="_blank" className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded flex items-center gap-1">
                          <FileText size={10} /> {file.originalName}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Butonlar */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); resetForm(); }}
                  className="flex-1 py-3 rounded-xl font-bold border border-white/20 hover:bg-white/5 transition-all text-sm"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-sm"
                >
                  {submitLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {editingTask ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBIL FAB */}
      {isAdmin && (
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-transform active:scale-95"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

export default TaskBoard;
