const { Resend } = require('resend');

const sendEmail = async (options) => {
  try {
    // Resend'i API anahtarımızla başlatıyoruz
    const resend = new Resend(process.env.RESEND_API_KEY);

    // E-postayı gönderiyoruz
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL, // .env dosyasındaki gönderici adresimiz
      to: options.email.split(','), // Adminlerin e-postalarını bir dizi (array) haline getiriyoruz
      subject: options.subject,
      text: options.message
    });

    console.log("✅ E-posta başarıyla gönderildi! ID:", data.id);
  } catch (error) {
    console.error("❌ Resend e-posta gönderme hatası:", error.message);
  }
};

module.exports = sendEmail;