import React, { useEffect, useState } from 'react';
import useFormDraft from '../hooks/useFormDraft';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone, Plus, Trash2, Loader2, Send, Clock } from 'lucide-react'; // Clock eklendi

import { API_URL as API } from '../config';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  // FAZ 2: Form taslak (draft) desteği — sayfa yenilendiğinde veri kaybolmaz
  const [form, setForm, clearDraft] = useFormDraft('announcement-form', { title: '', content: '', targetDepartments: [] });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate, token]);

  const fetchData = async () => {
    try {
      const [annRes, deptRes] = await Promise.all([
        axios.get(`${API}/announcements`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/departments`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAnnouncements(annRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error('Veriler çekilemedi', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeptToggle = (deptId) => {
    setForm(prev => {
      const isSelected = prev.targetDepartments.includes(deptId);
      return {
        ...prev,
        targetDepartments: isSelected 
          ? prev.targetDepartments.filter(id => id !== deptId)
          : [...prev.targetDepartments, deptId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await axios.post(`${API}/announcements`, form, { headers: { Authorization: `Bearer ${token}` } });
      setModalOpen(false);
      clearDraft(); // Taslağı temizle
      fetchData();
    } catch (error) {
      alert('Duyuru oluşturulamadı.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API}/announcements/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) {
      alert('Silme işlemi başarısız.');
    }
  };

  // TARİH VE SAAT FORMATLAYICI
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-2 md:p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-red-600/20 hover:text-red-500 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-black italic">DUYURU <span className="text-red-600">YÖNETİMİ</span></h1>
              <p className="text-sm text-gray-400">Takıma veya spesifik departmanlara duyuru gönderin.</p>
            </div>
          </div>
          <button onClick={() => setModalOpen(true)} className="hidden md:flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold text-sm">
            <Plus size={18} /> Yeni Duyuru
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12 text-gray-500"><Loader2 className="animate-spin" size={32} /></div>
        ) : announcements.length === 0 ? (
          <div className="text-center bg-white/5 p-12 rounded-2xl border border-white/10 text-gray-400">
            <Megaphone size={48} className="mx-auto mb-4 opacity-50" />
            <p>Henüz bir duyuru oluşturulmamış.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann._id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between gap-4 relative">
                <div>
                  <h3 className="text-xl font-bold mb-2 text-white">{ann.title}</h3>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{ann.content}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="bg-black/50 px-3 py-1 rounded-full text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {formatDateTime(ann.createdAt)}
                    </span>
                    <span className="bg-black/50 px-3 py-1 rounded-full text-gray-400">
                      Yazan: {ann.author?.name}
                    </span>
                    {ann.targetDepartments.length === 0 ? (
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">
                        Hedef: Tüm Takım
                      </span>
                    ) : (
                      ann.targetDepartments.map(d => (
                        <span key={d._id} className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30">
                          Hedef: {d.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelete(ann._id)} className="text-gray-500 hover:text-red-500 self-start p-2 bg-black/20 rounded-lg">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* YENİ DUYURU MODALI */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-lg shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Megaphone className="text-red-500"/> Yeni Duyuru</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Başlık</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600" placeholder="Örn: Hafta Sonu Toplantısı" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">İçerik</label>
                  <textarea value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600 min-h-[100px]" placeholder="Duyuru detaylarını buraya yazın..." required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Hedef Departmanlar (Boş bırakırsanız TÜM TAKIMA gider)</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-black/40 border border-white/10 rounded-xl">
                    {departments.map(d => (
                      <label key={d._id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border text-sm transition-all ${form.targetDepartments.includes(d._id) ? 'bg-red-600/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                        <input type="checkbox" checked={form.targetDepartments.includes(d._id)} onChange={() => handleDeptToggle(d._id)} className="sr-only" />
                        {d.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => { setModalOpen(false); clearDraft(); }} className="flex-1 py-3 border border-white/20 rounded-xl hover:bg-white/5 font-bold">İptal</button>
                  <button type="submit" disabled={submitLoading} className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                    {submitLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Gönder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MOBIL FAB (Yeni Duyuru) */}
      <button 
        onClick={() => setModalOpen(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-transform active:scale-95"
      >
        <Plus size={24} />
      </button>

    </div>
  );
};

export default AdminAnnouncements;