import axios from 'axios';
import { supabase } from '../lib/supabase.js';
import { sendToLeadSquared } from '../lib/leadsquared.js';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Growtel SMS credentials
const GROWTEL_API_KEY = 'SZ5tXohW';
const SENDER_ID = 'JaroEd';
const ENTITY_ID = '1001696454968857192';
const TEMPLATE_ID = '1007125343764448982';

export default async function handler(req, res) {
  // Add proper error handling wrapper
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { phoneNumber } = req.body;
    
    // Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Basic phone number validation
    if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    const otp = generateOtp();
    const timestamp = Date.now();

    // Database operation with better error handling
    const { error } = await supabase.from('otps').upsert({
      phone: phoneNumber,
      otp,
      timestamp,
    });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }

    const message = `Your OTP for accessing the Jaro Connect app is ${otp}. Explore career growth, alumni networking, and lifelong learning—all in one place.– Jaro Education`;

    // SMS sending with better error handling
    try {
      const smsRes = await axios.get('https://api.grow-infinity.io/api/sms', {
        params: {
          key: GROWTEL_API_KEY,
          to: phoneNumber,
          from: SENDER_ID,
          body: message,
          entityid: ENTITY_ID,
          templateid: TEMPLATE_ID,
        },
        timeout: 10000, // 10 second timeout
      });

      // Check if SMS was successful
      if (smsRes.data.status !== 100) {
        console.error('SMS failed:', smsRes.data);
        return res.status(500).json({ 
          success: false, 
          message: 'SMS failed', 
          details: process.env.NODE_ENV === 'development' ? smsRes.data : 'SMS service error'
        });
      }

      // Send to LeadSquared (wrapped in try-catch to not fail the whole request)
      try {
        await sendToLeadSquared(phoneNumber);
      } catch (leadSquaredError) {
        console.error('LeadSquared error (non-critical):', leadSquaredError);
        // Don't fail the request if LeadSquared fails
      }

      return res.json({ success: true, message: 'OTP sent successfully' });

    } catch (smsError) {
      console.error('SMS service error:', smsError);
      
      // Check if it's a network/timeout error
      if (smsError.code === 'ECONNABORTED' || smsError.code === 'ECONNRESET') {
        return res.status(500).json({ 
          success: false, 
          message: 'SMS service timeout', 
          error: 'Network timeout'
        });
      }

      return res.status(500).json({ 
        success: false, 
        message: 'SMS service error', 
        error: process.env.NODE_ENV === 'development' ? smsError.message : 'Internal server error'
      });
    }

  } catch (globalError) {
    console.error('Unexpected error in OTP handler:', globalError);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? globalError.message : 'Something went wrong'
    });
  }
}