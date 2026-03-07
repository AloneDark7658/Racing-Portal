const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); 

// .env dosyasındaki ortam değişkenlerini okumamızı sağlar
dotenv.config();

// Veri tabanına bağlanma fonksiyonunu çalıştırıyoruz
connectDB(); 

// Express uygulamamızı başlatıyoruz
const app = express();

app.use(cors()); 
app.use(express.json()); 

// --- YENİ EKLENEN API ROTALARI ---
// Frontend'den gelen '/api/auth' ile başlayan tüm istekleri authRoutes dosyasına yönlendirir
app.use('/api/auth', require('./routes/authRoutes'));

// --- ROTALAR (API Uç Noktaları) ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leave', require('./routes/leaveRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes')); // YENİ EKLENEN SATIR

// --- Test Rotası ---
app.get('/', (req, res) => {
  res.send('İTÜ Racing Backend API Başarıyla Çalışıyor! 🏎️');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda başarıyla çalışıyor...`);
});

