export interface SendEmailPayload {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
}

export async function sendEmailViaBrevo(payload: SendEmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'hello@velvetcrumbdemo.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'Velvet Crumb Bakery';

  if (!apiKey || apiKey === 'mockBrevoApiKey' || apiKey === 'your_brevo_api_key_here') {
    console.warn('[Brevo Sender] Test/Mock mode: BREVO_API_KEY is not configured. Email logged to console:');
    console.log(`To: ${payload.to}\nSubject: ${payload.subject}\nBody preview: ${payload.htmlContent.substring(0, 200)}...`);
    return { success: true, messageId: `mock_brevo_msg_${Date.now()}` };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: payload.to, name: payload.toName || payload.to }],
        subject: payload.subject,
        htmlContent: payload.htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || `Brevo API error ${response.status}`;
      console.error('[Brevo Sender Error]:', errorMsg);
      return { success: false, error: errorMsg };
    }

    return { success: true, messageId: data.messageId || `brevo_msg_${Date.now()}` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown Brevo network error';
    console.error('[Brevo Sender Exception]:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
