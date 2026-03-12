import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, User, Calendar as CalendarIcon, FileText, RotateCcw, ListFilter } from 'lucide-react';

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // SEKME YÖNETİMİ: 'pending' (Bekleyenler) veya 'processed' (İşlem Görenler)
  const [activeTab, setActiveTab] = useState('pending');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const { data } = await axios.get(`${API_URL}/leave`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(data);
    } catch (err) {
      setError('İzin talepleri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `${API_URL}/leave/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // İşlem başarılıysa ekrandaki listeyi anında güncelle
      setLeaves(leaves.map(leave => 
        leave._id === id ? { ...leave, status: newStatus } : leave
      ));
    } catch (err) {
      alert('Durum güncellenemedi!');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Onaylandı') return <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-xs font-bold border border-green-500/50">Onaylandı</span>;
    if (status === 'Reddedildi') return <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-500/50">Reddedildi</span>;
    return <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/50 flex items-center gap-1"><Clock size={12}/> Bekliyor</span>;
  };

  // VERİLERİ SEKME SEÇİMİNE GÖRE FİLTRELİYORUZ
  const displayedLeaves = leaves.filter(leave => {
    if (activeTab === 'pending') {
      return !leave.status || leave.status === 'Bekliyor';
    } else {
      return leave.status === 'Onaylandı' || leave.status === 'Reddedildi';
    }
  });

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-4 md:p-8 text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Üst Başlık */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 bg-white/5 hover:bg-red-600/20 hover:text-red-500 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tighter italic">
                YÖNETİCİ <span className="text-red-600">İZİN PANELİ</span>
              </h1>
              <p className="text-sm text-gray-400">Takım üyelerinin izin taleplerini buradan yönetebilirsiniz.</p>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 border border-red-500/50">{error}</div>}

        {/* SEKME BUTONLARI (TABS) */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4 overflow-x-auto">
          <ListFilter size={20} className="text-gray-500 mr-2" />
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'pending' 
                ? 'bg-red-600 text-white' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            Bekleyen Talepler 
            <span className="ml-2 bg-black/30 px-2 py-0.5 rounded-full text-xs">
              {leaves.filter(l => !l.status || l.status === 'Bekliyor').length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('processed')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'processed' 
                ? 'bg-white/20 text-white border border-white/30' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            Geçmiş İşlemler
            <span className="ml-2 bg-black/30 px-2 py-0.5 rounded-full text-xs">
              {leaves.filter(l => l.status === 'Onaylandı' || l.status === 'Reddedildi').length}
            </span>
          </button>
        </div>

        {/* İzin Kartları Listesi */}
        {loading ? (
          <div className="text-center text-gray-500 py-10 animate-pulse">Talepler yükleniyor... 🏎️</div>
        ) : displayedLeaves.length === 0 ? (
          <div className="text-center bg-white/5 p-10 rounded-2xl border border-white/10 text-gray-400 flex flex-col items-center gap-3">
            <Check size={48} className="text-green-500/50" />
            <p>{activeTab === 'pending' ? 'Harika! Bekleyen hiçbir izin talebi yok.' : 'Henüz işlem görmüş bir izin talebi yok.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedLeaves.map((leave) => (
              <div key={leave._id} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-white/20 transition-colors flex flex-col justify-between">
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-red-600/20 p-2 rounded-lg text-red-500">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold">{leave.user?.name || 'Bilinmeyen Kullanıcı'}</h3>
                        <p className="text-xs text-gray-400">No: {leave.user?.studentId || '-'}</p>
                      </div>
                    </div>
                    {getStatusBadge(leave.status || 'Bekliyor')}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2 text-sm">
                      <CalendarIcon size={16} className="text-gray-500 mt-0.5" />
                      <div>
                        <span className="text-gray-500 block text-xs">Talep Edilen Tarih</span>
                        <span>{new Date(leave.requestedDate).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 text-sm bg-black/20 p-3 rounded-lg border border-white/5">
                      <FileText size={16} className="text-gray-500 mt-0.5 shrink-0" />
                      <p className="text-gray-300 italic">"{leave.reason}"</p>
                    </div>
                  </div>
                </div>

                {/* AKSİYON BUTONLARI: Bulunulan sekmeye göre değişir */}
                {activeTab === 'pending' ? (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                    <button 
                      onClick={() => handleStatusUpdate(leave._id, 'Onaylandı')}
                      className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 hover:border-green-500 py-2 rounded-lg flex items-center justify-center gap-1 text-sm font-bold transition-all"
                    >
                      <Check size={16} /> Onayla
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(leave._id, 'Reddedildi')}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 hover:border-red-500 py-2 rounded-lg flex items-center justify-center gap-1 text-sm font-bold transition-all"
                    >
                      <X size={16} /> Reddet
                    </button>
                  </div>
                ) : (
                  // Geçmiş İşlemler Sekmesindeki Kalıcı Geri Al Butonu
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button 
                      onClick={() => handleStatusUpdate(leave._id, 'Bekliyor')}
                      className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 hover:border-white/30 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all"
                    >
                      <RotateCcw size={16} /> Kararı Geri Al (Beklemeye Taşı)
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeaves;