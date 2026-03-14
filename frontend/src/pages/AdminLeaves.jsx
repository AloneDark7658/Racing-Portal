import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, User, Calendar as CalendarIcon, FileText, RotateCcw, ListFilter, Download, Search, Building, CheckSquare } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // SEKME YÖNETİMİ: 'pending' (Bekleyenler) veya 'processed' (İşlem Görenler)
  const [activeTab, setActiveTab] = useState('pending');
  
  // FİLTRELEME & TOPLU İŞLEM STATE'LERİ
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDep, setSelectedDep] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedLeaves, setSelectedLeaves] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaves();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(data);
    } catch (err) { console.error('Departmanlar yüklenemedi'); }
  };

  const fetchLeaves = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const { data } = await axios.get(`${API_URL}/leave`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(data);
    } catch (err) {
      setError('İzin talepleri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `${API_URL}/leave/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // İşlem başarılıysa ekrandaki listeyi anında güncelle
      setLeaves(leaves.map(leave => 
        leave._id === id ? { ...leave, status: newStatus } : leave
      ));
    } catch (err) {
      alert('Durum güncellenemedi!');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Onaylandı') return <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-xs font-bold border border-green-500/50">Onaylandı</span>;
    if (status === 'Reddedildi') return <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-500/50">Reddedildi</span>;
    return <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/50 flex items-center gap-1"><Clock size={12}/> Bekliyor</span>;
  };

  // TOPLU İŞLEM FONKSİYONU
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedLeaves.length === 0) return;
    const token = localStorage.getItem('token');
    
    // Basit bir loading bildirimi koyuyoruz
    const loadingToast = toast.loading(`Seçili ${selectedLeaves.length} talep işleniyor...`);
    
    try {
      await Promise.all(selectedLeaves.map(id => 
        axios.put(`${API_URL}/leave/${id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } })
      ));
      
      setLeaves(leaves.map(leave => 
        selectedLeaves.includes(leave._id) ? { ...leave, status: newStatus } : leave
      ));
      setSelectedLeaves([]); // İşlem bitince seçili listeyi temizle
      toast.success(`${selectedLeaves.length} talep başarıyla ${newStatus} olarak işaretlendi!`, { id: loadingToast });
    } catch (err) {
      toast.error('Toplu işlem sırasında hata oluştu.', { id: loadingToast });
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeaves(displayedLeaves.map(l => l._id));
    } else {
      setSelectedLeaves([]);
    }
  };

  const handleSelectLeave = (id) => {
    if (selectedLeaves.includes(id)) {
      setSelectedLeaves(selectedLeaves.filter(lId => lId !== id));
    } else {
      setSelectedLeaves([...selectedLeaves, id]);
    }
  };

  // VERİLERİ SEKME VE FİLTRELERE GÖRE LİSTELİYORUZ
  const displayedLeaves = leaves.filter(leave => {
    // Sekme Filtresi
    if (activeTab === 'pending' && leave.status && leave.status !== 'Bekliyor') return false;
    if (activeTab === 'processed' && leave.status !== 'Onaylandı' && leave.status !== 'Reddedildi') return false;

    // Arama Filtresi (İsim veya No)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = leave.user?.name?.toLowerCase().includes(term);
      const studentIdMatch = leave.user?.studentId?.toLowerCase().includes(term);
      if (!nameMatch && !studentIdMatch) return false;
    }

    // Departman Filtresi
    if (selectedDep) {
      const depId = leave.user?.departmentId?._id || leave.user?.departmentId;
      if (depId !== selectedDep) return false;
    }

    return true;
  });

  const exportToExcel = () => {
    if (displayedLeaves.length === 0) return;

    const excelData = displayedLeaves.map(leave => ({
      'Ad Soyad': leave.user?.name || 'Bilinmeyen Kullanıcı',
      'Öğrenci No': leave.user?.studentId || '-',
      'Talep Edilen Tarih': new Date(leave.requestedDate).toLocaleDateString('tr-TR'),
      'Gerekçe': leave.reason,
      'Durum': leave.status || 'Bekliyor'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    
    // Aktif sekmeye göre sheet adı ve dosya adı belirle
    const sheetName = activeTab === 'pending' ? 'Bekleyen Talepler' : 'İşlem Görenler';
    const fileName = activeTab === 'pending' ? 'Bekleyen_Izinler.xlsx' : 'Gecmis_Izinler.xlsx';

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-4 md:p-8 text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Üst Başlık */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 bg-white/5 hover:bg-red-600/20 hover:text-red-500 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tighter italic">
                YÖNETİCİ <span className="text-red-600">İZİN PANELİ</span>
              </h1>
              <p className="text-sm text-gray-400">Takım üyelerinin izin taleplerini buradan yönetebilirsiniz.</p>
            </div>
          </div>
          <button 
            onClick={exportToExcel}
            className="bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white border border-green-500/50 hover:border-green-500 font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 w-full md:w-auto mt-4 md:mt-0 whitespace-nowrap"
          >
            <Download size={20} />
            Excel'e Aktar
          </button>
        </div>

        {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 border border-red-500/50">{error}</div>}

        {/* FİLTRELEME ALANI */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="İsim veya Öğrenci No ile ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-gray-500"
            />
          </div>
          <div className="relative md:w-64">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={selectedDep}
              onChange={(e) => setSelectedDep(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white appearance-none focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            >
              <option value="">Tüm Departmanlar</option>
              {departments.map(dep => (
                <option key={dep._id} value={dep._id}>{dep.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SEKME BUTONLARI VE TOPLU İŞLEM */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <ListFilter size={20} className="text-gray-500 mr-2 shrink-0" />
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'pending' 
                ? 'bg-red-600 text-white' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            Bekleyen Talepler 
            <span className="ml-2 bg-black/30 px-2 py-0.5 rounded-full text-xs">
              {leaves.filter(l => !l.status || l.status === 'Bekliyor').length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('processed')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'processed' 
                ? 'bg-white/20 text-white border border-white/30' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            Geçmiş İşlemler
            <span className="ml-2 bg-black/30 px-2 py-0.5 rounded-full text-xs">
              {leaves.filter(l => l.status === 'Onaylandı' || l.status === 'Reddedildi').length}
            </span>
          </button>
          </div>
        </div>

        {/* TOPLU İŞLEM ÇUBUĞU (Sadece Bekleyen sekmesinde gösterilir) */}
        {activeTab === 'pending' && displayedLeaves.length > 0 && (
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-gray-600 text-red-600 focus:ring-red-500 bg-black/50" 
                checked={displayedLeaves.length > 0 && selectedLeaves.length === displayedLeaves.length}
                onChange={handleSelectAll}
              />
              <span className="font-bold text-sm">Hepsini Seç ({selectedLeaves.length} seçildi)</span>
            </label>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => handleBulkStatusUpdate('Onaylandı')}
                disabled={selectedLeaves.length === 0}
                className="flex-1 sm:flex-none bg-green-500/20 hover:bg-green-500 text-green-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border border-green-500/30 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
              >
                <CheckSquare size={16} /> Seçilenleri Onayla
              </button>
              <button 
                onClick={() => handleBulkStatusUpdate('Reddedildi')}
                disabled={selectedLeaves.length === 0}
                className="flex-1 sm:flex-none bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
              >
                <X size={16} /> Seçilenleri Reddet
              </button>
            </div>
          </div>
        )}

        {/* İzin Kartları Listesi */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-48 animate-pulse"></div>
            ))}
          </div>
        ) : displayedLeaves.length === 0 ? (
          <div className="text-center bg-white/5 p-10 rounded-2xl border border-white/10 text-gray-400 flex flex-col items-center gap-3">
            <Check size={48} className="text-green-500/50" />
            <p>{activeTab === 'pending' ? 'Harika! Bekleyen hiçbir izin talebi yok.' : 'Henüz işlem görmüş bir izin talebi yok.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedLeaves.map((leave) => (
              <div key={leave._id} className={`bg-white/5 border rounded-2xl p-5 backdrop-blur-sm transition-all flex flex-col justify-between ${selectedLeaves.includes(leave._id) ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10 hover:border-white/20'}`}>
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {/* Seçim Checkbox'u - Sadece bekleme ekranında çıksın */}
                      {activeTab === 'pending' && (
                        <input 
                          type="checkbox"
                          checked={selectedLeaves.includes(leave._id)}
                          onChange={() => handleSelectLeave(leave._id)}
                          className="w-5 h-5 rounded border-gray-600 text-red-600 focus:ring-red-500 bg-black/50 cursor-pointer"
                        />
                      )}
                      
                      <div className="bg-red-600/20 p-2 rounded-lg text-red-500 shrink-0">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold">{leave.user?.name || 'Bilinmeyen Kullanıcı'}</h3>
                        <p className="text-xs text-gray-400 flex flex-col">
                          <span>No: {leave.user?.studentId || '-'}</span>
                          {leave.user?.departmentId?.name && <span className="text-blue-400 mt-0.5">{leave.user.departmentId.name}</span>}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(leave.status || 'Bekliyor')}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2 text-sm">
                      <CalendarIcon size={16} className="text-gray-500 mt-0.5" />
                      <div>
                        <span className="text-gray-500 block text-xs">Talep Edilen Tarih</span>
                        <span>{new Date(leave.requestedDate).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 text-sm bg-black/20 p-3 rounded-lg border border-white/5">
                      <FileText size={16} className="text-gray-500 mt-0.5 shrink-0" />
                      <p className="text-gray-300 italic">"{leave.reason}"</p>
                    </div>
                  </div>
                </div>

                {/* AKSİYON BUTONLARI: Bulunulan sekmeye göre değişir */}
                {activeTab === 'pending' ? (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                    <button 
                      onClick={() => handleStatusUpdate(leave._id, 'Onaylandı')}
                      className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 hover:border-green-500 py-2 rounded-lg flex items-center justify-center gap-1 text-sm font-bold transition-all"
                    >
                      <Check size={16} /> Onayla
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(leave._id, 'Reddedildi')}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 hover:border-red-500 py-2 rounded-lg flex items-center justify-center gap-1 text-sm font-bold transition-all"
                    >
                      <X size={16} /> Reddet
                    </button>
                  </div>
                ) : (
                  // Geçmiş İşlemler Sekmesindeki Kalıcı Geri Al Butonu
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button 
                      onClick={() => handleStatusUpdate(leave._id, 'Bekliyor')}
                      className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 hover:border-white/30 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all"
                    >
                      <RotateCcw size={16} /> Kararı Geri Al (Beklemeye Taşı)
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeaves;