import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'

// 1. ADIM: Global Axios Interceptor (401 Hatalarını Yakalamak İçin)
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('Oturum süreniz doldu, lütfen tekrar giriş yapın.');
      
      // Toast'un görünmesi için kısa bir süre bekleyip login'e yönlendir
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/* 1. ADIM: Tüm uygulamayı kapsayacak Toast sağlayıcısı */}
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      }}
    />
  </StrictMode>,
)
