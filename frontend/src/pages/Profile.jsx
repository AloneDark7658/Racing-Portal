import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, CreditCard, Lock, Loader2, ArrowLeft, Save, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
// 1. ADIM: API_URL'i config dosyasından içe aktarıyoruz
import { API_URL } from '../config'; 

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [fullScreenError, setFullScreenError] = useState(''); // Fetch profile errors
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, token]);

  const fetchProfile = async () => {
    try {
      // 2. ADIM: Dinamik API_URL kullanımı
      const { data } = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(data);
      setFormData({
        email: data.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setFullScreenError(err.response?.data?.message || 'Profil yüklenemedi.');
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('Yeni şifreler eşleşmiyor!');
        setSaveLoading(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.error('Yeni şifre en az 6 karakter olmalıdır.');
        setSaveLoading(false);
        return;
      }
    }

    try {
      const payload = { email: formData.email };
      if (formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      // 3. ADIM: Dinamik API_URL kullanımı
      const { data } = await axios.put(`${API_URL}/users/me`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(data.message || 'Profil başarıyla güncellendi!');
      if (data.user) {
        setProfile(data.user);
        localStorage.setItem('user', JSON.stringify({ id: data.user._id, name: data.user.name, role: data.user.role }));
      }
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Güncelleme başarısız.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Yüklenme durumu
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={48} />
      </div>
    );
  }

  // 4. ADIM: BEMBEYAZ EKRAN ÇÖZÜMÜ
  // Eğer profil null ise sayfayı boş (null) döndürmek yerine hata mesajı gösteriyoruz.
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-4">
        <AlertCircle size={64} className="text-red-500 mb-4 opacity-80" />
        <h2 className="text-2xl font-bold mb-2">Eyvah, Bir Sorun Oluştu!</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          {fullScreenError || 'Profil bilgilerinizi çekerken bir sorun yaşadık. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.'}
        </p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all"
        >
          <ArrowLeft size={20} />
          Panoya Dön
        </button>
      </div>
    );
  }

  // Başarılı yükleme durumunda gösterilecek profil arayüzü
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link to="/dashboard" className="p-2 bg-white/5 hover:bg-red-600/20 hover:text-red-500 rounded-lg transition-all border border-white/10">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase">
              Profil Ayarları
            </h1>
            <p className="text-gray-400 text-sm mt-1">Bilgilerinizi görüntüleyin ve güncelleyin</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ad Soyad</label>
              <div className="relative flex items-center gap-2 rounded-xl py-3 px-4 bg-white/5 border border-white/10 text-gray-300">
                <User size={18} className="text-gray-500" />
                <span>{profile.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Öğrenci No</label>
              <div className="relative flex items-center gap-2 rounded-xl py-3 px-4 bg-white/5 border border-white/10 text-gray-300">
                <CreditCard size={18} className="text-gray-500" />
                <span>{profile.studentId || '—'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-red-600 transition-all"
                  placeholder="E-posta"
                  required
                />
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                <Lock size={16} /> Şifre Değiştir (İsteğe bağlı)
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600 transition-all"
                    placeholder="Mevcut şifreniz"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-3 text-gray-500 hover:text-white transition-colors"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600 transition-all"
                    placeholder="Yeni şifre"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-3 text-gray-500 hover:text-white transition-colors"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-red-600 transition-all"
                    placeholder="Yeni şifre tekrar"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-3 text-gray-500 hover:text-white transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Şifre değiştirmek istemiyorsanız bu alanları boş bırakın.</p>
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saveLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Kaydet
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;