import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Loader2, RefreshCcw, Users } from 'lucide-react';

const API = 'http://localhost:5000/api';

const AdminQR = () => {
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // KAREKODU GETİREN FONKSİYON
  // KAREKODU GETİREN FONKSİYON
  const fetchQR = async () => {
    try {
      // DÜZELTME: GET yerine POST yapıyoruz ve /generate kullanıyoruz
      const response = await axios.post(`${API}/attendance/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // DÜZELTME: Senin backend'in veriyi 'qrData' olarak gönderiyor
      if (response.data.qrData !== qrToken) {
        setQrToken(response.data.qrData);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Karekod alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Sayfa açıldığında ilk karekodu çek
    fetchQR();

    // SİHİR BURADA: Her 2 saniyede bir karekod değişmiş mi diye kontrol et
    const interval = setInterval(() => {
      fetchQR();
    }, 2000); // 2000 milisaniye = 2 saniye

    return () => clearInterval(interval); // Sayfadan çıkıldığında döngüyü durdur
  }, [token, navigate, qrToken]);

  // Karekodun tam linki (Öğrenci okuttuğunda bu linke veya sadece şifreye gidebilir, 
  // biz sadece QR token'ın kendisini koda gömeceğiz çünkü DirectScan direkt onu okuyor)
  const qrValue = qrToken; 

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-4">
      
      <Link to="/dashboard" className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2">
        <ArrowLeft size={24} /> <span className="font-bold">Panoya Dön</span>
      </Link>
      <Link to="/admin/manage-devices" className="absolute top-6 right-6 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-red-600 px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-sm">
        <Users size={18} /> Cihazları Yönet
      </Link>      
      <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center relative overflow-hidden">
        
        {/* Dekoratif Arka Plan Işığı */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-red-600/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-2">
            İTÜ <span className="text-red-600">RACING</span>
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-gray-300">GÜNLÜK YOKLAMA SİSTEMİ</h2>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.2)] mb-8 relative z-10 transition-all duration-300 transform hover:scale-105">
          {loading && !qrToken ? (
            <div className="w-[250px] h-[250px] flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
              <p className="text-black font-bold text-sm">Oluşturuluyor...</p>
            </div>
          ) : error ? (
            <div className="w-[250px] h-[250px] flex flex-col items-center justify-center text-center">
              <p className="text-red-600 font-bold mb-4">{error}</p>
              <button onClick={fetchQR} className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold">
                <RefreshCcw size={16} /> Yenile
              </button>
            </div>
          ) : (
            <QRCodeSVG 
            value={qrValue} 
            size={280}
            level={"L"}
            includeMargin={true} // Bunu geri ekle! 👈
            className="rounded-xl"
            />
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left w-full max-w-md relative z-10 bg-black/40 p-4 rounded-2xl border border-white/5">
          <ShieldCheck className="text-green-500 flex-shrink-0" size={32} />
          <div>
            <h3 className="font-bold text-white mb-1">Dinamik Güvenlik Aktif</h3>
            <p className="text-xs text-gray-400">
              Bu karekod tek kullanımlıktır. Bir üye okuttuğu an anında yenilenir. Lütfen kendi cihazınızı kullanınız.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminQR;