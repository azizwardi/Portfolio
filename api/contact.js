const sgMail = require('@sendgrid/mail');

// Do not hardcode keys here. Set SENDGRID_API_KEY, FROM_EMAIL, TO_EMAIL in Vercel env.
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body && Object.keys(req.body).length ? req.body : await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => data += chunk);
      req.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
      });
      req.on('error', reject);
    });

    const { name, email, message, _gotcha } = body;

    // Simple honeypot spam check
    if (_gotcha) {
      return res.status(400).json({ error: 'Spam detected' });
    }

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!process.env.SENDGRID_API_KEY || !process.env.FROM_EMAIL || !process.env.TO_EMAIL) {
      console.error('Missing environment variables for SendGrid');
      return res.status(500).json({ error: 'Mailer not configured' });
    }

    const msg = {
      to: process.env.TO_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: `Portfolio contact from ${name}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><hr/><p>${escapeHtml(message).replace(/\n/g,'<br/>')}</p>`
    };

    await sgMail.send(msg);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error in contact handler', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};

function escapeHtml(unsafe) {
  return (''+unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
