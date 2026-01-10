// Email service using Resend integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

interface JourneyAccessEmailParams {
  participantEmail: string;
  participantName: string;
  participantIdNumber?: string;
  journeyName: string;
  journeyLink: string;
  mentorName?: string;
  language?: 'he' | 'en';
}

export async function sendJourneyAccessEmail(params: JourneyAccessEmailParams): Promise<boolean> {
  const { participantEmail, participantName, participantIdNumber, journeyName, journeyLink, mentorName, language = 'he' } = params;

  try {
    const { client, fromEmail } = await getUncachableResendClient();

    const isHebrew = language === 'he';

    const subject = isHebrew 
      ? `הגישה שלך ל-${journeyName} מוכנה!`
      : `Your access to ${journeyName} is ready!`;

    const html = isHebrew ? `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f7ff; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Flow 83</h1>
          </div>
          <div style="padding: 32px; text-align: right;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px;">שלום ${participantName || 'לך'},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              התשלום שלך התקבל בהצלחה! 🎉<br><br>
              הגישה שלך ל<strong style="color: #7c3aed;">${journeyName}</strong>${mentorName ? ` של ${mentorName}` : ''} מוכנה.
            </p>
            <div style="background: #f8f7ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 8px;">הקישור שלך לתהליך:</p>
              <a href="${journeyLink}" style="color: #7c3aed; font-size: 14px; word-break: break-all;">${journeyLink}</a>
            </div>
            <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #475569; font-size: 14px; font-weight: 600; margin: 0 0 12px;">פרטי ההתחברות שלך:</p>
              <table style="width: 100%; font-size: 14px; color: #64748b;">
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">שם:</td>
                  <td style="padding: 4px 0;">${participantName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">אימייל:</td>
                  <td style="padding: 4px 0; direction: ltr; text-align: right;">${participantEmail}</td>
                </tr>
                ${participantIdNumber ? `
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">ת.ז.:</td>
                  <td style="padding: 4px 0; direction: ltr; text-align: right;">${participantIdNumber}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            <a href="${journeyLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 16px;">
              התחל את המסע שלך
            </a>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © Flow 83 - פלטפורמה ליצירת תהליכי טרנספורמציה
            </p>
          </div>
        </div>
      </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f7ff; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Flow 83</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px;">Hello ${participantName || 'there'},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Your payment was successful! 🎉<br><br>
              Your access to <strong style="color: #7c3aed;">${journeyName}</strong>${mentorName ? ` by ${mentorName}` : ''} is ready.
            </p>
            <div style="background: #f8f7ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 8px;">Your journey link:</p>
              <a href="${journeyLink}" style="color: #7c3aed; font-size: 14px; word-break: break-all;">${journeyLink}</a>
            </div>
            <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #475569; font-size: 14px; font-weight: 600; margin: 0 0 12px;">Your login details:</p>
              <table style="width: 100%; font-size: 14px; color: #64748b;">
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">Name:</td>
                  <td style="padding: 4px 0;">${participantName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">Email:</td>
                  <td style="padding: 4px 0;">${participantEmail}</td>
                </tr>
                ${participantIdNumber ? `
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">ID:</td>
                  <td style="padding: 4px 0;">${participantIdNumber}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            <a href="${journeyLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 16px;">
              Start Your Journey
            </a>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © Flow 83 - Transformational Journey Platform
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await client.emails.send({
      from: fromEmail || 'Flow 83 <onboarding@resend.dev>',
      to: participantEmail,
      subject,
      html
    });

    console.log('Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}
