import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const DirectScan = () => {
  const { qrToken } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const scan = async () => {
      const token = localStorage.getItem('token');

      // 1. KİMLİK KONTROLÜ: Login değilse Login'e şutla ama geri döneceği yolu fısılda!
      if (!token) {
        navigate('/login', { state: { from: location } });
        return;
      }

      try {
        const { data } = await axios.post('http://localhost:5000/api/attendance/scan', 
          { qrToken },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 3000);
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.response?.data?.message || "Hata oluştu.");
      }
    };

    scan();
  }, [qrToken]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
      <div className="bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-xl max-w-sm w-full">
        {status === 'processing' && <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />}
        {status === 'success' && <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />}
        {status === 'error' && <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />}
        
        <h2 className="text-xl font-bold uppercase tracking-tighter italic">
          {status === 'processing' ? 'Giriş İşleniyor...' : status === 'success' ? 'Piste Hoş Geldin!' : 'Hata!'}
        </h2>
        <p className="text-gray-400 mt-2">{status === 'error' ? errorMsg : 'Lütfen bekleyin...'}</p>
      </div>
    </div>
  );
};

export default DirectScan;