import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Megaphone, X, Calendar, Clock } from 'lucide-react'; // Clock eklendi

const API = 'http://localhost:5000/api';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnn, setSelectedAnn] = useState(null); 
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    axios.get(`${API}/announcements`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setAnnouncements(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Duyurular çekilemedi', err);
        setLoading(false);
      });
  }, [navigate, token]);

  // TARİH VE SAAT FORMATLAYICI
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-4 md:p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10">
          <Link to="/dashboard" className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-black italic flex items-center gap-2">
              <Bell className="text-blue-500" /> TAKIM <span className="text-blue-500">DUYURULARI</span>
            </h1>
            <p className="text-sm text-gray-400">Tüm güncel ve geçmiş duyuruları buradan takip edebilirsiniz.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-12 text-gray-500 animate-pulse">Yükleniyor...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center bg-white/5 p-12 rounded-2xl border border-white/10 text-gray-400">
            <Megaphone size={48} className="mx-auto mb-4 opacity-50" />
            <p>Henüz sana veya takıma ait bir duyuru bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {announcements.map((ann) => (
              <div 
                key={ann._id} 
                onClick={() => setSelectedAnn(ann)}
                className="bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl p-5 cursor-pointer transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {ann.title}
                  </h3>
                  <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap bg-black/40 px-2 py-1 rounded-lg">
                    <Clock size={12} /> {/* İkon saat ikonuna çevrildi */}
                    {formatDateTime(ann.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-2 line-clamp-1">
                  {ann.content}
                </p>
                <div className="text-xs text-blue-500 mt-3 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Devamını okumak için tıkla &rarr;
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DUYURU OKUMA EKRANI (MODAL) */}
        {selectedAnn && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelectedAnn(null)}>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedAnn.title}</h2>
                  <div className="flex gap-3 text-xs font-semibold text-gray-400">
                    <span className="bg-black/50 px-2 py-1 rounded-md">Yazan: {selectedAnn.author?.name}</span>
                    <span className="bg-black/50 px-2 py-1 rounded-md">{formatDateTime(selectedAnn.createdAt)}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedAnn(null)} className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {selectedAnn.content}
                </p>
              </div>
              <div className="p-4 border-t border-white/10 bg-black/40 text-right">
                <button onClick={() => setSelectedAnn(null)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;