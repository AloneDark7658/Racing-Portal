import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, CheckCircle, AlertTriangle, XOctagon, Loader2, Gauge, CalendarDays } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MyPerformance = () => {
  const [summary, setSummary] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, graphRes] = await Promise.all([
          axios.get(`${API_URL}/attendance/my-summary`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/attendance/my-graph`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setSummary(summaryRes.data);
        setGraphData(graphRes.data);
      } catch (err) {
        console.error("Veriler çekilemedi:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  const formatYAxis = (tick) => {
    if (tick === 3) return 'Zamanında';
    if (tick === 2) return 'Gecikti';
    if (tick === 1) return 'Çok Geç';
    if (tick === 0) return 'Devamsız';
    return '';
  };

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    
    if (payload.status === 'İzinli') {
      return <circle cx={cx} cy={cy} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} />;
    }
    if (payload.score === 3) return <circle cx={cx} cy={cy} r={5} fill="#22c55e" stroke="#000" strokeWidth={1} />;
    if (payload.score === 2) return <circle cx={cx} cy={cy} r={5} fill="#facc15" stroke="#000" strokeWidth={1} />;
    if (payload.score === 1) return <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#000" strokeWidth={1} />;
    
    return <circle cx={cx} cy={cy} r={4} fill="#6b7280" stroke="#000" strokeWidth={1} />;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black border border-white/10 p-4 rounded-xl shadow-2xl">
          <p className="text-white/50 text-[10px] font-bold mb-2 border-b border-white/10 pb-2 uppercase tracking-widest">{label}</p>
          <p className={`font-black text-sm uppercase ${
            data.status === 'İzinli' ? 'text-blue-500' :
            data.score === 3 ? 'text-green-500' : 
            data.score === 2 ? 'text-yellow-400' : 
            data.score === 1 ? 'text-red-500' : 'text-gray-500'
          }`}>
            DURUM: {data.status}
          </p>
          {data.delay > 0 && <p className="text-gray-400 text-xs mt-2 font-mono">Gecikme: +{data.delay} DK</p>}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-4 bg-white/10 rounded animate-pulse mb-8"></div>
          <div className="w-72 h-10 bg-white/10 rounded animate-pulse mb-10"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {[...Array(5)].map((_, i) => (
               <div key={i} className="bg-[#111] border border-white/5 h-32 rounded-3xl animate-pulse"></div>
            ))}
          </div>
          
          <div className="bg-[#111] border border-white/5 h-[400px] rounded-[2rem] animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Üst Kısım: Geri Butonu ve Başlık */}
        <Link to="/attendance-hub" className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-xs font-black uppercase tracking-widest">
          <ArrowLeft size={16} /> Geri Dön
        </Link>

        <h1 className="text-4xl font-black italic mb-10 uppercase tracking-tighter flex items-center gap-4">
          <Gauge className="text-red-600" size={40} />
          SÜRÜCÜ <span className="text-red-600 text-stroke-white">TELEMETRİSİ</span>
        </h1>

        {/* --- İSTATİSTİK KARTLARI --- */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <div className="bg-[#111] border border-white/5 p-6 rounded-3xl flex flex-col items-center shadow-lg">
              <CheckCircle className="text-green-500 mb-3" size={32} />
              <span className="text-3xl font-black">{summary?.green || 0}</span>
              <span className="text-[10px] text-gray-500 font-black uppercase mt-1 tracking-widest">Zamanında</span>
          </div>

          <div className="bg-[#111] border border-white/5 p-6 rounded-3xl flex flex-col items-center shadow-lg">
              <Activity className="text-yellow-400 mb-3" size={32} />
              <span className="text-3xl font-black">{summary?.yellow || 0}</span>
              <span className="text-[10px] text-gray-500 font-black uppercase mt-1 tracking-widest">Gecikmeli</span>
          </div>

          <div className="bg-[#111] border border-white/5 p-6 rounded-3xl flex flex-col items-center shadow-lg">
              <AlertTriangle className="text-red-600 mb-3" size={32} />
              <span className="text-3xl font-black">{summary?.red || 0}</span>
              <span className="text-[10px] text-gray-500 font-black uppercase mt-1 tracking-widest">Çok Geç</span>
          </div>

          <div className="bg-[#111] border border-blue-500/20 p-6 rounded-3xl flex flex-col items-center shadow-lg">
              <CalendarDays className="text-blue-500 mb-3" size={32} />
              <span className="text-3xl font-black text-blue-500">{summary?.leave || 0}</span>
              <span className="text-[10px] text-blue-400 font-black uppercase mt-1 tracking-widest">İzinli</span>
          </div>

          <div className="bg-[#111] border border-white/5 p-6 rounded-3xl flex flex-col items-center shadow-lg">
              <XOctagon className="text-gray-500 mb-3" size={32} />
              <span className="text-3xl font-black">{summary?.absent || 0}</span>
              <span className="text-[10px] text-gray-500 font-black uppercase mt-1 tracking-widest">Devamsız</span>
          </div>
        </div>

        {/* --- GRAFİK ALANI --- */}
        <div className="bg-[#111] border border-white/5 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
          <h2 className="text-xl font-black mb-10 italic uppercase tracking-tight flex items-center gap-2">
            PERFORMANS <span className="text-red-600">TRENDİ</span>
          </h2>
          
          {graphData.length === 0 ? (
            <div className="text-center py-20 text-gray-700 font-bold italic uppercase tracking-widest">Veri Toplanıyor...</div>
          ) : (
            <div className="h-[400px] w-full" style={{ position: 'relative', minHeight: '400px' }}>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="date" stroke="#444" fontSize={10} fontStyle="italic" dy={10} />
                  <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tickFormatter={formatYAxis} stroke="#444" fontSize={10} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#dc2626" 
                    strokeWidth={4} 
                    dot={<CustomDot />} 
                    activeDot={{r: 8, strokeWidth: 0}}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          
          <div className="mt-8 flex flex-wrap gap-6 justify-center border-t border-white/5 pt-8">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase"><span className="w-2 h-2 rounded-full bg-green-500"></span> Zamanında</div>
             <div className="flex items-center gap-2 text-[10px] font-black uppercase"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Gecikti</div>
             <div className="flex items-center gap-2 text-[10px] font-black uppercase"><span className="w-2 h-2 rounded-full bg-red-600"></span> Çok Geç</div>
             <div className="flex items-center gap-2 text-[10px] font-black uppercase"><span className="w-2 h-2 rounded-full bg-blue-500"></span> İzinli</div>
             <div className="flex items-center gap-2 text-[10px] font-black uppercase"><span className="w-2 h-2 rounded-full bg-gray-600"></span> Devamsız</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPerformance;