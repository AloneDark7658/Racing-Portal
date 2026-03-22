import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Loader2, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

const VerifyEmail = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Sadece rakam

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Otomatik olarak sonraki input'a geç
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace ile geri git
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    pasted.split('').forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });
    setCode(newCode);
    // Yapıştırma sonrası son dolu input'a odaklan
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      toast.error('Lütfen 6 haneli doğrulama kodunu eksiksiz girin.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/auth/verify-email`, { email, code: fullCode });
      toast.success(data.message || 'E-posta doğrulandı!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Doğrulama başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { data } = await axios.post(`${API_URL}/auth/resend-verification`, { email });
      toast.success(data.message || 'Yeni kod gönderildi!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kod gönderilemedi.');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-600/20 rounded-full">
              <ShieldCheck className="text-red-500" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">E-posta Doğrulama</h1>
          <p className="text-gray-400 text-sm mt-2">
            <span className="text-white font-medium">{email}</span> adresine gönderilen 6 haneli kodu girin
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
            Doğrula
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
          >
            <RotateCw size={14} className={resending ? 'animate-spin' : ''} />
            {resending ? 'Gönderiliyor...' : 'Kodu tekrar gönder'}
          </button>
          <p className="text-gray-500 text-sm">
            <Link to="/login" className="text-red-500 hover:underline">Giriş sayfasına dön</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
