import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { ArrowLeft, QrCode, CheckCircle, Users, Clock, Loader2 } from 'lucide-react';

const AdminQR = () => {
  const [qrData, setQrData] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [isExisting, setIsExisting] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/attendance/active-session', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data) {
          setQrData(data.qrData);
          setStartTime(data.startTime);
          setIsExisting(true);
        }
      } catch (err) {}
    };
    if(token) fetchSession();
  }, [token]);

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/attendance/today', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAttendees(Array.isArray(data) ? data : []);
      } catch (err) {
        setAttendees([]);
      } finally {
        setLoadingList(false);
      }
    };

    if(token) {
      fetchAttendees(); 
      const interval = setInterval(fetchAttendees, 5000); 
      return () => clearInterval(interval); 
    }
  }, [token]);

  const handleGenerate = async () => {
    try {
      const { data } = await axios.post('http://localhost:5000/api/attendance/generate', 
        { startTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQrData(data.qrData);
      setIsExisting(true);
    } catch (err) {
      alert("QR oluşturulamadı!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-sm">
          <ArrowLeft size={18} /> Dashboard'a Dön
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SOL TARAF: QR KOD (PERFORMANS AYARI: Blur kaldırıldı, gölge sadeleşti) */}
          <div className="lg:col-span-5 bg-[#141414] p-8 rounded-3xl border border-white/10 shadow-xl h-fit">
            <h1 className="text-xl font-black italic mb-6 text-center uppercase tracking-tighter">
              YOKLAMA <span className="text-red-600">MASASI</span>
            </h1>

            {isExisting ? (
              <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-xl mb-6 flex items-center justify-center gap-2 text-green-500 text-xs font-bold">
                <CheckCircle size={14} /> OTURUM AKTİF
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                <input 
                  type="time" 
                  className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-2xl font-mono text-center outline-none focus:border-red-600 transition-colors"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <button 
                  onClick={handleGenerate}
                  className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  BAŞLAT
                </button>
              </div>
            )}

            {qrData && (
              <div className="flex flex-col items-center">
                {/* Ağır gölge (blur-50px) yerine ince glow (blur-sm) kullanıyoruz */}
                <div className="bg-white p-4 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <QRCodeCanvas value={`${window.location.origin}/direct-scan/${qrData}`} size={220} level="M" />
                </div>
                <p className="mt-4 text-2xl font-black">{startTime}</p>
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Pist Açılış Saati</p>
              </div>
            )}
          </div>

          {/* SAĞ TARAF: LİSTE (PERFORMANS AYARI: Transition-all kaldırıldı) */}
          <div className="lg:col-span-7 bg-[#141414] border border-white/10 rounded-3xl p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <Users className="text-red-500" size={20} /> Canlı Paddock
            </h2>

            {loadingList ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-red-600" /></div>
            ) : attendees.length === 0 ? (
              <div className="text-center py-12 text-gray-600 text-sm italic">Bekleniyor...</div>
            ) : (
              <div className="space-y-2">
                {attendees.map((att) => (
                  <div key={att._id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/5 cursor-default">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        att.colorCode === 'green' ? 'bg-green-500' : 
                        att.colorCode === 'yellow' ? 'bg-yellow-400' : 'bg-red-600'
                      }`}></div>
                      <span className="font-bold text-sm">{att.userId?.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                      {new Date(att.scanTime).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminQR;