const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');

// 1. .env dosyasındaki ortam değişkenlerini EN BAŞTA okumak en güvenlisidir
dotenv.config();

const connectDB = require('./config/db'); 
const mongoose = require('mongoose'); // Temizlik için eklendi
const AttendanceSession = require('./models/AttendanceSession'); // Temizlik için eklendi

// 2. Veri tabanına bağlanma fonksiyonunu çalıştırıyoruz
connectDB(); 

// 3. Express uygulamamızı başlatıyoruz
const app = express();

// backend/server.js
// Hem yerel React portuna (5173) hem de canlıya alındığındaki adrese izin ver
app.use(cors({
  origin: [
    'http://localhost:5173', 
    process.env.FRONTEND_URL // Deploy edildiğinde bu değişken devreye girecek
  ],
  credentials: true
}));
app.use(express.json()); 
app.use(helmet());

// --- ROTALAR (API Uç Noktaları) ---
// (Fazladan yazılmış olan kopya '/api/auth' rotası silindi)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leave', require('./routes/leaveRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));

// --- Test Rotası ---
app.get('/', (req, res) => {
  res.send('İTÜ Racing Backend API Başarıyla Çalışıyor! 🏎️');
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error('🔥 Global Hata:', err.stack);
  
  res.status(err.status || 500).json({
    message: err.message || 'Sunucuda beklenmeyen bir hata oluştu.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda başarıyla çalışıyor...`);
});