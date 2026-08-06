const fs = require('fs');
const path = require('path');

const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM;

let client = null;
if (TWILIO_SID && TWILIO_TOKEN) {
  try {
    const Twilio = require('twilio');
    client = new Twilio(TWILIO_SID, TWILIO_TOKEN);
  } catch (err) {
    client = null;
  }
}

async function sendSMS(to, body) {
  if (!to) return;
  if (client && TWILIO_FROM) {
    try {
      const msg = await client.messages.create({ body, from: TWILIO_FROM, to });
      return msg;
    } catch (err) {
      console.error('Twilio send error:', err.message || err);
      return null;
    }
  }

  // Fallback: write a notification to a local file for development
  try {
    const notificationsDir = path.join(__dirname, 'notifications');
    if (!fs.existsSync(notificationsDir)) fs.mkdirSync(notificationsDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(notificationsDir, `${timestamp}-${to.replace(/\D/g,'')}.txt`);
    fs.writeFileSync(filename, body, 'utf8');
    console.log(`Notification written to ${filename}`);
  } catch (err) {
    console.error('Notification fallback failed:', err.message || err);
  }
  return null;
}

module.exports = { sendSMS };
