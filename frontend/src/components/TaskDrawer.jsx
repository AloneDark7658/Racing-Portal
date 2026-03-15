import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, Circle, Calendar, User, Clock, Plus, Filter, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { API_URL as API } from '../config';

const TaskDrawer = ({ isOpen, onClose }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, my, completed
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
      setTasks(res.data);
    } catch (err) {
      console.error('Görevler çekilemedi', err);
    } finally {
      setLoading(false);
    }
  };

  // Drawer açıldığında görevleri çek
  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen]);

  // Durum güncelleme (Tamamlandı olarak işaretle)
  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'Bitti' ? 'Yapılacak' : 'Bitti';
    try {
      await axios.put(`${API}/tasks/${task._id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(newStatus === 'Bitti' ? 'Görev tamamlandı!' : 'Görev geri alındı!');
      // Lokal state'i optimist olarak güncelle
      setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    } catch (err) {
      toast.error('Görevin durumu güncellenemedi.');
    }
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Yüksek': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'Düşük': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Filtreleme Mantığı
  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.status === 'Bitti';
    if (filter === 'my') {
      // Benim görevlerim: Bana veya departmanıma atananlar
      if (task.assignmentType === 'takim') return true;
      if (task.assignmentType === 'kisi' && task.assignedUsers?.some(u => u._id === currentUser._id)) return true;
      if (task.assignmentType === 'ekip' && task.assignedDepartments?.some(d => d._id === currentUser.departmentId)) return true;
      // Admin ise ve başkalarına atadıysa 'my' filtresinde görünmemeli, ama admin kendisi oluşturduysa?
      // "My Tasks" genel üyeler için. Admin için "Bana Atananlar" demektir.
      return false;
    }
    // 'all'
    if (filter === 'all') return task.status !== 'Bitti'; // aktif olanlar
    return true;
  });

  // Animasyon için classlar
  const drawerClasses = `fixed top-0 right-0 h-full w-full md:w-[400px] bg-[#111111] border-l border-white/10 shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`;
  const backdropClasses = `fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`;

  return (
    <>
      {/* Backdrop */}
      <div className={backdropClasses} onClick={onClose} />

      {/* Drawer */}
      <div className={drawerClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#161616]">
          <h2 className="text-xl font-bold italic tracking-tight text-white animate-fade-in">Aktif Görevler</h2>
          <div className="flex items-center gap-3">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg text-xs py-1.5 px-2 text-gray-300 outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="all">Tümü (Aktif)</option>
              <option value="my">Bana Atananlar</option>
              <option value="completed">Tamamlananlar</option>
            </select>
            <button onClick={onClose} className="p-1.5 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors text-gray-400">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-3">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-sm font-semibold">Görevler yükleniyor...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-3 bg-white/5 rounded-2xl border border-white/5 p-6 text-center">
              <CheckCircle size={32} className="opacity-50" />
              <p className="text-sm">Bu filtreye uygun görev bulunamadı.<br/><span className="text-xs opacity-70">Harika iş çıkarıyorsun! 🎉</span></p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const overdue = task.status !== 'Bitti' && isOverdue(task.deadline);
              const isCompleted = task.status === 'Bitti';

              // Atama Avatarı (Takım vs Kişi)
              let assignText = "Takım";
              if (task.assignmentType === 'kisi' && task.assignedUsers?.length > 0) {
                assignText = task.assignedUsers[0].name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              } else if (task.assignmentType === 'ekip' && task.assignedDepartments?.length > 0) {
                assignText = task.assignedDepartments[0].name.substring(0, 2).toUpperCase();
              }

              return (
                <div key={task._id} className={`bg-[#1a1a1a] border rounded-xl p-4 transition-all group flex gap-3 ${isCompleted ? 'border-green-500/20 opacity-70' : overdue ? 'border-red-500/40' : 'border-white/10 hover:border-white/20'}`}>
                  {/* Checkbox Trigger */}
                  <button 
                    onClick={() => toggleTaskStatus(task)}
                    className="mt-1 flex-shrink-0 text-gray-400 hover:text-green-500 transition-colors"
                  >
                    {isCompleted ? <CheckCircle className="text-green-500" size={20} /> : <Circle size={20} />}
                  </button>

                  {/* Task Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className={`font-semibold text-sm truncate ${isCompleted ? 'line-through text-gray-400' : 'text-white'}`}>
                        {task.title}
                      </h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className={`text-xs line-clamp-2 mb-2 ${isCompleted ? 'text-gray-500' : 'text-gray-400'}`}>
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 mt-2">
                       {/* Assignee Avatar */}
                      <div className="flex items-center gap-1.5 bg-black/40 px-1.5 py-0.5 rounded-md border border-white/5" title={task.assignmentType}>
                        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-[8px] font-bold text-white">
                          {assignText}
                        </div>
                      </div>

                      {/* Deadline */}
                      {task.deadline && (
                        <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border ${overdue ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-gray-400 border-white/5'}`}>
                          <Calendar size={10} /> {new Date(task.deadline).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#161616] border-t border-white/10">
          <button 
            onClick={() => {
              onClose();
              navigate('/tasks');
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-red-600/20"
          >
            <Plus size={18} /> Yeni Görev Ekle / Panoya Git
          </button>
        </div>
      </div>
    </>
  );
};

export default TaskDrawer;
