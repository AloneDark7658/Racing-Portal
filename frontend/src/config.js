// frontend/src/config.js

// 1. Tarayıcının adres çubuğuna bakıyoruz: Bilgisayarda mıyız, Vercel'de miyiz?
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 2. Canlı ortam URL'i environment variable'dan alınır (.env.production veya Vercel env)
//    Vite'da .env dosyasına VITE_API_URL=https://racing-portal-w3bc.onrender.com/api yazılmalıdır
const productionURL = import.meta.env.VITE_API_URL || 'https://racing-portal-w3bc.onrender.com/api';

// 3. Eğer bilgisayardaysan localhost çalışır, Vercel'deysen env variable çalışır.
export const API_URL = isLocalhost ? 'http://localhost:5000/api' : productionURL;