const { Resend } = require('resend');

const sendEmail = async (options) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // E-posta listesini array olduğundan emin ol ve varsa boşluk vb temizle
    let emailList = Array.isArray(options.email) ? options.email : [options.email];
    emailList = emailList.filter(Boolean); // Boş olanları uçur

    // 50'şerli gruplara bölen chunk mekanizması (Resend limiti tek seferde 50'dir)
    const chunkSize = 50;
    for (let i = 0; i < emailList.length; i += chunkSize) {
      const chunk = emailList.slice(i, i + chunkSize);
      
      const payload = {
        from: process.env.RESEND_FROM_EMAIL, // .env'deki "İTÜ Racing <sistem@mehmetguldeneme.shop>"
        to: process.env.RESEND_FROM_EMAIL, // Kendi adresimize TO atıp, diğerlerini BCC atıyoruz (Gizlilik için)
        bcc: chunk,
        subject: options.subject,
        text: options.message
      };

      if (options.attachments && options.attachments.length > 0) {
        payload.attachments = options.attachments;
      }

      const data = await resend.emails.send(payload);
      console.log(`✅ ${chunk.length} kişilik e-posta paketi başarıyla gönderildi! Paketin ID'si:`, data?.id);
    }
  } catch (error) {
    console.error("❌ Resend hatası:", error.message);
  }
};

module.exports = sendEmail;