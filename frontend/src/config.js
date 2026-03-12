// frontend/src/config.js

// 1. Tarayıcının adres çubuğuna bakıyoruz: Bilgisayarda mıyız, Vercel'de miyiz?
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 2. KENDİ RENDER BACKEND ADRESİNİ BURAYA YAZ (Sonunda /api olsun)
// DİKKAT: Buradaki "SENIN-ADRESIN" kısmını, backend'i deploy ettiğinde sana verilen gerçek URL ile değiştirmelisin!
// Örnek: 'https://racing-backend-1234.onrender.com/api'
const renderURL = 'https://racing-portal-w3bc.onrender.com/api'; 

// 3. Eğer bilgisayardaysan localhost çalışır, Vercel'deysen Render linki çalışır.
export const API_URL = isLocalhost ? 'http://localhost:5000/api' : renderURL;