import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Smartphone, Trash2, Search, UserCheck, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000/api';

const AdminManageDevices = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Kullanıcılar getirilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (id, name) => {
    if (window.confirm(`${name} kullanıcısının cihaz kilidini kaldırmak istediğinize emin misiniz?`)) {
      try {
        await axios.put(`${API}/users/${id}/reset-device`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Cihaz başarıyla sıfırlandı.");
        fetchUsers();
      } catch (err) {
        alert("Sıfırlama hatası!");
      }
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/admin/qr-generate" className="text-gray-400 hover:text-white flex items-center gap-2">
            <ArrowLeft size={20} /> QR Paneline Dön
          </Link>
          <h1 className="text-2xl font-bold italic">CİHAZ <span className="text-red-600">YÖNETİMİ</span></h1>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-3 text-gray-500" size={20} />
          <input 
            type="text" placeholder="Üye adı ile ara..." 
            className="w-full bg-white/5 border border-white/10 p-3 pl-12 rounded-xl focus:outline-none focus:border-red-600"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {filteredUsers.map(user => (
            <div key={user._id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${user.deviceId ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                  {user.deviceId ? <ShieldAlert size={24} /> : <UserCheck size={24} />}
                </div>
                <div>
                  <h3 className="font-bold">{user.name}</h3>
                  <p className="text-xs text-gray-400">{user.deviceId ? "Cihaz Kilitli" : "Cihaz Atanmamış"}</p>
                </div>
              </div>
              
              {user.deviceId && (
                <button 
                  onClick={() => handleReset(user._id, user.name)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 px-4 rounded-lg flex items-center gap-2 text-sm font-bold transition-all"
                >
                  <Trash2 size={16} /> Kilidi Kaldır
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminManageDevices;