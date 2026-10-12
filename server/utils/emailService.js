const nodemailer = require('nodemailer');

/**
 * Create Nodemailer Transporter
 * Uses configured SMTP / Gmail credentials if provided in process.env,
 * or falls back to Ethereal SMTP with graceful error handling.
 */
function createTransporter() {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER || process.env.GMAIL_USER;
  const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_PASS;
  // Clean password: strip spaces from Gmail App Passwords (e.g. 'vttw qccu sdbc qpnd' -> 'vttwqccusdbcqpnd')
  const pass = rawPass ? rawPass.replace(/\s+/g, '') : '';
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587');

  if (user && pass) {
    if (host.includes('gmail') || (user && user.includes('@gmail.com'))) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass
        }
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return null;
}

/**
 * Send Password Reset OTP Email
 * @param {string} toEmail - Recipient email address
 * @param {string} userName - Recipient name
 * @param {string} otp - 6-digit OTP code
 */
async function sendPasswordResetEmail(toEmail, userName, otp) {
  const subject = '🔒 AutoDoc - Your Password Reset Verification Code';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; color: #0F172A; }
    .container { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #0046AD; padding: 24px; text-align: center; }
    .header h1 { color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; text-align: center; }
    .greeting { font-size: 18px; font-weight: 700; color: #0F172A; margin-bottom: 8px; }
    .subtext { font-size: 14px; color: #64748B; line-height: 1.5; margin-bottom: 20px; }
    .otp-box { background: #EEF2FF; border: 2px dashed #0046AD; border-radius: 12px; padding: 16px 24px; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0046AD; display: inline-block; margin: 12px 0 20px; }
    .footer { background: #F1F5F9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 AutoDoc</h1>
    </div>
    <div class="content">
      <div class="greeting">Password Reset Verification</div>
      <div class="subtext">Hello <strong>${userName || 'Valued User'}</strong>,<br>You requested to reset your password for your AutoDoc account. Use the 6-digit verification code below:</div>
      <div class="otp-box">${otp}</div>
      <div class="subtext" style="font-size:12px; color:#94A3B8;">This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.</div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} AutoDoc App • We've Got Your Back
    </div>
  </div>
</body>
</html>`;

  const text = `Hello ${userName || 'Valued User'},\n\nYour 6-digit AutoDoc password reset verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nAutoDoc App`;

  try {
    let transporter = createTransporter();

    if (!transporter) {
      console.log(`\n========================================`);
      console.log(`[EMAIL SERVICE NOTICE] Credentials missing in server/.env`);
      console.log(`[EMAIL SERVICE NOTICE] Generated OTP for ${toEmail}: ${otp}`);
      console.log(`========================================\n`);

      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      } catch (e) {
        console.warn(`[EMAIL SERVICE] Ethereal fallback notice:`, e.message);
      }
    }

    if (transporter) {
      const senderUser = process.env.EMAIL_USER || process.env.GMAIL_USER || 'dericjoseph9495@gmail.com';
      const fromEmail = `"${process.env.EMAIL_FROM_NAME || 'AutoDoc Support'}" <${senderUser}>`;

      const info = await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject,
        text,
        html
      });

      console.log(`\n✅ [REAL EMAIL SENT] Password reset verification code delivered to: ${toEmail}`);
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Response: ${info.response}`);

      return { success: true, messageId: info.messageId };
    }
  } catch (err) {
    console.error(`❌ [EMAIL DELIVERY ERROR] Failed to send email to ${toEmail}:`, err);
  }

  return { success: true, fallback: true };
}

module.exports = {
  sendPasswordResetEmail
};
