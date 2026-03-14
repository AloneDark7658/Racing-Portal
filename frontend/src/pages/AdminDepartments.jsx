import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Plus, Pencil, Trash2, Clock, Users, 
  X, Save, Loader2, AlertCircle, UserPlus 
} from 'lucide-react';

const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
import { API_URL as API } from '../config';
const DEPT_API = `${API}/departments`;
const USER_API = `${API}/users`;

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('departments');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    parentId: '',
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '18:00',
    endTime: '21:00'
  });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDepartments();
  }, [navigate, token]);

  const fetchDepartments = async () => {
    try {
      const { data } = await axios.get(DEPT_API, { headers: { Authorization: `Bearer ${token}` } });
      setDepartments(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Departmanlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${USER_API}/list`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Kullanıcılar yüklenemedi.');
    }
  };

  useEffect(() => {
    if (activeTab === 'assign' && token) fetchUsers();
  }, [activeTab, token]);

  const openAdd = () => {
    setEditingId(null);
    setForm({
      name: '',
      parentId: '',
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '18:00',
      endTime: '21:00'
    });
    setModalOpen(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (dept) => {
    setEditingId(dept._id);
    setForm({
      name: dept.name,
      parentId: dept.parentId?.toString() || '',
      daysOfWeek: dept.workSchedule?.daysOfWeek ?? [1, 2, 3, 4, 5],
      startTime: dept.workSchedule?.startTime ?? '18:00',
      endTime: dept.workSchedule?.endTime ?? '21:00'
    });
    setModalOpen(true);
    setError('');
    setSuccess('');
  };

  const handleDayToggle = (day) => {
    setForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort((a, b) => a - b)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');
    try {
      const url = editingId ? `${DEPT_API}/${editingId}` : DEPT_API;
      const payload = {
        name: form.name.trim(),
        parentId: form.parentId || null,
        workSchedule: {
          daysOfWeek: form.daysOfWeek,
          startTime: form.startTime,
          endTime: form.endTime
        }
      };
      if (editingId) {
        await axios.put(url, payload, { headers: { Authorization: `Bearer ${token}` } });
        setSuccess('Departman güncellendi.');
      } else {
        await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` } });
        setSuccess('Departman oluşturuldu.');
      }
      fetchDepartments();
      setTimeout(() => {
        setModalOpen(false);
        setSuccess('');
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'İşlem başarısız.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" departmanını silmek istediğinize emin misiniz? Alt birimleri olan departman silinemez.`)) return;
    try {
      await axios.delete(`${DEPT_API}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Departman silindi.');
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Silme başarısız.');
    }
  };

  const handleAssignMember = async (userId, departmentId) => {
    try {
      await axios.put(
        `${USER_API}/${userId}/department`,
        { departmentId: departmentId || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Atama başarısız.');
    }
  };

  const getParentName = (parentId) => {
    if (!parentId) return '—';
    const p = departments.find(d => d._id === parentId);
    return p ? p.name : '—';
  };

  const formatSchedule = (ws) => {
    if (!ws) return '—';
    const days = (ws.daysOfWeek || []).map(d => DAY_NAMES[d]).join(', ');
    return `${days} • ${ws.startTime} - ${ws.endTime}`;
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-2 md:p-8 text-white">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 bg-white/5 hover:bg-red-600/20 hover:text-red-500 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tighter italic">
                DEPARTMAN & <span className="text-red-600">MESAİ AYARLARI</span>
              </h1>
            <p className="text-sm text-gray-400">Takım yapısını ve mesai gün/saatlerini yönetin.</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="hidden md:flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold text-sm transition-all"
        >
          <Plus size={18} /> Yeni Departman
        </button>
        </div>

        {/* Sekmeler */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('departments'); setError(''); }}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'departments' ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Building2 size={16} className="inline mr-2" />
            Departmanlar
          </button>
          <button
            onClick={() => { setActiveTab('assign'); setError(''); fetchUsers(); }}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'assign' ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <UserPlus size={16} className="inline mr-2" />
            Üye Atama
          </button>
        </div>

        {activeTab === 'assign' ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-bold">Üyeleri departmanlara ata</h3>
              <p className="text-sm text-gray-400">Her üye için bir departman seçin.</p>
            </div>
            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
              {users.filter(u => u.role === 'member').length === 0 ? (
                <div className="p-8 text-center text-gray-400">Henüz üye yok.</div>
              ) : (
                users.filter(u => u.role === 'member').map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-4 hover:bg-white/5">
                    <div>
                      <span className="font-semibold">{user.name}</span>
                      <span className="text-gray-400 text-sm ml-2">({user.email})</span>
                    </div>
                    <select
                      value={user.departmentId?._id || user.departmentId || ''}
                      onChange={(e) => handleAssignMember(user._id, e.target.value || null)}
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none"
                    >
                      <option value="">— Departman seç —</option>
                      {departments.map(d => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="text-center text-gray-500 py-12 animate-pulse flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={24} /> Yükleniyor...
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center bg-white/5 p-12 rounded-2xl border border-white/10 text-gray-400 flex flex-col items-center gap-4">
            <Building2 size={48} className="text-gray-500" />
            <p>Henüz departman tanımlanmamış.</p>
            <button onClick={openAdd} className="text-red-500 hover:underline font-bold">
              İlk departmanı oluştur
            </button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden pb-4 md:pb-0">
            {/* MASAÜSTÜ TABLO */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left p-4 font-bold text-gray-400 text-xs uppercase">Departman</th>
                    <th className="text-left p-4 font-bold text-gray-400 text-xs uppercase">Üst Birim</th>
                    <th className="text-left p-4 font-bold text-gray-400 text-xs uppercase">Mesai</th>
                    <th className="text-center p-4 font-bold text-gray-400 text-xs uppercase">Üye</th>
                    <th className="text-right p-4 font-bold text-gray-400 text-xs uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-semibold">{dept.name}</td>
                      <td className="p-4 text-gray-400 text-sm">{getParentName(dept.parentId)}</td>
                      <td className="p-4 text-sm text-gray-300">
                        <span className="flex items-center gap-1">
                          <Clock size={14} className="text-gray-500" />
                          {formatSchedule(dept.workSchedule)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg text-xs">
                          <Users size={12} /> {dept.memberCount || 0}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(dept)}
                            className="p-2 bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(dept._id, dept.name)}
                            className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBİL KARTLAR */}
            <div className="md:hidden flex flex-col gap-4 p-4">
               {departments.map((dept) => (
                 <div key={dept._id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                       <div>
                          <div className="font-bold text-lg text-white">{dept.name}</div>
                          {dept.parentId && <div className="text-xs text-blue-400 mt-1">Üst Birim: {getParentName(dept.parentId)}</div>}
                       </div>
                       <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg text-xs font-bold shrink-0 text-gray-300">
                          <Users size={12} /> {dept.memberCount || 0}
                       </span>
                    </div>
                    
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-xs text-gray-300 flex items-start gap-2">
                       <Clock size={14} className="text-gray-500 mt-0.5 shrink-0" />
                       <span>{formatSchedule(dept.workSchedule)}</span>
                    </div>

                    <div className="flex gap-2 mt-2 border-t border-white/10 pt-3">
                       <button onClick={() => openEdit(dept)} className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1">
                          <Pencil size={14} /> Düzenle
                       </button>
                       <button onClick={() => handleDelete(dept._id, dept.name)} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1">
                          <Trash2 size={14} /> Sil
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-bold">
                  {editingId ? 'Departman Düzenle' : 'Yeni Departman'}
                </h2>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 text-red-500 p-3 rounded-lg text-sm">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 bg-green-500/10 text-green-500 p-3 rounded-lg text-sm">
                    <Save size={16} /> {success}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Departman Adı</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    placeholder="Örn: Elektrik Takımı"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Üst Birim</label>
                  <select
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                  >
                    <option value="">— Yok (en üst seviye) —</option>
                    {departments
                      .filter(d => !editingId || d._id !== editingId)
                      .map(d => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Çalışma Günleri</label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_NAMES.map((name, i) => (
                      <label
                        key={i}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all ${
                          form.daysOfWeek.includes(i)
                            ? 'bg-red-600/20 border-red-500/50 text-red-400'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.daysOfWeek.includes(i)}
                          onChange={() => handleDayToggle(i)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Başlangıç Saati</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Bitiş Saati</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-bold border border-white/20 hover:bg-white/5 transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading || form.daysOfWeek.length === 0}
                    className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {submitLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {editingId ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MOBIL FAB (Yeni Departman) */}
      <button 
        onClick={openAdd}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-transform active:scale-95"
      >
        <Plus size={24} />
      </button>

    </div>
  );
};

export default AdminDepartments;
