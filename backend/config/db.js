const mongoose = require('mongoose');

// Asenkron bir fonksiyon oluşturuyoruz çünkü veri tabanına bağlanmak zaman alabilir
const connectDB = async () => {
  try {
    // .env dosyasındaki MONGO_URI linkini kullanarak bağlanmayı deniyoruz
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Bağlantısı Başarılı: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Bağlantı Hatası: ${error.message}`);
    // Eğer bağlantı başarısız olursa projeyi durduruyoruz
    process.exit(1); 
  }
};

module.exports = connectDB;