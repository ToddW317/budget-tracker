import { TwilioVerificationRequest } from '@/types';

export async function twilioApiRequest(
  path: string,
  method: 'GET' | 'POST',
  data?: any
) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio credentials');
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
      body: data ? new URLSearchParams(data).toString() : undefined,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Twilio API Error:', responseData);
      throw new Error(responseData.message || responseData.error?.message || 'Failed to make Twilio API request');
    }

    return responseData;
  } catch (error) {
    console.error('Request error:', error);
    throw error;
  }
}
