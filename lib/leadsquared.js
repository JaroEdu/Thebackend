import axios from 'axios';

export async function sendToLeadSquared(phoneNumber) {
  try {
    const response = await axios.post(
      'https://api-in21.leadsquared.com/v2/LeadManagement.svc/Lead.Capture',
      [
        { "Attribute": "OwnerId", "Value": "921b8dc0-d032-11eb-9e36-0a2bd9889d72" },
        { "Attribute": "FirstName", "Value": " " },
        { "Attribute": "LastName", "Value": " " },
        { "Attribute": "EmailAddress", "Value": " " },
        { "Attribute": "Phone", "Value": phoneNumber },
        { "Attribute": "Message", "Value": " " },
        { "Attribute": "mx_Website_Lead_Capture", "Value": "No" },
        { "Attribute": "Source", "Value": "Brand" },
        { "Attribute": "mx_Secondary_Lead_Source", "Value": "Brand" },
        { "Attribute": "mx_Website_Campaign", "Value": "JIOTV" },
        { "Attribute": "mx_SubSource", "Value": "" },
        { "Attribute": "SearchBy", "Value": "Phone" },
        { "Attribute": "utm_source", "Value": "" },
        { "Attribute": "utm_medium", "Value": "" },
        { "Attribute": "utm_term", "Value": "" }
      ],
      {
        headers: { 'Content-Type': 'application/json' },
        params: {
          accessKey: process.env.LSQ_ACCESS_KEY,
          secretKey: process.env.LSQ_SECRET_KEY
        }
      }
    );
    console.log('✅ Lead sent to LeadSquared:', response.data);
  } catch (error) {
    console.error('❌ Error sending lead to LeadSquared:', error.message);
  }
}
