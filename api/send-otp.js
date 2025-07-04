import axios from 'axios';
import { supabase } from '../lib/supabase.js';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const GROWTEL_API_KEY = 'SZ5tXohW';
const SENDER_ID = 'JaroEd';
const ENTITY_ID = '1001696454968857192';
const TEMPLATE_ID = '1007125343764448982';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ success: false, message: 'Phone number required' });

  const otp = generateOtp();
  const timestamp = Date.now();

  const { error } = await supabase.from('otps').upsert({ phone: phoneNumber, otp, timestamp });
  if (error) return res.status(500).json({ success: false, message: 'Database error', error });

  const message = `Your OTP for accessing the Jaro Connect app is ${otp}. Explore career growth, alumni networking, and lifelong learning—all in one place.– Jaro Education`;

  try {
    const response = await axios.get('https://api.grow-infinity.io/api/sms', {
      params: {
        key: GROWTEL_API_KEY,
        to: phoneNumber,
        from: SENDER_ID,
        body: message,
        entityid: ENTITY_ID,
        templateid: TEMPLATE_ID
      }
    });

    if (response.data.status === 100) {
      res.json({ success: true, message: 'OTP sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'SMS failed', details: response.data });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Growtel error', error: err.message });
  }
}