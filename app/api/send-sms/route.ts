import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phoneNumber, categoryName, spent, remaining } = await request.json();
    
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + 
      process.env.TWILIO_ACCOUNT_SID + '/Messages.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64'),
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: process.env.TWILIO_PHONE_NUMBER!,
        Body: `Budget Update: You spent $${spent.toFixed(2)} on ${categoryName}. $${remaining.toFixed(2)} remaining in this category.`,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send SMS');
    }

    return NextResponse.json({ success: true, sid: data.sid });
  } catch (error) {
    console.error('SMS error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
