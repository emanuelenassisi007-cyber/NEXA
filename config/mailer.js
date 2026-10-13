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
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html:
        html ||
        buildNotificationHtml({
          subject,
          title,
          message,
          actionUrl,
          actionText,
        }),
      text: text || message || title || subject,
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
