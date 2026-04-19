const nodemailer = require('nodemailer');
const { env } = require('../../../config/env');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_SMTP_HOST,
      port: env.EMAIL_SMTP_PORT,
      secure: env.EMAIL_SMTP_SECURE,
      auth: env.EMAIL_SMTP_USER
        ? {
            user: env.EMAIL_SMTP_USER,
            pass: env.EMAIL_SMTP_PASS,
          }
        : undefined,
    });
  }

  return transporter;
}

const smtpProvider = {
  async sendOtp(payload) {
    await getTransporter().sendMail({
      from: env.EMAIL_FROM,
      to: payload.targetValue,
      subject: payload.subject,
      text: payload.message,
      html: `<p>${payload.message}</p>`,
    });

    return {
      channel: 'email',
      provider: 'smtp',
      accepted: true,
    };
  },
};

module.exports = smtpProvider;
