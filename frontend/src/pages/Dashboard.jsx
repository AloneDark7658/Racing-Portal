import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
// X ikonunu da ekledik (Modalı kapatmak için)
import { LogOut, User, ShieldAlert, Car, CalendarPlus, ClipboardList, QrCode, TrendingUp, Activity, Settings, Building2, Megaphone, Bell, X } from 'lucide-react'; 

import { API_URL as API } from '../config';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnn, setSelectedAnn] = useState(null); // Tıklanan duyuruyu tutar
  const [stats, setStats] = useState({ todayAttendanceCount: 0, pendingLeaveCount: 0 }); // Admin Özet istatistikleri
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAdminStats = async (token) => {
    try {
      const attRes = await axios.get(`${API}/attendance/today`, { headers: { Authorization: `Bearer ${token}` } });
      const todayCount = attRes.data.length || 0;

      const leaveRes = await axios.get(`${API}/leave`, { headers: { Authorization: `Bearer ${token}` } });
      const pendingCount = leaveRes.data.filter(l => !l.status || l.status === 'Bekliyor').length || 0;

      setStats({ todayAttendanceCount: todayCount, pendingLeaveCount: pendingCount });
    } catch (err) {
      console.error("Yönetici istatistikleri alınamadı", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      const fetchDashboardData = async () => {
        try {
          const annRes = await axios.get(`${API}/announcements`, { headers: { Authorization: `Bearer ${token}` } });
          setAnnouncements(annRes.data);
          
          if (parsedUser.role === 'admin' || parsedUser.role === 'superadmin') {
            await fetchAdminStats(token);
          }
        } catch (err) {
          console.error("Dashboard verileri alınamadı", err);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Başarıyla çıkış yapıldı!');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Üst Navigasyon Barı */}
      <nav className="bg-white/5 border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Car className="text-red-600" size={28} />
              <span className="text-xl font-black tracking-tighter italic">
                İTÜ <span className="text-red-600">RACING</span>
              </span>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold">{user.name}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  {user.role === 'admin' || user.role === 'superadmin' ? (
                    <><ShieldAlert size={12} className="text-red-500" /> Yönetici Paneli</>
                  ) : (
                    <><User size={12} /> Üye Paneli</>
                  )}
                </span>
              </div>
              <Link
                to="/profile"
                className="hidden md:flex p-2 bg-white/5 hover:bg-red-600/20 hover:text-red-500 rounded-lg transition-all border border-white/10"
                title="Profil Ayarları"
              >
                <Settings size={20} />
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white p-2 rounded-lg transition-all"
                title="Çıkış Yap"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Ana İçerik Alanı */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-2">
            Hoş Geldin, <span className="text-red-500">{user.name}</span>! 🏎️
          </h2>
          <p className="text-gray-400">
            Burası senin ana merkezin. Aşağıdaki menüleri kullanarak işlemlerini yapabilirsin.
          </p>
        </div>

        {/* YÖNETİCİ ÖZET KARTLARI */}
        {(user.role === 'admin' || user.role === 'superadmin') && (
          loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
               <div className="h-[104px] bg-white/5 rounded-2xl border border-white/10 animate-pulse"></div>
               <div className="h-[104px] bg-white/5 rounded-2xl border border-white/10 animate-pulse"></div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Link to="/admin/attendance-log" className="bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 hover:border-green-500/50 p-6 rounded-2xl flex items-center justify-between transition-all group cursor-pointer">
                <div>
                  <p className="text-sm text-green-500 font-bold mb-1 group-hover:text-green-400 transition-colors">Bugünkü Yoklama</p>
                  <h3 className="text-3xl font-black text-white">{stats.todayAttendanceCount} <span className="text-sm font-normal text-gray-400">kişi</span></h3>
                </div>
                <div className="bg-green-500/20 p-4 rounded-full text-green-500 group-hover:scale-110 transition-transform">
                  <TrendingUp size={32} />
                </div>
              </Link>

              <Link to="/admin/leaves" className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/20 hover:border-yellow-500/50 p-6 rounded-2xl flex items-center justify-between transition-all group cursor-pointer">
                <div>
                  <p className="text-sm text-yellow-500 font-bold mb-1 group-hover:text-yellow-400 transition-colors">Bekleyen İzinler</p>
                  <h3 className="text-3xl font-black text-white">{stats.pendingLeaveCount} <span className="text-sm font-normal text-gray-400">talep</span></h3>
                </div>
                <div className="bg-yellow-500/20 p-4 rounded-full text-yellow-500 group-hover:scale-110 transition-transform">
                  <ClipboardList size={32} />
                </div>
              </Link>
            </div>
          )
        )}

        {/* --- DUYURULAR BÖLÜMÜ (Sadeleştirilmiş ve Tıklanabilir) --- */}
        {loading ? (
             <div className="mb-8 border border-white/5 bg-white/5 rounded-2xl p-6 h-48 animate-pulse"></div>
        ) : announcements.length > 0 && (
          <div className="mb-8 border border-blue-500/20 bg-blue-500/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                <Bell size={20} className="animate-pulse" /> Güncel Duyurular
              </h3>
              <Link to="/announcements" className="text-sm font-bold text-blue-500 hover:text-blue-400 hover:underline">
                Tümünü Gör &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.slice(0, 4).map(ann => (
                <div 
                  key={ann._id} 
                  onClick={() => setSelectedAnn(ann)}
                  className="bg-black/40 border border-white/5 hover:border-blue-500/50 p-4 rounded-xl relative cursor-pointer group transition-all"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{ann.title}</h4>
                  <div className="text-[10px] text-gray-500 mt-2 font-semibold uppercase flex justify-between">
                    <span>{ann.author?.name}</span>
                    <span>{new Date(ann.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Ortak Butonlar */}
          {/* YENİ EKLENEN: YOKLAMA OKUTMA BUTONU */}
          <Link to="/direct-scan" className="bg-white/5 border border-green-500/30 hover:border-green-500 hover:bg-green-500/10 transition-all p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
            <div className="bg-green-500/20 p-4 rounded-full text-green-500 group-hover:scale-110 transition-transform">
              <QrCode size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">Yoklama Okut</h3>
            <p className="text-sm text-gray-400 text-center">Kameranızı açarak piste giriş/çıkış yapın.</p>
          </Link>
          <Link to="/profile" className="bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
            <div className="bg-red-600/20 p-4 rounded-full text-red-500 group-hover:scale-110 transition-transform">
              <Settings size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">Profil Ayarları</h3>
            <p className="text-sm text-gray-400 text-center">E-posta ve şifrenizi güncelleyin.</p>
          </Link>
          
          <Link to="/leave-request" className="bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
            <div className="bg-red-600/20 p-4 rounded-full text-red-500 group-hover:scale-110 transition-transform">
              <CalendarPlus size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">İzin Talebi Oluştur</h3>
            <p className="text-sm text-gray-400 text-center">Antrenmanlara katılamayacaksan bildir.</p>
          </Link>
          
          <Link to="/my-performance" className="bg-white/5 border border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10 transition-all p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
            <div className="bg-blue-500/20 p-4 rounded-full text-blue-500 group-hover:scale-110 transition-transform">
              <Activity size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">Sürücü Telemetrisi</h3>
            <p className="text-sm text-gray-400 text-center">Performans grafiğini ve devamlılığını incele.</p>
          </Link>

          {/* ADMİN BUTONLARI */}
          {(user.role === 'admin' || user.role === 'superadmin') && (
            <>
              <Link to="/admin/announcements" className="bg-white/5 border border-pink-500/30 hover:border-pink-500 hover:bg-pink-500/10 transition-all p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
                <div className="bg-pink-500/20 p-4 rounded-full text-pink-500 group-hover:scale-110 transition-transform">
                  <Megaphone size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">Duyuruları Yönet</h3>
                <p className="text-sm text-gray-400 text-center">Takıma veya departmanlara duyuru gönderin.</p>
              </Link>

              <Link to="/admin/leaves" className="bg-white/5 border border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10 transition-all p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
                <div className="bg-yellow-500/20 p-4 rounded-full text-yellow-500 group-hover:scale-110 transition-transform">
                  <ClipboardList size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">İzinleri Yönet</h3>
                <p className="text-sm text-gray-400 text-center">İzin taleplerini onayla veya reddet.</p>
              </Link>

              <Link to="/admin/qr-generate" className="bg-white/5 border border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10 transition-all p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
                <div className="bg-blue-500/20 p-4 rounded-full text-blue-500 group-hover:scale-110 transition-transform">
                  <QrCode size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">Yoklama Başlat</h3>
                <p className="text-sm text-gray-400 text-center">Günün antrenmanı için QR kod panosunu aç.</p>
              </Link>

              <Link to="/admin/attendance-log" className="bg-white/5 border border-green-500/30 hover:border-green-500 hover:bg-green-500/10 transition-all p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
                <div className="bg-green-500/20 p-4 rounded-full text-green-500 group-hover:scale-110 transition-transform">
                  <TrendingUp size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">Raporlar & Analiz</h3>
                <p className="text-sm text-gray-400 text-center">Takımın devamlılık grafiğini incele.</p>
              </Link>

              <Link to="/admin/departments" className="bg-white/5 border border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 transition-all p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
                <div className="bg-purple-500/20 p-4 rounded-full text-purple-500 group-hover:scale-110 transition-transform">
                  <Building2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">Departman & Mesai</h3>
                <p className="text-sm text-gray-400 text-center">Alt birimleri ve mesai saatlerini yönet.</p>
              </Link>
            </>
          )}
        </div>

        <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-500">
          🚧 <strong>Bilgi:</strong> Yoklama okutabilmek için admininizin açtığı qr kodu, "Yoklama Okut" sekmesinden kameranızı açıp qr kodu okutmanız gerekmektedir.
        </div>
      </main>

      {/* --- DUYURU OKUMA MODALI (Açılır Pencere) --- */}
      {selectedAnn && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelectedAnn(null)}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{selectedAnn.title}</h2>
              <button onClick={() => setSelectedAnn(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <p className="text-gray-300 whitespace-pre-wrap">{selectedAnn.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 