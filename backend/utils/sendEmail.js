const { Resend } = require('resend');

const sendEmail = async (options) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const payload = {
      from: process.env.RESEND_FROM_EMAIL, // .env'deki "İTÜ Racing <sistem@mehmetguldeneme.shop>"
      to: options.email, // Adminlerin mail listesi
      subject: options.subject,
      text: options.message
    };

    if (options.attachments && options.attachments.length > 0) {
      payload.attachments = options.attachments;
    }

    const data = await resend.emails.send(payload);

    console.log("✅ E-posta başarıyla gönderildi! ID:", data.id);
  } catch (error) {
    console.error("❌ Resend hatası:", error.message);
  }
};

module.exports = sendEmail;