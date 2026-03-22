import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, User, ShieldAlert, Car, CalendarPlus, ClipboardList, QrCode, TrendingUp, Activity, Settings, Building2, Megaphone, Bell, X, ListTodo, CheckSquare } from 'lucide-react';

import { API_URL as API } from '../config';
import TaskDrawer from '../components/TaskDrawer';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnn, setSelectedAnn] = useState(null); // Tıklanan duyuruyu tutar
  const [stats, setStats] = useState({ todayAttendanceCount: 0, pendingLeaveCount: 0 }); // Admin Özet istatistikleri
  const [loading, setLoading] = useState(true);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [activeTaskCount, setActiveTaskCount] = useState(0); 
  const [isAnnouncementDrawerOpen, setIsAnnouncementDrawerOpen] = useState(false);
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);
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
          const fetchedAnn = annRes.data;
          setAnnouncements(fetchedAnn);

          if (fetchedAnn.length > 0) {
            const lastRead = localStorage.getItem('lastReadAnnouncementId');
            
            // Okunmamış duyuru sayısını hesapla
            let unreadCount = 0;
            for (const ann of fetchedAnn) {
              if (ann._id === lastRead) break;
              unreadCount++;
            }

            if (unreadCount > 0) {
              setHasUnreadAnnouncements(unreadCount);
              toast(`🔔 ${unreadCount} yeni duyurunuz var!`, {
                id: 'unread-announcements-toast', // Aynı toast'ın 2 kere çıkmasını engeller
                position: 'top-center',
                style: { background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a' }
              });
            }
          }

          const tasksRes = await axios.get(`${API}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
          const myActiveTasks = tasksRes.data.filter(task => {
            if (task.status === 'Bitti') return false;
            // Adminler için kendisine atanan görevler
            if (task.assignmentType === 'takim') return true;
            if (task.assignmentType === 'kisi' && task.assignedUsers?.some(u => 
              (typeof u === 'object' ? u._id : u) === (parsedUser._id || parsedUser.id)
            )) return true;
            if (task.assignmentType === 'ekip' && task.assignedDepartments?.some(d => 
              (typeof d === 'object' ? d._id : d) === parsedUser.departmentId
            )) return true;
            return false;
          });
          setActiveTaskCount(myActiveTasks.length);

          if (['admin', 'superadmin'].includes(parsedUser.role)) {
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
                  {['admin', 'superadmin'].includes(user.role) ? (
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

              {/* Duyurular Zili */}
              <button
                onClick={() => {
                  setIsAnnouncementDrawerOpen(true);
                  if (hasUnreadAnnouncements > 0 && announcements.length > 0) {
                    setHasUnreadAnnouncements(0);
                    localStorage.setItem('lastReadAnnouncementId', announcements[0]._id);
                  }
                }}
                className="relative p-2 bg-white/5 hover:bg-blue-500/20 hover:text-blue-500 text-gray-300 rounded-lg transition-all border border-white/10"
                title="Duyurular"
              >
                <Bell size={20} />
                {hasUnreadAnnouncements > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 border-2 border-[#0f0f0f] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {hasUnreadAnnouncements}
                  </span>
                )}
              </button>

              {/* Görev Çekmecesi Butonu */}
              <button
                onClick={() => setIsTaskDrawerOpen(true)}
                className="relative p-2 bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-500 text-gray-300 rounded-lg transition-all border border-white/10"
                title="Aktif Görevler"
              >
                <CheckSquare size={20} />
                {activeTaskCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {activeTaskCount}
                  </span>
                )}
              </button>
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
        <div className="p-4 mb-6 bg-white/5 border border-white/10 rounded-xl">
          <h1 className="text-xl font-bold text-white">👋 Merhaba, {user?.name}</h1>
        </div>

        {/* YÖNETİCİ ÖZET KARTLARI */}
        {['admin', 'superadmin'].includes(user.role) && (
          loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="h-[104px] w-full bg-white/5 rounded-2xl border border-white/10 animate-pulse"></div>
              <div className="h-[104px] w-full bg-white/5 rounded-2xl border border-white/10 animate-pulse"></div>
            </div>
          ) : (
            <div className="flex flex-row overflow-x-auto gap-3 snap-x hide-scrollbar mb-6 md:mb-8 pb-2">
              <Link to="/admin/attendance-log" className="min-w-[200px] shrink-0 snap-center bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 hover:border-green-500/50 p-4 rounded-2xl flex items-center justify-between transition-all group cursor-pointer block">
                <div>
                  <p className="text-sm text-green-500 font-bold mb-1 group-hover:text-green-400 transition-colors">Bugünkü Yoklama</p>
                  <h3 className="text-2xl font-black text-white">{stats.todayAttendanceCount}</h3>
                </div>
                <div className="bg-green-500/20 p-3 rounded-full text-green-500 group-hover:scale-110 transition-transform">
                  <TrendingUp size={24} />
                </div>
              </Link>
              <Link to="/admin/leaves" className="min-w-[200px] shrink-0 snap-center bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/20 hover:border-yellow-500/50 p-4 rounded-2xl flex items-center justify-between transition-all group cursor-pointer block">
                <div>
                  <p className="text-sm text-yellow-500 font-bold mb-1 group-hover:text-yellow-400 transition-colors">Bekleyen İzinler</p>
                  <h3 className="text-2xl font-black text-white">{stats.pendingLeaveCount}</h3>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded-full text-yellow-500 group-hover:scale-110 transition-transform">
                  <ClipboardList size={24} />
                </div>
              </Link>
            </div>
          )
        )}



        {/* --- ANA BUTONLAR GRİDİ --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 md:gap-6 mb-8">
          <Link to="/attendance-hub" className="bg-white/5 border border-green-500/30 hover:border-green-500 hover:bg-green-500/10 transition-all p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
            <div className="bg-green-500/20 p-4 rounded-full text-green-500 group-hover:scale-110 transition-transform">
              <QrCode size={32} />
            </div>
            <h3 className="text-sm md:text-lg font-bold text-white text-center">Yoklama İşlemleri</h3>
            <p className="hidden md:block text-sm text-gray-400 text-center">Yoklama okutma, başlatma ve analiz.</p>
          </Link>

          <Link to="/leave-hub" className="bg-white/5 border border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10 transition-all p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
            <div className="bg-yellow-500/20 p-4 rounded-full text-yellow-500 group-hover:scale-110 transition-transform">
              <CalendarPlus size={32} />
            </div>
            <h3 className="text-sm md:text-lg font-bold text-white text-center">İzin İşlemleri</h3>
            <p className="hidden md:block text-sm text-gray-400 text-center">İzin talepleri ve yönetimi.</p>
          </Link>

          {['admin', 'superadmin'].includes(user.role) && (
            <Link to="/admin/announcements" className="bg-white/5 border border-pink-500/30 hover:border-pink-500 hover:bg-pink-500/10 transition-all p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
              <div className="bg-pink-500/20 p-4 rounded-full text-pink-500 group-hover:scale-110 transition-transform">
                <Megaphone size={32} />
              </div>
              <h3 className="text-sm md:text-lg font-bold text-white text-center">Duyuruları Yönet</h3>
              <p className="hidden md:block text-sm text-gray-400 text-center">Takıma veya departmanlara duyuru gönderin.</p>
            </Link>
          )}

          {['admin', 'superadmin'].includes(user.role) && (
            <Link to="/admin/departments" className="bg-white/5 border border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 transition-all p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
              <div className="bg-purple-500/20 p-4 rounded-full text-purple-500 group-hover:scale-110 transition-transform">
                <Building2 size={32} />
              </div>
              <h3 className="text-sm md:text-lg font-bold text-white text-center">Departman & Mesai</h3>
              <p className="hidden md:block text-sm text-gray-400 text-center">Alt birimleri ve mesai saatlerini yönet.</p>
            </Link>
          )}

          <Link to="/tasks" className="bg-white/5 border border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/10 transition-all p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
            <div className="bg-orange-500/20 p-4 rounded-full text-orange-500 group-hover:scale-110 transition-transform">
              <ListTodo size={32} />
            </div>
            <h3 className="text-sm md:text-lg font-bold text-white text-center">Görev Panosu</h3>
            <p className="hidden md:block text-sm text-gray-400 text-center">Kanban board ile görev yönetimi.</p>
          </Link>

          <Link to="/profile" className="bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
            <div className="bg-red-600/20 p-4 rounded-full text-red-500 group-hover:scale-110 transition-transform">
              <Settings size={32} />
            </div>
            <h3 className="text-sm md:text-lg font-bold text-white text-center">Profil Ayarları</h3>
            <p className="hidden md:block text-sm text-gray-400 text-center">Hesap bilgilerinizi güncelleyin.</p>
          </Link>
        </div>
      </main>

      {/* --- DUYURU OKUMA MODALI (Açılır Pencere) --- */}
      {selectedAnn && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm" onClick={() => setSelectedAnn(null)}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white line-clamp-1">{selectedAnn.title}</h2>
              <button onClick={() => setSelectedAnn(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 shrink-0">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="text-xs text-blue-400 mb-4 flex justify-between uppercase font-semibold">
                <span>{selectedAnn.author?.name}</span>
                <span>{new Date(selectedAnn.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{selectedAnn.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* --- DUYURU LİSTESİ DRAWER --- */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] transition-opacity duration-300 ${isAnnouncementDrawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={() => setIsAnnouncementDrawerOpen(false)} 
      />
      <div className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-[#111111] border-l border-white/10 shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col ${isAnnouncementDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#161616]">
          <h2 className="text-xl font-bold italic tracking-tight text-white flex items-center gap-2">
            <Bell size={20} className="text-blue-500" /> Duyurular
          </h2>
          <button onClick={() => setIsAnnouncementDrawerOpen(false)} className="p-1.5 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
             <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-3 bg-white/5 rounded-2xl border border-white/5 p-6 text-center">
              <Megaphone size={32} className="opacity-50" />
              <p className="text-sm">Henüz bir duyuru yok.</p>
            </div>
          ) : (
            announcements.map(ann => (
              <div 
                key={ann._id} 
                onClick={() => { setSelectedAnn(ann); }}
                className="bg-[#1a1a1a] border border-white/10 hover:border-blue-500/50 p-4 rounded-xl relative cursor-pointer group transition-all"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl"></div>
                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors text-sm line-clamp-2 mb-1">{ann.title}</h4>
                <p className="text-xs text-gray-400 line-clamp-1 mb-3">{ann.content}</p>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold uppercase">
                  <span>{ann.author?.name}</span>
                  <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                    {new Date(ann.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-white/10 bg-[#161616]">
          <Link to="/announcements" className="block w-full text-center py-3 bg-white/5 hover:bg-blue-500/10 text-blue-500 rounded-xl font-bold transition-all border border-blue-500/20">
            Tüm Duyurular Sayfasına Git
          </Link>
        </div>
      </div>

      {/* Task Drawer bileşeni */}
      <TaskDrawer isOpen={isTaskDrawerOpen} onClose={() => setIsTaskDrawerOpen(false)} />
    </div>
  );
};

export default Dashboard; 