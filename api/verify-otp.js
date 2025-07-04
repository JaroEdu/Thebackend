import { supabase } from '../lib/supabase.js';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and OTP are required' 
      });
    }

    // Get OTP from database
    const { data, error } = await supabase
      .from('otps')
      .select('*')
      .eq('phone', phoneNumber)
      .single();

    if (error || !data) {
      console.error('OTP not found:', error);
      return res.status(400).json({ 
        success: false, 
        message: 'OTP not found or expired' 
      });
    }

    // Check if OTP is expired
    if (Date.now() - data.timestamp > OTP_EXPIRY_MS) {
      // Delete expired OTP
      await supabase.from('otps').delete().eq('phone', phoneNumber);
      return res.status(400).json({ 
        success: false, 
        message: 'OTP expired' 
      });
    }

    // Verify OTP
    if (data.otp === otp) {
      // Delete OTP after successful verification
      await supabase.from('otps').delete().eq('phone', phoneNumber);
      return res.json({ 
        success: true, 
        message: 'OTP verified successfully' 
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: err.message 
    });
  }
}