import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, CreditCard, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifre ve şifre tekrarı eşleşmiyor!');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/auth/register`, formData);
      toast.success('Kayıt başarılı! Giriş yapabilirsiniz.');
      // Kayıt başarılıysa direkt Login sayfasına gönder
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Arka plan süslemesi */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tighter italic">
            İTÜ <span className="text-red-600">RACING</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Yeni Üye Kayıt Formu</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Ad Soyad"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="email"
              placeholder="E-posta"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="relative">
            <CreditCard className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Öğrenci No"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Şifre"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
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

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Şifre Tekrar"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
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
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
            Kaydı Tamamla
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Zaten hesabın var mı? <Link to="/login" className="text-red-500 hover:underline">Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;