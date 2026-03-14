import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // useLocation eklendi
import { LogIn, User, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation(); // YENİ: Nereden geldiğimizi anlamak için

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // YENİ: Akıllı Yönlendirme Mantığı
      // Eğer bir sayfadan (örneğin QR sayfası) buraya şutlandıysak oraya geri dön, 
      // yoksa normal Dashboard'a git.
      const origin = location.state?.from?.pathname || '/dashboard';
      navigate(origin);

    } catch (err) {
      setError(err.response?.data?.message || 'Giriş yapılamadı. Bilgileri kontrol edin.');
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
          <p className="text-gray-400 text-sm mt-2">Üye Takip Sistemi Girişi</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="email"
              placeholder="E-posta"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Şifre"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex justify-end mt-[-10px] mb-2">
            <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-red-500 transition-colors">
              Şifremi unuttum
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
            Giriş Yap
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Hesabın yok mu? <Link to="/register" className="text-red-500 hover:underline">Kaydol</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;