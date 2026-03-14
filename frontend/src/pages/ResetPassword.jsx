import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // URL'den gelen token'ı yakalıyoruz
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Şifreler birbiriyle eşleşmiyor!');
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.put(`${API_URL}/auth/resetpassword/${token}`, { password });
      setMessage(data.message);
      
      // Başarılı olursa 3 saniye sonra Login'e yönlendir
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Şifre sıfırlanamadı. Linkin süresi dolmuş olabilir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tighter italic">
            İTÜ <span className="text-red-600">RACING</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Yeni Şifre Belirle</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {message ? (
          <div className="text-center space-y-4">
            <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-lg flex flex-col items-center gap-2">
              <CheckCircle size={32} />
              <p>{message}</p>
            </div>
            <p className="text-gray-400 text-sm animate-pulse">Giriş ekranına yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Yeni Şifre"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Yeni Şifreyi Onayla"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="6"
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Lock size={20} />}
              Şifreyi Güncelle
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;