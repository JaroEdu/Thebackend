import { supabase } from '../lib/supabase.js';

const OTP_EXPIRY_MS = 5 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { phoneNumber, otp } = req.body;

  const { data, error } = await supabase.from('otps').select('*').eq('phone', phoneNumber).single();
  if (!data || error) return res.status(400).json({ success: false, message: 'OTP not found or expired' });

  if (Date.now() - data.timestamp > OTP_EXPIRY_MS) {
    await supabase.from('otps').delete().eq('phone', phoneNumber);
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }

  if (data.otp === otp) {
    await supabase.from('otps').delete().eq('phone', phoneNumber);
    return res.json({ success: true, message: 'OTP verified successfully' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
}