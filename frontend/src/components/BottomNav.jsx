import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, QrCode, CalendarPlus, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const path = location.pathname;

  // Sadece yetki gerektiren ana sayfalarda göster, giriş/kayıt bölümlerinde sakla
  const hideOnPages = ['/login', '/register', '/forgot-password'];
  if (hideOnPages.includes(path) || path.startsWith('/reset-password')) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 z-50 overflow-visible" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex justify-around items-center h-16 px-2 relative">
        <Link 
          to="/dashboard" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${path === '/dashboard' ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Home size={22} className={path === '/dashboard' ? 'fill-red-500/20' : ''} />
          <span className="text-[10px] font-bold tracking-wider">Ana Sayfa</span>
        </Link>
        
        {/* Ortada vurgulu QR butonu */}
        <Link 
          to="/direct-scan" 
          className={`flex flex-col items-center justify-center w-full h-full relative group transition-colors ${path === '/direct-scan' ? 'text-green-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <div className={`absolute -top-6 p-3 rounded-full border-[3px] border-[#0a0a0a] shadow-lg transition-transform active:scale-95 ${path === '/direct-scan' ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-300'}`}>
             <QrCode size={24} />
          </div>
          <span className="text-[10px] font-bold tracking-wider mt-7">QR Okut</span>
        </Link>
        
        <Link 
          to="/leave-request" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${path === '/leave-request' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <CalendarPlus size={22} className={path === '/leave-request' ? 'fill-blue-500/20' : ''} />
          <span className="text-[10px] font-bold tracking-wider">İzinler</span>
        </Link>
        
        <Link 
          to="/profile" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${path === '/profile' ? 'text-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <User size={22} className={path === '/profile' ? 'fill-purple-500/20' : ''} />
          <span className="text-[10px] font-bold tracking-wider">Profil</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;
