import React, { useState, useEffect } from 'react';
import useFormDraft from '../hooks/useFormDraft';
import axios from 'axios';
import { API_URL } from '../config';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, FileText, Send, Loader2, ArrowLeft, 
  CheckCircle, Trash2, Pencil, X, Save, Clock, AlertCircle, History 
} from 'lucide-react';

const LeaveRequest = () => {
  // FAZ 2: Form taslak (draft) desteği — sayfa yenilendiğinde veri kaybolmaz
  const [draft, setDraft, clearDraft] = useFormDraft('leave-request', { requestedDate: '', reason: '' });
  const [myLeaves, setMyLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // --- YENİ: SEKME YÖNETİMİ ---
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' veya 'history'
  
  // --- YENİ: MOBİL FORM GÖRÜNÜMÜ ---
  const [showMobileForm, setShowMobileForm] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editReason, setEditReason] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/leave/my-leaves`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyLeaves(data);
    } catch (err) {
      console.error("İzinler yüklenemedi", err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data } = await axios.post(
        `${API_URL}/leave`,
        { requestedDate: draft.requestedDate, reason: draft.reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(data.message);
      clearDraft(); // Taslağı temizle
      setShowMobileForm(false); // Formu kapatalım
      fetchMyLeaves(); 
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu izin talebini geri çekmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_URL}/leave/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyLeaves(myLeaves.filter(leave => leave._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Hata oluştu.');
    }
  };

  const startEdit = (leave) => {
    setEditId(leave._id);
    setEditReason(leave.reason);
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`${API_URL}/leave/${id}`, 
        { reason: editReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMyLeaves(myLeaves.map(l => l._id === id ? { ...l, reason: editReason } : l));
      setEditId(null);
    } catch (err) {
      alert('Güncelleme başarısız.');
    }
  };

  // --- YENİ: FİLTRELEME MANTIĞI ---
  const pendingLeaves = myLeaves.filter(l => !l.status || l.status === 'Bekliyor');
  const historyLeaves = myLeaves.filter(l => l.status === 'Onaylandı' || l.status === 'Reddedildi');
  
  const displayedLeaves = activeTab === 'pending' ? pendingLeaves : historyLeaves;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-2 md:p-8 relative pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center gap-4 mb-10">
          <Link to="/dashboard" className="p-2 bg-white/5 hover:bg-red-600/20 hover:text-red-500 rounded-lg transition-all border border-white/10">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase">
              İTÜ RACING <span className="text-red-600">İzin Portalı</span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SOL: FORM (Masaüstünde Gözükür) */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md sticky top-24 shadow-xl">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Send size={18} className="text-red-600" /> Talep Oluştur
              </h2>

              {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-[11px] p-3 rounded-lg mb-4 flex items-center gap-2"><AlertCircle size={14}/> {error}</div>}
              {message && <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-[11px] p-3 rounded-lg mb-4 flex items-center gap-2"><CheckCircle size={14}/> {message}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="date"
                  min={today}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600 transition-all [&::-webkit-calendar-picker-indicator]:invert"
                  value={draft.requestedDate}
                  onChange={(e) => setDraft({...draft, requestedDate: e.target.value})}
                  required
                />
                <textarea
                  placeholder="Mazeretiniz..."
                  rows="4"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600 transition-all resize-none"
                  value={draft.reason}
                  onChange={(e) => setDraft({...draft, reason: e.target.value})}
                  required
                ></textarea>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Gönder'}
                </button>
              </form>
            </div>
          </div>

          {/* SAĞ: SEKMELİ LİSTE */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* SEKME BUTONLARI */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
              <button 
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'pending' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-400 hover:text-white'}`}
              >
                <Clock size={14} /> Bekleyenler ({pendingLeaves.length})
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <History size={14} /> Geçmiş ({historyLeaves.length})
              </button>
            </div>

            {/* LİSTELEME ALANI */}
            {fetchLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/10"></div>)}
              </div>
            ) : displayedLeaves.length === 0 ? (
              <div className="bg-white/5 border border-white/10 p-12 rounded-2xl text-center text-gray-500 italic border-dashed">
                {activeTab === 'pending' ? 'Şu an bekleyen bir talebiniz yok.' : 'Henüz geçmiş bir işleminiz bulunmuyor.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedLeaves.map((leave) => (
                  <div key={leave._id} className={`bg-white/5 border border-white/10 p-5 rounded-2xl border-l-4 transition-all hover:bg-white/[0.08] ${leave.status === 'Onaylandı' ? 'border-l-green-500' : leave.status === 'Reddedildi' ? 'border-l-red-600' : 'border-l-yellow-500'}`}>
                    
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-black text-gray-400">
                        {new Date(leave.requestedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase border ${
                        leave.status === 'Onaylandı' ? 'text-green-500 border-green-500/30' : 
                        leave.status === 'Reddedildi' ? 'text-red-500 border-red-500/30' : 'text-yellow-500 border-yellow-500/30'
                      }`}>
                        {leave.status || 'Bekliyor'}
                      </span>
                    </div>

                    {editId === leave._id ? (
                      <div className="space-y-2">
                        <textarea 
                          className="w-full bg-black/50 border border-white/20 rounded-lg p-2 text-xs focus:border-red-500 outline-none" 
                          value={editReason}
                          onChange={(e) => setEditReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdate(leave._id)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-[10px] font-bold transition-colors">Kaydet</button>
                          <button onClick={() => setEditId(null)} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-[10px] font-bold transition-colors">İptal</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-300 italic mb-6 line-clamp-3">"{leave.reason}"</p>
                        
                        {/* REDDEDİLMEDİYSE aksiyonları göster */}
                        {leave.status !== 'Reddedildi' && (
                          <div className="flex gap-4 border-t border-white/5 pt-3">
                            <button onClick={() => startEdit(leave)} className="text-[10px] font-bold text-gray-500 hover:text-white flex items-center gap-1 transition-colors uppercase">
                              <Pencil size={12} /> Düzenle
                            </button>
                            <button onClick={() => handleDelete(leave._id)} className="text-[10px] font-bold text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors uppercase">
                              <Trash2 size={12} /> Geri Çek
                            </button>
                          </div>
                        )}
                        {leave.status === 'Reddedildi' && (
                           <div className="mt-2 text-[10px] text-red-500/60 italic border-t border-white/5 pt-3">
                             * Bu talep reddedildiği için işlem yapılamaz.
                           </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MOBİL FAB (Talep Oluştur) */}
      <button 
        onClick={() => setShowMobileForm(true)}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-transform active:scale-95"
      >
        <Send size={24} />
      </button>

      {/* MOBİL MODAL: TALEP FORMU */}
      {showMobileForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 lg:hidden">
          <div className="bg-[#141414] border-t sm:border border-white/10 p-6 rounded-t-3xl sm:rounded-3xl w-full max-w-md relative animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <button 
              onClick={() => setShowMobileForm(false)} 
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 italic uppercase">
              <Send size={20} className="text-red-600" /> Talep Oluştur
            </h2>

            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-[11px] p-3 rounded-lg mb-4 flex items-center gap-2"><AlertCircle size={14}/> {error}</div>}
            {message && <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-[11px] p-3 rounded-lg mb-4 flex items-center gap-2"><CheckCircle size={14}/> {message}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="date"
                min={today}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600 transition-all [&::-webkit-calendar-picker-indicator]:invert"
                value={draft.requestedDate}
                onChange={(e) => setDraft({...draft, requestedDate: e.target.value})}
                required
              />
              <textarea
                placeholder="Mazeretiniz..."
                rows="4"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600 transition-all resize-none"
                value={draft.reason}
                onChange={(e) => setDraft({...draft, reason: e.target.value})}
                required
              ></textarea>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Gönder'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeaveRequest;