export async function sendMagicCode(email: string, code: string): Promise<void> {
  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  const from = process.env.MAIL_FROM || 'noreply@drk-spendenquittung.de';

  if (!apiKey || !secretKey) {
    throw new Error('MAILJET_API_KEY und MAILJET_SECRET_KEY müssen gesetzt sein');
  }

  const response = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(`${apiKey}:${secretKey}`).toString('base64'),
    },
    body: JSON.stringify({
      Messages: [{
        From: { Email: from, Name: 'DRK Spendenquittung' },
        To: [{ Email: email }],
        Subject: 'Ihr Anmeldecode für DRK Spendenquittung',
        TextPart: `Ihr Code: ${code}\n\nDieser Code ist 10 Minuten gültig.\n\nWenn Sie diesen Code nicht angefordert haben, können Sie diese E-Mail ignorieren.`,
        HTMLPart: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #e30613; color: #fff; padding: 16px 24px; border-radius: 12px 12px 0 0;">
          <strong>DRK Spendenquittung</strong>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px;">Ihr Anmeldecode:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f8f9fa; border-radius: 8px; margin-bottom: 16px;">
            ${code}
          </div>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Dieser Code ist 10 Minuten gültig.</p>
          <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0;">Wenn Sie diesen Code nicht angefordert haben, können Sie diese E-Mail ignorieren.</p>
        </div>
      </div>
    `,
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mailjet API Fehler: ${response.status} ${error}`);
  }
}

export async function sendInvitationEmail(
  email: string,
  inviterName: string,
  kreisverbandName: string,
): Promise<void> {
  const from = process.env.MAIL_FROM || 'noreply@drk-spendenquittung.de';
  const appUrl = process.env.APP_URL || 'https://spendenquittung.drk-aachen.de';
  const loginUrl = `${appUrl}/login`;

  await transporter.sendMail({
    from: `DRK Spendenquittung <${from}>`,
    to: email,
    subject: `Einladung zur DRK Spendenquittung – ${kreisverbandName}`,
    text: `Hallo,\n\n${inviterName} hat Sie zur DRK Spendenquittung für ${kreisverbandName} eingeladen.\n\nSie können sich unter ${loginUrl} mit Ihrer E-Mail-Adresse anmelden.\n\nBei der Anmeldung erhalten Sie einen 6-stelligen Code per E-Mail.\n\nMit freundlichen Grüßen\nDRK Spendenquittung`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #e30613; color: #fff; padding: 16px 24px; border-radius: 12px 12px 0 0;">
          <strong>DRK Spendenquittung</strong>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px;">Hallo,</p>
          <p style="margin: 0 0 16px;"><strong>${inviterName}</strong> hat Sie zur DRK Spendenquittung für <strong>${kreisverbandName}</strong> eingeladen.</p>
          <p style="margin: 0 0 16px;">Sie können sich ab sofort anmelden:</p>
          <div style="text-align: center; margin-bottom: 16px;">
            <a href="${loginUrl}" style="display: inline-block; background: #e30613; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Jetzt anmelden
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Bei der Anmeldung erhalten Sie einen 6-stelligen Code per E-Mail.</p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">Wenn Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.</p>
        </div>
      </div>
    `,
  });
}
