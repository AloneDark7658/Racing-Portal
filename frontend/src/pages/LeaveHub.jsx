import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, ClipboardList, ArrowLeft } from 'lucide-react';

const LeaveHub = () => {
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
            <h1 className="text-xl font-bold text-white">İzin İşlemleri</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 md:gap-6">
          <Link to="/leave-request" className="bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
            <div className="bg-red-600/20 p-4 rounded-full text-red-500 group-hover:scale-110 transition-transform">
              <CalendarPlus size={32} />
            </div>
            <h3 className="text-sm md:text-lg font-bold text-white text-center">İzin Talebi Oluştur</h3>
            <p className="hidden md:block text-sm text-gray-400 text-center">Antrenmanlara katılamayacaksan bildir.</p>
          </Link>

          {(user.role === 'admin' || user.role === 'superadmin') && (
            <Link to="/admin/leaves" className="bg-white/5 border border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10 transition-all p-4 md:p-6 rounded-xl flex flex-col items-center justify-center gap-3 group cursor-pointer">
              <div className="bg-yellow-500/20 p-4 rounded-full text-yellow-500 group-hover:scale-110 transition-transform">
                <ClipboardList size={32} />
              </div>
              <h3 className="text-sm md:text-lg font-bold text-white text-center">İzinleri Yönet</h3>
              <p className="hidden md:block text-sm text-gray-400 text-center">İzin taleplerini onayla veya reddet.</p>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
};

export default LeaveHub;
