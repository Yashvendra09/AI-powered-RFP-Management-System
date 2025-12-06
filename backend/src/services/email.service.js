const nodemailer = require("nodemailer");

async function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    // Real SMTP (SendGrid, Mailgun SMTP, company SMTP, etc.)
    return nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Number(port) === 465, // true for 465, false for other ports
      auth: { user, pass }
    });
  }

  // Fallback: Ethereal (for testing) - nodemailer will create a test account
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
}

async function sendRfpEmail({ to, subject, text, html, attachments }) {
  const transporter = await createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || `"RFP System" <no-reply@example.com>`,
    to,
    subject,
    text,
    html,
    attachments
  };

  const info = await transporter.sendMail(mailOptions);

  // If Ethereal was used, nodemailer exposes a preview URL helper:
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  return { info, previewUrl };
}

module.exports = { sendRfpEmail };
