import { TwilioVerificationRequest } from '../types';

export async function twilioApiRequest(
  path: string,
  data: TwilioVerificationRequest
): Promise<Response> {
  return fetch(`/api/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

interface TwilioResponse {
  success: boolean
  error?: string
  sid?: string
}

interface SMSNotificationData {
  phoneNumber: string
  categoryName: string
  spent: number
  remaining: number
}

export async function sendSMSNotification(data: SMSNotificationData): Promise<TwilioResponse> {
  try {
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    return await response.json()
  } catch (error) {
    console.error('Error sending SMS:', error)
    return {
      success: false,
      error: 'Failed to send SMS notification'
    }
  }
}
