import React, { useState } from 'react';
import axios from 'axios';
import { Bug, X, Send, ImagePlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL as API } from '../config';

const FeedbackModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Lütfen bir mesaj girin.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const formData = new FormData();
      formData.append('message', message);
      if (file) {
        formData.append('screenshot', file);
      }

      await axios.post(`${API}/feedback`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Geri bildiriminiz başarıyla iletildi!');
      setMessage('');
      setFile(null);
      setIsOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Geri bildirim gönderilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 z-[60] flex items-center justify-center group"
        title="Hata Bildir / Geri Bildirim Ver"
      >
        <Bug size={24} />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121212] border border-gray-800 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in relative">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-black/40">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <Bug className="text-red-500" /> Hata / Geri Bildirim
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <p className="text-sm text-gray-400">
                Sistemde bulduğunuz bir hatayı, tasarımı ya da eklenmesini istediğiniz bir özelliği doğrudan geliştiricilere iletebilirsiniz. Varsa ekran görüntüsü eklemeniz sorunu çok daha hızlı çözmemizi sağlar.
              </p>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-300">Mesajınız <span className="text-red-500">*</span></label>
                <textarea
                  className="w-full bg-black/50 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all min-h-[120px] resize-y"
                  placeholder="Sorunu veya fikrinizi detaylıca açıklayın..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-300">Ekran Görüntüsü (Opsiyonel)</label>
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? 'border-red-500/50 bg-red-500/5' : 'border-gray-700 bg-black/30 hover:bg-gray-800/50 hover:border-gray-600'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImagePlus className={`w-8 h-8 mb-3 ${file ? 'text-red-500' : 'text-gray-400'}`} />
                    <p className="mb-2 text-sm text-center px-4">
                      {file ? (
                        <span className="font-semibold text-white">{file.name}</span>
                      ) : (
                        <span className="text-gray-400"><span className="font-semibold text-white">Yüklemek için tıklayın</span> veya sürükleyip bırakın</span>
                      )}
                    </p>
                    {!file && <p className="text-xs text-gray-500">PNG, JPG, SVG veya GIF</p>}
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-bold py-3 px-6 rounded-xl transition-all w-full md:w-auto flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={20} /> Gönder
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackModal;
