// frontend/src/config.js

// 1. Tarayıcının adres çubuğuna bakıyoruz: Bilgisayarda mıyız, Vercel'de miyiz?
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 2. KENDİ RENDER BACKEND ADRESİNİ BURAYA YAZ (Sonunda /api olsun)
const renderURL = 'https://racing-backend-SENIN-ADRESIN.onrender.com/api';

// 3. Eğer bilgisayardaysan localhost çalışır, Vercel'deysen Render linki çalışır. (Vercel paneliyle işimiz bitti)
export const API_URL = isLocalhost ? 'http://localhost:5000/api' : renderURL;