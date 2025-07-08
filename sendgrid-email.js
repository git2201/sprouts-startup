const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendConnectionEmail(targetEmail, targetName, requesterName, partnerEmail) {
  const msg = {
    to: targetEmail,
    from: 'noreply@yourdomain.com', // Use your verified sender
    subject: 'Your cofounder match is complete!',
    html: `
      <h2>Hi ${targetName},</h2>
      <p>Congratulations! You and ${requesterName} have both committed and paid to connect.</p>
      <p>Your partner's email: <strong>${partnerEmail}</strong></p>
      <p>We wish you a successful partnership!<br>The Sprout Team</p>
    `
  };
  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendConnectionEmail }; 