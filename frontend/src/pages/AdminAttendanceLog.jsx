import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, X, Loader2, CalendarDays, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminAttendanceLog = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [graphLoading, setGraphLoading] = useState(false);

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
    fetchSummary();
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-sm font-medium">
          <ArrowLeft size={18} /> Dashboard'a Dön
        </Link>

        <h1 className="text-3xl font-black italic mb-8 uppercase tracking-tighter flex items-center gap-3">
          <CalendarDays className="text-red-600" size={32} />
          TAKIM YOKLAMA <span className="text-red-600">RAPORU</span>
        </h1>

        <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                <p className="text-gray-500 animate-pulse font-bold tracking-widest text-xs uppercase">Veriler Yükleniyor...</p>
              </div>
            ) : summary.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
                <AlertCircle size={48} className="text-gray-700" />
                <div className="text-center">
                   <p className="text-lg font-bold text-white/50">Henüz Kayıtlı Veri Yok</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
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
                  {summary.map((user) => (
                    <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-6 font-bold">{user.name}</td>
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