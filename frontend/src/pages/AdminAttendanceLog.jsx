import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, X, Loader2, CalendarDays, AlertCircle, Download, Search, Building } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminAttendanceLog = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [graphLoading, setGraphLoading] = useState(false);
  
  // FİLTRELEME İÇİN STATE'LER
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDep, setSelectedDep] = useState('');
  const [departments, setDepartments] = useState([]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/attendance/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSummary(data);
      } catch (err) {
        console.error("Özet tablo hatası:", err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchDepartments = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/departments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDepartments(data);
      } catch (err) { console.error('Departmanlar yüklenemedi'); }
    };

    fetchSummary();
    fetchDepartments();
  }, [token]);

  const handleViewGraph = async (userId, userName) => {
    setSelectedUser(userName);
    setGraphLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/attendance/graph/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGraphData(data);
    } catch (err) { console.error(err); } 
    finally { setGraphLoading(false); }
  };

  const formatYAxis = (tick) => {
    if (tick === 3) return 'Zamanında';
    if (tick === 2) return 'Gecikti';
    if (tick === 1) return 'Çok Geç';
    if (tick === 0) return 'Devamsız';
    return '';
  };
  
  // GRAFİKTEKİ NOKTALARIN RENGİNİ DURUMA GÖRE AYARLAYAN COMPONENT
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    
    // Eğer adam izinliyse (0 puan ama MAVİ)
    if (payload.status === 'İzinli') {
      return <circle cx={cx} cy={cy} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} />;
    }
    // Diğer puan durumları
    if (payload.score === 3) return <circle cx={cx} cy={cy} r={5} fill="#22c55e" stroke="#000" strokeWidth={1} />;
    if (payload.score === 2) return <circle cx={cx} cy={cy} r={5} fill="#facc15" stroke="#000" strokeWidth={1} />;
    if (payload.score === 1) return <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#000" strokeWidth={1} />;
    
    // Normal Devamsız (0 puan GRİ)
    return <circle cx={cx} cy={cy} r={4} fill="#6b7280" stroke="#000" strokeWidth={1} />;
  };

  // TOOLTIP İÇİN ÖZEL GÖRÜNÜM
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">{label}</p>
          <p className={`font-black text-xs uppercase ${
            data.status === 'İzinli' ? 'text-blue-500' :
            data.score === 3 ? 'text-green-500' : 
            data.score === 2 ? 'text-yellow-400' : 
            data.score === 1 ? 'text-red-500' : 'text-gray-500'
          }`}>
            DURUM: {data.status}
          </p>
          {data.delay > 0 && <p className="text-white/50 text-[10px] mt-1">Gecikme: {data.delay} dk</p>}
        </div>
      );
    }
    return null;
  };

  const exportToExcel = () => {
    if (summary.length === 0) return;

    // Excel kolonlarını hazırlama
    const excelData = summary.map(user => ({
      'Ad Soyad': user.name,
      'Rol': user.role === 'superadmin' ? 'Kurucu' : user.role === 'admin' ? 'Admin' : 'Üye',
      'Zamanında': user.green,
      'Gecikmeli': user.yellow,
      'Çok Geç': user.red,
      'İzinli': user.leave || 0,
      'Devamsız': user.absent,
      'Toplam': user.totalSessions
    }));

    // Çalışma sayfası (worksheet) ve çalışma kitabı (workbook) oluşturma
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Yoklama Raporu');

    // Excel dosyasını indirme
    XLSX.writeFile(workbook, 'Yoklama_Raporu.xlsx');
  };

  const displayedSummary = summary.filter(user => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = user.name?.toLowerCase().includes(term);
      const studentIdMatch = user.studentId?.toLowerCase().includes(term);
      if (!nameMatch && !studentIdMatch) return false;
    }
    
    if (selectedDep) {
      if (user.departmentId !== selectedDep) return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-2 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-sm font-medium">
          <ArrowLeft size={18} /> Dashboard'a Dön
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <CalendarDays className="text-red-600" size={32} />
            TAKIM YOKLAMA <span className="text-red-600">RAPORU</span>
          </h1>
          <button 
            onClick={exportToExcel}
            className="bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white border border-green-500/50 hover:border-green-500 font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 w-full md:w-auto"
          >
            <Download size={20} />
            Excel'e Aktar
          </button>
        </div>

        {/* FİLTRELEME ALANI */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="İsim veya Öğrenci No ile ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-gray-500"
            />
          </div>
          <div className="relative md:w-64">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={selectedDep}
              onChange={(e) => setSelectedDep(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white appearance-none focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            >
              <option value="">Tüm Departmanlar</option>
              {departments.map(dep => (
                <option key={dep._id} value={dep._id}>{dep.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col space-y-4 p-6">
                <div className="h-10 bg-white/5 border-b border-white/10 rounded mb-2"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : summary.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
                <AlertCircle size={48} className="text-gray-700" />
                <div className="text-center">
                   <p className="text-lg font-bold text-white/50">Henüz Kayıtlı Veri Yok</p>
                </div>
              </div>
            ) : (
              <>
                {/* MASAÜSTÜ TABLO GÖRÜNÜMÜ */}
                <table className="w-full text-left border-collapse hidden md:table">
                  <thead>
                    <tr className="bg-black/60 text-[10px] uppercase tracking-widest text-gray-400 border-b border-white/10">
                      <th className="p-6 font-black">Üye Adı</th>
                      <th className="p-6 font-black text-center text-blue-400">Rol</th>
                      <th className="p-6 font-black text-center text-green-500">Zamanında 🟢</th>
                      <th className="p-6 font-black text-center text-yellow-400">Gecikmeli 🟡</th>
                      <th className="p-6 font-black text-center text-red-500">Çok Geç 🔴</th>
                      <th className="p-6 font-black text-center text-blue-500">İzinli 🔵</th>
                      <th className="p-6 font-black text-center text-gray-500">Devamsız ⚫</th>
                      <th className="p-6 font-black text-center">Toplam</th>
                      <th className="p-6 font-black text-right">Aksiyon</th>
                      
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {displayedSummary.map((user) => (
                      <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-6">
                          <div className="font-bold text-base">{user.name}</div>
                          <div className="text-xs text-gray-500 flex items-center justify-between gap-2 mt-1">
                            <span className="flex-1">{user.studentId}</span>
                            <span className="text-blue-400 truncate">{user.department}</span>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          {user.role === 'superadmin' ? (
                            <span className="bg-purple-500/10 text-purple-500 border border-purple-500/30 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">Kurucu</span>
                          ) : user.role === 'admin' ? (
                            <span className="bg-red-500/10 text-red-500 border border-red-500/30 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">Admin</span>
                          ) : (
                            <span className="bg-blue-500/10 text-blue-500 border border-blue-500/30 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">Üye</span>
                          )}
                        </td>
                        <td className="p-6 text-center font-black text-green-500">{user.green}</td>
                        <td className="p-6 text-center font-black text-yellow-400">{user.yellow}</td>
                        <td className="p-6 text-center font-black text-red-500">{user.red}</td>
                        <td className="p-6 text-center font-black text-blue-500">{user.leave || 0}</td>
                        <td className="p-6 text-center font-black text-gray-500">{user.absent}</td>
                        <td className="p-6 text-center font-bold">{user.totalSessions}</td>
                        <td className="p-6 text-right">
                          <button 
                            onClick={() => handleViewGraph(user._id, user.name)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tighter transition-all active:scale-95 flex items-center gap-2 inline-flex"
                          >
                            <TrendingUp size={14} /> Analiz
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* MOBİL KART GÖRÜNÜMÜ */}
                <div className="flex flex-col gap-4 p-4 md:hidden">
                  {displayedSummary.map((user) => (
                    <div key={user._id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 relative">
                      {/* Üst Kısım: Kimlik */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-black text-lg text-white mb-1">{user.name}</div>
                          <div className="text-xs text-gray-400 font-semibold">{user.studentId}</div>
                          <div className="text-xs text-blue-400 font-bold mt-1">{user.department}</div>
                        </div>
                        <div>
                          {user.role === 'superadmin' ? (
                            <span className="bg-purple-500/10 text-purple-500 border border-purple-500/30 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest inline-block">Kurucu</span>
                          ) : user.role === 'admin' ? (
                            <span className="bg-red-500/10 text-red-500 border border-red-500/30 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest inline-block">Admin</span>
                          ) : (
                            <span className="bg-blue-500/10 text-blue-500 border border-blue-500/30 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest inline-block">Üye</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Puan Durumu Grid */}
                      <div className="grid grid-cols-5 gap-2 bg-black/40 rounded-xl p-3 border border-white/5">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">🟢</span>
                          <span className="font-black text-green-500 leading-none">{user.green}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">🟡</span>
                          <span className="font-black text-yellow-400 leading-none">{user.yellow}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">🔴</span>
                          <span className="font-black text-red-500 leading-none">{user.red}</span>
                        </div>
                        <div className="flex flex-col items-center border-x border-white/10 px-1">
                          <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">🔵</span>
                          <span className="font-black text-blue-500 leading-none">{user.leave || 0}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">⚫</span>
                          <span className="font-black text-gray-500 leading-none">{user.absent}</span>
                        </div>
                      </div>
                      
                      {/* Analiz Butonu */}
                      <button 
                        onClick={() => handleViewGraph(user._id, user.name)}
                        className="w-full bg-red-600/10 hover:bg-red-600 border border-red-600/30 text-red-500 hover:text-white py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 flex justify-center items-center gap-2 mt-2"
                      >
                        <TrendingUp size={16} /> Performans Analizi
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {selectedUser && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
             <div className="bg-[#141414] border border-white/10 p-8 rounded-3xl w-full max-w-4xl relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X /></button>
                <h2 className="text-2xl font-black mb-8 italic uppercase tracking-tighter">PERFORMANS: <span className="text-red-600">{selectedUser}</span></h2>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="date" stroke="#444" fontSize={10} tickMargin={10} />
                      <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tickFormatter={formatYAxis} stroke="#444" fontSize={10} />
                      <Tooltip content={<CustomTooltip />} cursor={{stroke: '#333', strokeWidth: 1}} />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#dc2626" 
                        strokeWidth={3} 
                        dot={<CustomDot />} 
                        activeDot={{ r: 8, strokeWidth: 0 }}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 flex gap-4 text-[10px] font-bold uppercase tracking-widest justify-center">
                    <span className="flex items-center gap-1 text-green-500">● Zamanında</span>
                    <span className="flex items-center gap-1 text-yellow-400">● Gecikti</span>
                    <span className="flex items-center gap-1 text-red-500">● Çok Geç</span>
                    <span className="flex items-center gap-1 text-blue-500 text-lg leading-none">●</span> <span className="text-blue-500">İzinli</span>
                    <span className="flex items-center gap-1 text-gray-500">● Devamsız</span>
                </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttendanceLog;