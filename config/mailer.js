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
  html,
  text,
}) => {
  console.log("MAIL_FROM letto:", JSON.stringify(process.env.MAIL_FROM));

  // Estrae l'email pulita da MAIL_FROM (gestisce sia "Nome <email@dominio.it>" che "email@dominio.it")
  let senderEmail = process.env.MAIL_FROM || "noreply@tuodominio.it";
  let senderName = "Nexa";

  if (senderEmail.includes("<")) {
    const match = senderEmail.match(/^(.*?)\s*<(.+?)>$/);
    if (match) {
      senderName = match[1].trim();
      senderEmail = match[2].trim();
    }
  }

  // Prepara i destinatari per il formato richiesto da Brevo (array di oggetti { email, name })
  const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({
    email,
  }));

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.RESEND_API_KEY, // Manteniamo la variabile esistente su Railway dove hai incollato la chiave di Brevo
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: recipients,
      subject: subject,
      htmlContent:
        html ||
        buildNotificationHtml({
          subject,
          title,
          message,
          actionUrl,
          actionText,
        }),
      textContent: text || message || title || subject,
    }),
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Invio email fallito (${res.status}): ${data.message || JSON.stringify(data)}`,
    );
  }
  return data;
};

module.exports = sendEmail;
