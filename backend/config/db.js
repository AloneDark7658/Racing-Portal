const mongoose = require('mongoose');

const connectDB = async () => {
  const MAX_RETRIES = 5;
  let retries = 0;

  const connect = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`✅ MongoDB Bağlantısı Başarılı: ${conn.connection.host}`);
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB Bağlantı Hatası (Deneme ${retries}/${MAX_RETRIES}): ${error.message}`);
      
      if (retries < MAX_RETRIES) {
        const delay = Math.min(retries * 2000, 10000); // Max 10 saniye
        console.log(`🔄 ${delay / 1000} saniye sonra yeniden bağlanılacak...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return connect(); // Tekrar dene
      } else {
        console.error('❌ MongoDB bağlantısı tüm deneme haklarını kullandı. Sunucu DB olmadan çalışmaya devam edecek.');
      }
    }
  };

  await connect();

  // Bağlantı kopması durumunda otomatik uyarı
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB bağlantısı koptu! Mongoose otomatik yeniden bağlanmayı deneyecek.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB yeniden bağlandı.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB bağlantı hatası:', err.message);
  });
};

module.exports = connectDB;