import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';

import { API_URL as API } from '../config';

const DirectScan = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const scannerRef = useRef(null);

  const getOrCreateDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // ÇİFT KAMERA KESİN ÇÖZÜMÜ: React'in sayfayı yüklemesini 100 milisaniye bekliyoruz
    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted) return;

      // Ekran boyutuna göre dinamik tarama alanı
      const qrboxFunction = function(viewfinderWidth, viewfinderHeight) {
          let minEdgePercentage = 0.7; // Ekranın %70'ini kaplasın
          let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          // 300px'den büyük, 150px'den küçük olmasın
          qrboxSize = Math.max(150, Math.min(qrboxSize, 300));
          return {
              width: qrboxSize,
              height: qrboxSize
          };
      };

      // Kamerayı başlat
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        {
          qrbox: qrboxFunction,
          fps: 20, // Daha hızlı tarama (saniyede 20 kare)
          rememberLastUsedCamera: true
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          // Okutma başarılı olduğunda kamerayı KESİN kapat
          if (scannerRef.current) {
            scannerRef.current.clear().catch(e => console.log(e));
            scannerRef.current = null;
          }
          processQRCode(decodedText);
        },
        (err) => {
          // anlık hataları yut
        }
      );
    }, 100);

    // SAYFADAN ÇIKIŞ YAPILDIĞINDA (Geri tuşu veya sayfa değişimi)
    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          // Promise tabanlı olduğu için .then/.catch ile güvenli kapat
          scannerRef.current.clear()
            .then(() => console.log("Kamera güvenle kapatıldı."))
            .catch(e => console.log("Kamera kapatılırken ihmal edilebilir hata:", e));
        } catch (error) {
           console.log("Tarayıcı uzantısı veya senkron kapatma hatası yakalandı:", error);
        }
        scannerRef.current = null;
      }
    };
  }, [navigate]);


  const processQRCode = async (scannedToken) => {
    console.log("Okunan Token:", scannedToken); // Bunu ekle
    setLoading(true);
    setError(null);
    setScanResult(null);

    const userToken = localStorage.getItem('token');
    const deviceId = getOrCreateDeviceId();

    try {
      const response = await axios.post(
        `${API}/attendance/scan`,
        { qrToken: scannedToken, deviceId: deviceId },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      setScanResult({
        message: response.data.message,
        type: response.data.type
      });

    } catch (err) {
      setError(err.response?.data?.message || 'Karekod okutulurken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  // AKILLI GERİ DÖNÜŞ BUTONU: Önce kamerayı kapatır, sonra sayfayı değiştirir!
  const handleBack = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (e) {
        console.log("Kamera kapatılamadı.", e);
      }
    }
    navigate('/attendance-hub');
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">

        {/* NORMAL LİNK YERİNE AKILLI BUTON KULLANDIK */}
        <button onClick={handleBack} className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>

        <div className="text-center mb-8 mt-4">
          <h1 className="text-2xl font-black italic tracking-tighter">YOKLAMA <span className="text-red-600">SİSTEMİ</span></h1>
          <p className="text-sm text-gray-400 mt-1">Lütfen kameranızı ekrandaki karekoda hizalayın.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
            <p className="text-gray-400 font-semibold animate-pulse">Karekod doğrulanıyor...</p>
          </div>
        ) : scanResult ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="text-green-500 mb-4" size={64} />
            <h2 className="text-xl font-bold text-white mb-2">İşlem Başarılı!</h2>
            <p className="text-green-400 font-semibold mb-6">{scanResult.message}</p>
            <button onClick={handleBack} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all">
              Ana Sayfaya Dön
            </button>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <XCircle className="text-red-500 mb-4" size={64} />
            <h2 className="text-xl font-bold text-white mb-2">Başarısız!</h2>
            <p className="text-red-400 text-sm mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all">
              Tekrar Dene
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl">
            {/* Kamera Buraya Gelecek */}
            <div id="reader" className="w-full min-h-[250px]"></div>
          </div>
        )}

        <div className="mt-8 flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
          <ShieldAlert className="text-blue-500 flex-shrink-0" size={20} />
          <p className="text-xs text-blue-400 leading-relaxed">
            <strong>Bilgi:</strong> Sistem, hesabınızı kullandığınız cihaza kilitler. Şu an test aşamasında olduğunuz için galeriden fotoğraf yükleme özelliği aktiftir.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DirectScan;