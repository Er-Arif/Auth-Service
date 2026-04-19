const PURPOSE_COPY = {
  login: {
    title: 'Confirm your login',
    intro: 'Use the one-time password below to complete your sign-in request.',
    subjectLabel: 'Login',
  },
  signup: {
    title: 'Confirm your sign up',
    intro: 'Use the one-time password below to finish creating your account.',
    subjectLabel: 'Sign Up',
  },
  verify_identity: {
    title: 'Verify your contact',
    intro: 'Use the one-time password below to verify this contact method on your account.',
    subjectLabel: 'Contact Verification',
  },
  reset: {
    title: 'Approve your reset request',
    intro: 'Use the one-time password below to continue resetting your access securely.',
    subjectLabel: 'Reset',
  },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildOtpEmail({ otp, purpose, expiryMinutes }) {
  const copy = PURPOSE_COPY[purpose] || {
    title: 'Use your one-time password',
    intro: 'Use the code below to continue your request securely.',
    subjectLabel: 'Verification',
  };

  const subject = `${copy.subjectLabel} OTP - Auth Service`;
  const text = [
    copy.title,
    '',
    copy.intro,
    '',
    `OTP: ${otp}`,
    `Expires in: ${expiryMinutes} minutes`,
    '',
    'If you did not request this code, you can safely ignore this email.',
  ].join('\n');

  const html = `
    <div style="margin:0;padding:24px;background-color:#f4f7fb;font-family:Segoe UI,Tahoma,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #dbe4f0;">
        <tr>
          <td style="padding:32px 32px 16px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#ffffff;">
            <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.8;font-weight:700;">Auth Service</div>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">${escapeHtml(copy.title)}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 20px;">
            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#334155;">
              ${escapeHtml(copy.intro)}
            </p>
            <div style="margin:24px 0;padding:18px 20px;border-radius:16px;background:#eff6ff;border:1px solid #bfdbfe;text-align:center;">
              <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#1d4ed8;font-weight:700;margin-bottom:8px;">One-Time Password</div>
              <div style="font-size:34px;line-height:1;letter-spacing:0.25em;font-weight:800;color:#0f172a;">${escapeHtml(otp)}</div>
            </div>
            <div style="padding:16px 18px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;">
              <p style="margin:0 0 8px;font-size:14px;color:#0f172a;">
                <strong>Expires in:</strong> ${escapeHtml(expiryMinutes)} minutes
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">
                If you did not request this code, you can safely ignore this email. Do not share this OTP with anyone.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px;">
            <p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;">
              This message was sent automatically by your authentication service.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `.trim();

  return {
    subject,
    text,
    html,
  };
}

module.exports = {
  buildOtpEmail,
};
