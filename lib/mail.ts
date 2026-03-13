import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILJET_API_KEY,
    pass: process.env.MAILJET_SECRET_KEY,
  },
});

export async function sendMagicCode(email: string, code: string): Promise<void> {
  const from = process.env.MAIL_FROM || 'noreply@drk-spendenquittung.de';

  await transporter.sendMail({
    from: `DRK Spendenquittung <${from}>`,
    to: email,
    subject: 'Ihr Anmeldecode für DRK Spendenquittung',
    text: `Ihr Code: ${code}\n\nDieser Code ist 10 Minuten gültig.\n\nWenn Sie diesen Code nicht angefordert haben, können Sie diese E-Mail ignorieren.`,
    html: `
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
  });
}
