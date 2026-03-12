// frontend/src/config.js
// VITE_API_URL varsa (canlı sunucu) onu kullan, yoksa (bilgisayarında) localhost'u kullan.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';