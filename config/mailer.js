const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const buildNotificationHtml = ({
  subject,
  title,
  message,
  actionUrl,
  actionText,
}) => `
  <!DOCTYPE html>
  <html lang="it">
  <head>
    <meta charset="UTF-8">
    <style>
      /* ... i tuoi stili invariati ... */
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-header"><h1>Nexa Notification</h1></div>
      <div class="email-body">
        <p style="margin-top: 0; font-size: 1rem; color: #0f172a;">Ciao,</p>
        <p style="color: #475569; font-size: 0.95rem; line-height: 1.5;">Hai ricevuto una nuova notifica sul tuo gestionale:</p>
        <div class="notification-card">
          <p><strong>${title || subject}</strong></p>
          <p style="margin-top: 6px; color: #64748b; font-size: 0.9rem;">${message || ""}</p>
        </div>
        ${
          actionUrl
            ? `<div style="text-align: center; margin-top: 24px;">
                 <a href="${actionUrl}" class="btn-primary">${actionText || "Visualizza nel gestionale"}</a>
               </div>`
            : ""
        }
      </div>
      <div class="email-footer">
        <p style="margin: 0;">Puoi gestire le preferenze delle notifiche direttamente dalle impostazioni del tuo account.</p>
      </div>
    </div>
  </body>
  </html>
`;

const sendEmail = async ({
  to,
  subject,
  title,
  message,
  actionUrl,
  actionText,
  html, // <-- nuovo
  text, // <-- nuovo
}) => {
  const mailOptions = {
    from: `"Nexa" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    // Se passi un html custom lo usa, altrimenti usa il template di notifica
    html:
      html ||
      buildNotificationHtml({ subject, title, message, actionUrl, actionText }),
    // Fallback testuale: custom se presente, altrimenti il messaggio
    text: text || message || title || subject,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
