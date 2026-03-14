import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Activity, TrendingUp, ArrowLeft } from 'lucide-react';

const AttendanceHub = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="pb-20 md:pb-0">
      <nav className="bg-[#1a1a1a] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                <ArrowLeft size={20} />
                <span className="font-bold">Dashboard'a Dön</span>
              </Link>
            </div>
            <h1 className="text-xl font-bold text-white">Yoklama İşlemleri</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 md:gap-6">
          <Link to="/direct-scan" className="bg-white/5 border border-green-500/30 hover:border-green-500 hover:bg-green-500/10 transition-all p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
            <div className="bg-green-500/20 p-4 rounded-full text-green-500 group-hover:scale-110 transition-transform">
              <QrCode size={32} />
            </div>
            <h3 className="text-sm md:text-lg font-bold text-white text-center">Yoklama Okut</h3>
            <p className="hidden md:block text-sm text-gray-400 text-center">Kameranızı açarak piste giriş/çıkış yapın.</p>
          </Link>

          <Link to="/my-performance" className="bg-white/5 border border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10 transition-all p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
            <div className="bg-blue-500/20 p-4 rounded-full text-blue-500 group-hover:scale-110 transition-transform">
              <Activity size={32} />
            </div>
            <h3 className="text-sm md:text-lg font-bold text-white text-center">Sürücü Telemetrisi</h3>
            <p className="hidden md:block text-sm text-gray-400 text-center">Performans grafiğini ve devamlılığını incele.</p>
          </Link>

          {(user.role === 'admin' || user.role === 'superadmin') && (
            <>
              <Link to="/admin/qr-generate" className="bg-white/5 border border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10 transition-all p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
                <div className="bg-blue-500/20 p-4 rounded-full text-blue-500 group-hover:scale-110 transition-transform">
                  <QrCode size={32} />
                </div>
                <h3 className="text-sm md:text-lg font-bold text-white text-center">Yoklama Başlat</h3>
                <p className="hidden md:block text-sm text-gray-400 text-center">Günün antrenmanı için QR kod panosunu aç.</p>
              </Link>

              <Link to="/admin/attendance-log" className="bg-white/5 border border-green-500/30 hover:border-green-500 hover:bg-green-500/10 transition-all p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
                <div className="bg-green-500/20 p-4 rounded-full text-green-500 group-hover:scale-110 transition-transform">
                  <TrendingUp size={32} />
                </div>
                <h3 className="text-sm md:text-lg font-bold text-white text-center">Raporlar & Analiz</h3>
                <p className="hidden md:block text-sm text-gray-400 text-center">Takımın devamlılık grafiğini incele.</p>
              </Link>
            </>
          )}
        </div>
        
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-500">
          🚧 <strong>Bilgi:</strong> Yoklama okutabilmek için admininizin açtığı qr kodu, "Yoklama Okut" sekmesinden kameranızı açıp qr kodu okutmanız gerekmektedir.
        </div>
      </main>
    </div>
  );
};

export default AttendanceHub;
