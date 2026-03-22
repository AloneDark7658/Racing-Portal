import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Loader2, RefreshCcw, Users, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

import { API_URL as API } from '../config';

const AdminQR = () => {
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Yeni eklenen state'ler
  const [departments, setDepartments] = useState([]);
  const [exemptDepartments, setExemptDepartments] = useState([]);
  const [extraDepartments, setExtraDepartments] = useState([]);

  const [showExemptions, setShowExemptions] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  // Günlük indeks hesabı (0=Pazartesi, 6=Pazar)
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  // Bugün normalde mesaisi OLAN departmanlar:
  const activeDepartmentsToday = departments.filter(dept =>
    dept.workSchedule && dept.workSchedule.daysOfWeek && dept.workSchedule.daysOfWeek.includes(todayIndex)
  );

  // Bugün normalde mesaisi OLMAYAN departmanlar:
  const inactiveDepartmentsToday = departments.filter(dept =>
    dept.workSchedule && dept.workSchedule.daysOfWeek && !dept.workSchedule.daysOfWeek.includes(todayIndex)
  );

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Departman listesini çek
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${API}/departments/flat`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDepartments(res.data);
      } catch (err) {
        console.error('Departmanlar yüklenemedi:', err);
      }
    };
    if (token) fetchDepartments();
  }, [token]);

  // KAREKODU GETİREN FONKSİYON
  const fetchQR = async () => {
    try {
      // DÜZELTME: GET yerine POST yapıyoruz ve /generate kullanıyoruz
      const response = await axios.post(`${API}/attendance/generate`, {
        exemptDepartments, // İptal edilen departmanların ID listesini gönderiyoruz
        extraDepartments   // Fazladan çağrılanların ID listesi
      }, {
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
  }, [token, navigate, qrToken, exemptDepartments, extraDepartments]);

  // Karekodun tam linki (Öğrenci okuttuğunda bu linke veya sadece şifreye gidebilir, 
  // biz sadece QR token'ın kendisini koda gömeceğiz çünkü DirectScan direkt onu okuyor)
  const qrValue = qrToken;

  const handleResetMyDevice = () => {
    localStorage.removeItem('deviceId');
    toast.success('Bu telefon/bilgisayar artık yeni bir cihaz olarak tanınacak.', {
      icon: '📱'
    });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col p-4 md:p-8">

      {/* --- HEADER NAVİGASYON --- */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 mb-8 mt-2 md:mt-0">
        <Link to="/attendance-hub" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 w-full justify-center md:w-auto md:justify-start">
          <ArrowLeft size={24} /> <span className="font-bold">Panoya Dön</span>
        </Link>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
          <button
            onClick={handleResetMyDevice}
            className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/30 text-gray-300 px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-sm"
            title="Bu tarayıcının cihaz kimliğini siler"
          >
            <Smartphone size={18} /> Cihazımı Sıfırla
          </button>
          <Link to="/admin/manage-devices" className="bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-red-600 px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-sm">
            <Users size={18} /> Cihazları Yönet
          </Link>
        </div>
      </div>

      {/* --- ANA KART --- */}
      <div className="w-full max-w-2xl m-auto bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center relative overflow-hidden">

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
              includeMargin={true}
              className="rounded-xl"
            />
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left w-full max-w-md relative z-10 bg-black/40 p-4 rounded-2xl border border-white/5 mb-8">
          <ShieldCheck className="text-green-500 flex-shrink-0" size={32} />
          <div>
            <h3 className="font-bold text-white mb-1">Dinamik Güvenlik Aktif</h3>
            <p className="text-xs text-gray-400">
              Bu karekod tek kullanımlıktır. Bir üye okuttuğu an anında yenilenir. Lütfen kendi cihazınızı kullanınız.
            </p>
          </div>
        </div>

        {/* --- GÜNCELLENEN BÖLÜM: MUAF DEPARTMANLAR (GELİŞMİŞ) --- */}
        <div className="w-full max-w-md relative z-10 border border-red-900/40 bg-red-950/20 rounded-2xl overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => setShowExemptions(!showExemptions)}
            className="w-full p-4 flex items-center justify-between hover:bg-red-900/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span className="font-bold text-red-400 text-sm md:text-base">Günlük Mesai İptal İşlemleri (Gelişmiş)</span>
            </div>
            <span className={`text-red-400 font-bold transform transition-transform duration-300 ${showExemptions ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          <div className={`transition-all duration-300 ease-in-out ${showExemptions ? 'max-h-[600px] opacity-100 p-4 pt-0 border-t border-red-900/40' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <p className="text-xs text-red-300/80 mb-4 mt-3">
              Yalnızca bugün mesaisi olan departmanlar listelenmektedir. Kartın üzerine tıklayarak ilgili departman için bugünü komple tatil ilan edebilirsiniz. (Okunan karekodlar anında iptal olur, bekleyen yoklamalar düşer).
            </p>
            {activeDepartmentsToday.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {activeDepartmentsToday.map(dept => {
                  const isExempt = exemptDepartments.includes(dept._id);
                  return (
                    <div
                      key={dept._id}
                      onClick={() => {
                        if (isExempt) {
                          const confirmRevert = window.confirm("Mesai iptalini geri alıp tekrar zorunlu yapmak istiyor musunuz?");
                          if (confirmRevert) {
                            setExemptDepartments(prev => prev.filter(id => id !== dept._id));
                          }
                        } else {
                          const confirmExempt = window.confirm("Bu departmanın bugünkü mesaisini iptal etmek istediğinize emin misiniz?");
                          if (confirmExempt) {
                            setExemptDepartments(prev => [...prev, dept._id]);
                          }
                        }
                      }}
                      className={`cursor-pointer rounded-xl p-3 border transition-all duration-200 flex flex-col items-center text-center gap-2 select-none active:scale-[0.98] cursor-pointer ${isExempt
                          ? 'bg-red-600/30 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                          : 'bg-black/40 border-gray-600/50 hover:bg-gray-800/60 hover:border-gray-500'
                        }`}
                    >
                      <span className={`font-bold block w-full truncate ${isExempt ? 'text-white' : 'text-gray-300'}`}>
                        {dept.name}
                      </span>
                      <div className={`text-[10px] md:text-xs tracking-wider font-bold px-3 py-1 rounded-full uppercase ${isExempt ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                        {isExempt ? 'İPTAL EDİLDİ' : 'Aktif Mesai'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-black/30 border border-gray-700 p-4 rounded-xl text-center">
                <p className="text-sm text-gray-400 font-medium">Bugün için planlı bir mesaiye sahip departman bulunamadı.</p>
              </div>
            )}
          </div>
        </div>

        {/* --- YENİ BÖLÜM: EKSTRA MESAİYE ÇAĞRILAN DEPARTMANLAR --- */}
        <div className="w-full max-w-md relative z-10 border border-green-900/40 bg-green-950/20 rounded-2xl overflow-hidden transition-all duration-300 mt-4">
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className="w-full p-4 flex items-center justify-between hover:bg-green-900/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">➕</span>
              <span className="font-bold text-green-400 text-sm md:text-base">Ekstra Mesaiye Çağrılan Departmanlar (Off-day)</span>
            </div>
            <span className={`text-green-400 font-bold transform transition-transform duration-300 ${showExtras ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          <div className={`transition-all duration-300 ease-in-out ${showExtras ? 'max-h-[600px] opacity-100 p-4 pt-0 border-t border-green-900/40' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <p className="text-xs text-green-300/80 mb-4 mt-3">
              Yalnızca bugün NORMALDE mesaisi OLMAYAN departmanlar listelenmektedir. Kartın üzerine tıklayarak ilgili departmanı bugünkü yoklamaya ZORUNLU olarak ekleyebilirsiniz.
            </p>
            {inactiveDepartmentsToday.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {inactiveDepartmentsToday.map(dept => {
                  const isExtra = extraDepartments.includes(dept._id);
                  return (
                    <div
                      key={dept._id}
                      onClick={() => {
                        if (isExtra) {
                          const confirmRevert = window.confirm("Bu departmanı ekstra mesaiden çıkarmak istediğinize emin misiniz?");
                          if (confirmRevert) {
                            setExtraDepartments(prev => prev.filter(id => id !== dept._id));
                          }
                        } else {
                          const confirmExtra = window.confirm("Bu departmanı bugün ekstra mesaiye çağırmak (zorunlu kılmak) istediğinize emin misiniz?");
                          if (confirmExtra) {
                            setExtraDepartments(prev => [...prev, dept._id]);
                          }
                        }
                      }}
                      className={`cursor-pointer rounded-xl p-3 border transition-all duration-200 flex flex-col items-center text-center gap-2 select-none active:scale-[0.98] ${isExtra
                          ? 'bg-green-600/30 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                          : 'bg-black/40 border-gray-600/50 hover:bg-gray-800/60 hover:border-gray-500'
                        }`}
                    >
                      <span className={`font-bold block w-full truncate ${isExtra ? 'text-white' : 'text-gray-300'}`}>
                        {dept.name}
                      </span>
                      <div className={`text-[10px] md:text-xs tracking-wider font-bold px-3 py-1 rounded-full uppercase ${isExtra ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                        {isExtra ? 'MESAİYE ÇAĞRILDI' : 'Off-day'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-black/30 border border-gray-700 p-4 rounded-xl text-center">
                <p className="text-sm text-gray-400 font-medium">Bugün izinde olan hiçbir departman bulunmamaktadır (veya tüm departmanlar listede).</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminQR;