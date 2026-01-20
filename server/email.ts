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

// Format the from address with display name
function formatFromAddress(fromEmail: string | undefined): string {
  const defaultFrom = 'Flow 83 <support@send.flow83.com>';
  if (!fromEmail) return defaultFrom;
  
  // If already has display name format (contains <), use as-is but ensure Flow 83 name
  if (fromEmail.includes('<')) {
    // Replace any existing name with Flow 83
    return fromEmail.replace(/^[^<]*</, 'Flow 83 <');
  }
  
  // Just an email address, wrap with Flow 83 name
  return `Flow 83 <${fromEmail}>`;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: formatFromAddress(fromEmail)
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
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafafa; margin: 0; padding: 40px 20px;">
        <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: #7c3aed; padding: 28px 32px;">
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">Flow 83</h1>
          </div>
          <div style="padding: 32px; text-align: right;">
            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 18px; font-weight: 600;">שלום ${participantName || 'לך'},</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
              התשלום שלך התקבל בהצלחה.<br><br>
              הגישה שלך ל<strong style="color: #7c3aed;">${journeyName}</strong>${mentorName ? ` של ${mentorName}` : ''} מוכנה.
            </p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px; font-weight: 500;">פרטי הכניסה שלך:</p>
              <table style="width: 100%; font-size: 14px; color: #374151;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">שם:</td>
                  <td style="padding: 6px 0;">${participantName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">אימייל:</td>
                  <td style="padding: 6px 0; direction: ltr; text-align: right;">${participantEmail}</td>
                </tr>
                ${participantIdNumber ? `
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">ת.ז.:</td>
                  <td style="padding: 6px 0; direction: ltr; text-align: right;">${participantIdNumber}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            <a href="${journeyLink}" style="display: block; background: #7c3aed; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; text-align: center; font-weight: 600; font-size: 15px;">
              התחל את התהליך
            </a>
          </div>
          <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
              Flow 83 | פלטפורמה לתהליכי טרנספורמציה
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
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafafa; margin: 0; padding: 40px 20px;">
        <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: #7c3aed; padding: 28px 32px;">
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">Flow 83</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 18px; font-weight: 600;">Hello ${participantName || 'there'},</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
              Your payment was successful.<br><br>
              Your access to <strong style="color: #7c3aed;">${journeyName}</strong>${mentorName ? ` by ${mentorName}` : ''} is ready.
            </p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px; font-weight: 500;">Your login details:</p>
              <table style="width: 100%; font-size: 14px; color: #374151;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Name:</td>
                  <td style="padding: 6px 0;">${participantName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Email:</td>
                  <td style="padding: 6px 0;">${participantEmail}</td>
                </tr>
                ${participantIdNumber ? `
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">ID:</td>
                  <td style="padding: 6px 0;">${participantIdNumber}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            <a href="${journeyLink}" style="display: block; background: #7c3aed; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; text-align: center; font-weight: 600; font-size: 15px;">
              Start Your Journey
            </a>
          </div>
          <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
              Flow 83 | Transformational Journey Platform
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await client.emails.send({
      from: fromEmail,
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

// Daily reminder email - sent to active participants
interface DailyReminderEmailParams {
  participantEmail: string;
  participantName: string;
  journeyName: string;
  journeyLink: string;
  currentDay: number;
  totalDays: number;
  mentorName?: string;
  language?: 'he' | 'en';
}

export async function sendDailyReminderEmail(params: DailyReminderEmailParams): Promise<boolean> {
  const { participantEmail, participantName, journeyName, journeyLink, currentDay, totalDays, mentorName, language = 'he' } = params;

  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const isHebrew = language === 'he';

    const encouragements = isHebrew ? [
      'אתה עושה עבודה מדהימה!',
      'כל יום הוא צעד קדימה',
      'המשך כך, אתה בדרך הנכונה!',
      'היום מחכה לך עוד גילוי',
      'התהליך שלך ממשיך להתפתח'
    ] : [
      'You\'re doing amazing!',
      'Every day is a step forward',
      'Keep going, you\'re on the right path!',
      'Today holds new discoveries for you',
      'Your journey continues to unfold'
    ];
    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    const subject = isHebrew
      ? `יום ${currentDay} מחכה לך ב${journeyName} ✨`
      : `Day ${currentDay} awaits you in ${journeyName} ✨`;

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
            <h1 style="color: white; margin: 0; font-size: 24px;">🌅 בוקר טוב!</h1>
          </div>
          <div style="padding: 32px; text-align: right;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px;">${participantName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              ${encouragement}<br><br>
              היום <strong style="color: #7c3aed;">יום ${currentDay} מתוך ${totalDays}</strong> ב<strong>${journeyName}</strong>${mentorName ? ` של ${mentorName}` : ''} מחכה לך.
            </p>
            <div style="background: #f8f7ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 8px;">📖</div>
              <p style="color: #64748b; font-size: 14px; margin: 0;">התוכן של היום כבר מוכן</p>
            </div>
            <a href="${journeyLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 16px;">
              המשך לתהליך שלי
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
            <h1 style="color: white; margin: 0; font-size: 24px;">🌅 Good Morning!</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px;">${participantName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              ${encouragement}<br><br>
              <strong style="color: #7c3aed;">Day ${currentDay} of ${totalDays}</strong> in <strong>${journeyName}</strong>${mentorName ? ` by ${mentorName}` : ''} is waiting for you.
            </p>
            <div style="background: #f8f7ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 8px;">📖</div>
              <p style="color: #64748b; font-size: 14px; margin: 0;">Today's content is ready</p>
            </div>
            <a href="${journeyLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 16px;">
              Continue My Journey
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
      from: fromEmail,
      to: participantEmail,
      subject,
      html
    });

    console.log('Daily reminder email sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send daily reminder email:', error);
    return false;
  }
}

// Inactivity reminder - sent after 2-3 days of no activity
interface InactivityReminderEmailParams {
  participantEmail: string;
  participantName: string;
  journeyName: string;
  journeyLink: string;
  daysSinceActive: number;
  currentDay: number;
  mentorName?: string;
  language?: 'he' | 'en';
}

export async function sendInactivityReminderEmail(params: InactivityReminderEmailParams): Promise<boolean> {
  const { participantEmail, participantName, journeyName, journeyLink, daysSinceActive, currentDay, mentorName, language = 'he' } = params;

  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const isHebrew = language === 'he';

    const subject = isHebrew
      ? `חסר לנו אותך ב${journeyName} 💜`
      : `We miss you in ${journeyName} 💜`;

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
            <h1 style="color: white; margin: 0; font-size: 24px;">💜 חסר לנו אותך</h1>
          </div>
          <div style="padding: 32px; text-align: right;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px;">היי ${participantName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              שמנו לב שלא נכנסת לתהליך כבר ${daysSinceActive} ימים.<br><br>
              זה בסדר גמור לקחת הפסקה, אבל רצינו להזכיר לך ש<strong style="color: #7c3aed;">${journeyName}</strong>${mentorName ? ` של ${mentorName}` : ''} עדיין מחכה לך.<br><br>
              אתה ביום ${currentDay} - והמשך המסע מחכה!
            </p>
            <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">🌟</div>
              <p style="color: #92400e; font-size: 14px; margin: 0;">כל צעד קטן הוא התקדמות</p>
            </div>
            <a href="${journeyLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 16px;">
              חזרה לתהליך
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
            <h1 style="color: white; margin: 0; font-size: 24px;">💜 We Miss You</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px;">Hey ${participantName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              We noticed you haven't visited in ${daysSinceActive} days.<br><br>
              It's perfectly okay to take a break, but we wanted to remind you that <strong style="color: #7c3aed;">${journeyName}</strong>${mentorName ? ` by ${mentorName}` : ''} is still waiting for you.<br><br>
              You're on day ${currentDay} - your journey continues!
            </p>
            <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">🌟</div>
              <p style="color: #92400e; font-size: 14px; margin: 0;">Every small step is progress</p>
            </div>
            <a href="${journeyLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 16px;">
              Return to My Journey
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
      from: fromEmail,
      to: participantEmail,
      subject,
      html
    });

    console.log('Inactivity reminder email sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send inactivity reminder email:', error);
    return false;
  }
}

// Not started reminder - sent to participants who registered but haven't entered the flow
interface NotStartedReminderEmailParams {
  participantEmail: string;
  participantName: string;
  journeyName: string;
  journeyLink: string;
  daysSinceRegistration: number;
  mentorName?: string;
  language?: 'he' | 'en';
}

export async function sendNotStartedReminderEmail(params: NotStartedReminderEmailParams): Promise<boolean> {
  const { participantEmail, participantName, journeyName, journeyLink, daysSinceRegistration, mentorName, language = 'he' } = params;

  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const isHebrew = language === 'he';

    const subject = isHebrew
      ? `יום 1 מחכה לך ב${journeyName} ✨`
      : `Day 1 is waiting for you in ${journeyName} ✨`;

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
            <h1 style="color: white; margin: 0; font-size: 24px;">✨ יום 1 מחכה לך</h1>
          </div>
          <div style="padding: 32px; text-align: right;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px;">היי ${participantName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              שמנו לב שנרשמת ל<strong style="color: #7c3aed;">${journeyName}</strong>${mentorName ? ` של ${mentorName}` : ''} אבל עדיין לא התחלת.<br><br>
              המסע שלך מחכה! יום 1 כבר מוכן עבורך, עם תוכן מותאם אישית שיעזור לך להתחיל את השינוי.<br><br>
              זה הזמן להתחיל 💜
            </p>
            <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">🚀</div>
              <p style="color: #166534; font-size: 14px; margin: 0;">הצעד הראשון הוא תמיד הקשה ביותר - אבל גם הכי משמעותי</p>
            </div>
            <a href="${journeyLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 16px;">
              להתחיל את יום 1
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
            <h1 style="color: white; margin: 0; font-size: 24px;">✨ Day 1 is Waiting</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px;">Hey ${participantName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              We noticed you signed up for <strong style="color: #7c3aed;">${journeyName}</strong>${mentorName ? ` by ${mentorName}` : ''} but haven't started yet.<br><br>
              Your journey is waiting! Day 1 is ready for you, with personalized content to help you begin your transformation.<br><br>
              Now is the time to start 💜
            </p>
            <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">🚀</div>
              <p style="color: #166534; font-size: 14px; margin: 0;">The first step is always the hardest - but also the most meaningful</p>
            </div>
            <a href="${journeyLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 16px;">
              Start Day 1
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
      from: fromEmail,
      to: participantEmail,
      subject,
      html
    });

    console.log('Not started reminder email sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send not started reminder email:', error);
    return false;
  }
}

// Completion congratulations email
interface CompletionEmailParams {
  participantEmail: string;
  participantName: string;
  journeyName: string;
  totalDays: number;
  mentorName?: string;
  language?: 'he' | 'en';
}

export async function sendCompletionEmail(params: CompletionEmailParams): Promise<boolean> {
  const { participantEmail, participantName, journeyName, totalDays, mentorName, language = 'he' } = params;

  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const isHebrew = language === 'he';

    const subject = isHebrew
      ? `🎉 סיימת את ${journeyName}! מזל טוב!`
      : `🎉 You completed ${journeyName}! Congratulations!`;

    const html = isHebrew ? `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f7ff; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
            <h1 style="color: white; margin: 0; font-size: 28px;">מזל טוב!</h1>
          </div>
          <div style="padding: 32px; text-align: right;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px;">${participantName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              עשית את זה! 🌟<br><br>
              סיימת בהצלחה את <strong style="color: #059669;">${journeyName}</strong>${mentorName ? ` של ${mentorName}` : ''} - כל ${totalDays} הימים!<br><br>
              זה הישג משמעותי. השקעת בעצמך, התמדת, והגעת לסוף. זה לא מובן מאליו.
            </p>
            <div style="background: #ecfdf5; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 24px; color: #059669; font-weight: bold; margin-bottom: 8px;">${totalDays} ימים</div>
              <p style="color: #047857; font-size: 14px; margin: 0;">של צמיחה והתפתחות</p>
            </div>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
              קח רגע לחגוג את עצמך. מגיע לך. 💜
            </p>
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
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
            <h1 style="color: white; margin: 0; font-size: 28px;">Congratulations!</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px;">${participantName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              You did it! 🌟<br><br>
              You successfully completed <strong style="color: #059669;">${journeyName}</strong>${mentorName ? ` by ${mentorName}` : ''} - all ${totalDays} days!<br><br>
              This is a significant achievement. You invested in yourself, persevered, and made it to the end.
            </p>
            <div style="background: #ecfdf5; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 24px; color: #059669; font-weight: bold; margin-bottom: 8px;">${totalDays} days</div>
              <p style="color: #047857; font-size: 14px; margin: 0;">of growth and development</p>
            </div>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
              Take a moment to celebrate yourself. You deserve it. 💜
            </p>
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
      from: fromEmail,
      to: participantEmail,
      subject,
      html
    });

    console.log('Completion email sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send completion email:', error);
    return false;
  }
}

// Mentor notification - new participant joined
interface NewParticipantNotificationParams {
  mentorEmail: string;
  mentorName: string;
  participantName: string;
  participantEmail: string;
  journeyName: string;
  language?: 'he' | 'en';
}

export async function sendNewParticipantNotification(params: NewParticipantNotificationParams): Promise<boolean> {
  const { mentorEmail, mentorName, participantName, participantEmail, journeyName, language = 'he' } = params;

  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const isHebrew = language === 'he';

    const subject = isHebrew
      ? `🎊 משתתף חדש נרשם ל${journeyName}!`
      : `🎊 New participant joined ${journeyName}!`;

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
            <h1 style="color: white; margin: 0; font-size: 24px;">🎊 משתתף חדש!</h1>
          </div>
          <div style="padding: 32px; text-align: right;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px;">היי ${mentorName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              יש לך משתתף חדש! 🎉<br><br>
              <strong style="color: #7c3aed;">${participantName}</strong> נרשם/ה לתהליך <strong>${journeyName}</strong>.
            </p>
            <div style="background: #f8f7ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #475569; font-size: 14px; font-weight: 600; margin: 0 0 12px;">פרטי המשתתף:</p>
              <table style="width: 100%; font-size: 14px; color: #64748b;">
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">שם:</td>
                  <td style="padding: 4px 0;">${participantName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">אימייל:</td>
                  <td style="padding: 4px 0; direction: ltr; text-align: right;">${participantEmail}</td>
                </tr>
              </table>
            </div>
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
            <h1 style="color: white; margin: 0; font-size: 24px;">🎊 New Participant!</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px;">Hey ${mentorName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              You have a new participant! 🎉<br><br>
              <strong style="color: #7c3aed;">${participantName}</strong> joined your journey <strong>${journeyName}</strong>.
            </p>
            <div style="background: #f8f7ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #475569; font-size: 14px; font-weight: 600; margin: 0 0 12px;">Participant details:</p>
              <table style="width: 100%; font-size: 14px; color: #64748b;">
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">Name:</td>
                  <td style="padding: 4px 0;">${participantName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 500;">Email:</td>
                  <td style="padding: 4px 0;">${participantEmail}</td>
                </tr>
              </table>
            </div>
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
      from: fromEmail,
      to: mentorEmail,
      subject,
      html
    });

    console.log('New participant notification sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send new participant notification:', error);
    return false;
  }
}

// Weekly mentor report
interface WeeklyReportParams {
  mentorEmail: string;
  mentorName: string;
  totalParticipants: number;
  activeParticipants: number;
  completedThisWeek: number;
  newThisWeek: number;
  journeys: { name: string; participants: number; completed: number }[];
  language?: 'he' | 'en';
}

export async function sendWeeklyMentorReport(params: WeeklyReportParams): Promise<boolean> {
  const { mentorEmail, mentorName, totalParticipants, activeParticipants, completedThisWeek, newThisWeek, journeys, language = 'he' } = params;

  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const isHebrew = language === 'he';

    const subject = isHebrew
      ? `📊 הדוח השבועי שלך - Flow 83`
      : `📊 Your Weekly Report - Flow 83`;

    const journeyRows = journeys.map(j => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${j.name}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: center;">${j.participants}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: center;">${j.completed}</td>
      </tr>
    `).join('');

    const html = isHebrew ? `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f7ff; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📊 הדוח השבועי שלך</h1>
          </div>
          <div style="padding: 32px; text-align: right;">
            <h2 style="color: #1e1b4b; margin: 0 0 24px;">שלום ${mentorName},</h2>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px;">
              <div style="background: #f8f7ff; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #7c3aed;">${totalParticipants}</div>
                <div style="color: #64748b; font-size: 14px;">סה"כ משתתפים</div>
              </div>
              <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #059669;">${activeParticipants}</div>
                <div style="color: #64748b; font-size: 14px;">פעילים</div>
              </div>
              <div style="background: #fef3c7; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #d97706;">${newThisWeek}</div>
                <div style="color: #64748b; font-size: 14px;">חדשים השבוע</div>
              </div>
              <div style="background: #dbeafe; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #2563eb;">${completedThisWeek}</div>
                <div style="color: #64748b; font-size: 14px;">סיימו השבוע</div>
              </div>
            </div>

            ${journeys.length > 0 ? `
            <h3 style="color: #1e1b4b; margin: 0 0 16px;">פירוט לפי תהליכים:</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 12px 8px; text-align: right;">תהליך</th>
                  <th style="padding: 12px 8px; text-align: center;">משתתפים</th>
                  <th style="padding: 12px 8px; text-align: center;">סיימו</th>
                </tr>
              </thead>
              <tbody>
                ${journeyRows}
              </tbody>
            </table>
            ` : ''}
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
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📊 Your Weekly Report</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1e1b4b; margin: 0 0 24px;">Hello ${mentorName},</h2>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px;">
              <div style="background: #f8f7ff; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #7c3aed;">${totalParticipants}</div>
                <div style="color: #64748b; font-size: 14px;">Total Participants</div>
              </div>
              <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #059669;">${activeParticipants}</div>
                <div style="color: #64748b; font-size: 14px;">Active</div>
              </div>
              <div style="background: #fef3c7; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #d97706;">${newThisWeek}</div>
                <div style="color: #64748b; font-size: 14px;">New This Week</div>
              </div>
              <div style="background: #dbeafe; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #2563eb;">${completedThisWeek}</div>
                <div style="color: #64748b; font-size: 14px;">Completed This Week</div>
              </div>
            </div>

            ${journeys.length > 0 ? `
            <h3 style="color: #1e1b4b; margin: 0 0 16px;">Breakdown by Journey:</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 12px 8px; text-align: left;">Journey</th>
                  <th style="padding: 12px 8px; text-align: center;">Participants</th>
                  <th style="padding: 12px 8px; text-align: center;">Completed</th>
                </tr>
              </thead>
              <tbody>
                ${journeyRows}
              </tbody>
            </table>
            ` : ''}
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
      from: fromEmail,
      to: mentorEmail,
      subject,
      html
    });

    console.log('Weekly report sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send weekly report:', error);
    return false;
  }
}

// Welcome email for new mentors
interface MentorWelcomeEmailParams {
  mentorEmail: string;
  mentorName: string;
  dashboardLink: string;
  language?: 'he' | 'en';
}

export async function sendMentorWelcomeEmail(params: MentorWelcomeEmailParams): Promise<boolean> {
  const { mentorEmail, mentorName, dashboardLink, language = 'he' } = params;

  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const isHebrew = language === 'he';

    const subject = isHebrew
      ? `ברוכים הבאים ל-Flow 83! 🎉`
      : `Welcome to Flow 83! 🎉`;

    const html = isHebrew ? `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f7ff; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
            <h1 style="color: white; margin: 0; font-size: 28px;">ברוכים הבאים ל-Flow 83!</h1>
          </div>
          <div style="padding: 32px; text-align: right;">
            <h2 style="color: #1e1b4b; margin: 0 0 20px;">שלום ${mentorName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.8; margin: 0 0 24px;">
              שמחים שהצטרפת! 💜<br><br>
              Flow 83 היא הפלטפורמה שתעזור לך להפוך את הידע והמתודולוגיה שלך לתהליכי טרנספורמציה דיגיטליים - חוויות יומיות מותאמות אישית שמועברות בצ'אט AI חכם.
            </p>

            <div style="background: #f8f7ff; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <h3 style="color: #7c3aed; margin: 0 0 16px; font-size: 18px;">🚀 מה תמצא בדשבורד שלך:</h3>
              <ul style="color: #475569; font-size: 15px; line-height: 2; margin: 0; padding-right: 20px;">
                <li><strong>יצירת Flow חדש</strong> - בנה תהליכים של 3 או 7 ימים מהתוכן שלך</li>
                <li><strong>ניהול משתתפים</strong> - עקוב אחרי ההתקדמות של כל משתתף</li>
                <li><strong>עריכת תוכן</strong> - התאם את התוכן והמסרים בכל עת</li>
                <li><strong>דפי נחיתה</strong> - דפי מכירה מותאמים לכל תהליך</li>
                <li><strong>תשלומים</strong> - קבל תשלומים ישירות מהמשתתפים</li>
                <li><strong>סטטיסטיקות</strong> - נתונים על התקדמות ומעורבות</li>
              </ul>
            </div>

            <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #059669; margin: 0 0 12px; font-size: 16px;">💡 טיפ להתחלה מהירה:</h3>
              <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6;">
                לחץ על "צור Flow חדש" בדשבורד, העלה מסמך עם התוכן שלך, והמערכת תייצר עבורך תהליך שלם תוך דקות!
              </p>
            </div>

            <a href="${dashboardLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 18px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 18px; margin-bottom: 24px;">
              כניסה לדשבורד שלי
            </a>

            <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center;">
              <p style="color: #475569; font-size: 14px; margin: 0 0 8px;">
                <strong>יש לך שאלות? נשמח לעזור!</strong>
              </p>
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                שלח לנו מייל ל: <a href="mailto:support@flow83.com" style="color: #7c3aed; text-decoration: none;">support@flow83.com</a>
              </p>
            </div>
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
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Flow 83!</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1e1b4b; margin: 0 0 20px;">Hello ${mentorName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.8; margin: 0 0 24px;">
              We're thrilled you joined us! 💜<br><br>
              Flow 83 is the platform that helps you transform your knowledge and methodology into digital transformation journeys - personalized daily experiences delivered through smart AI chat.
            </p>

            <div style="background: #f8f7ff; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <h3 style="color: #7c3aed; margin: 0 0 16px; font-size: 18px;">🚀 What you'll find in your dashboard:</h3>
              <ul style="color: #475569; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
                <li><strong>Create New Flow</strong> - Build 3 or 7-day journeys from your content</li>
                <li><strong>Participant Management</strong> - Track each participant's progress</li>
                <li><strong>Content Editing</strong> - Customize content and messages anytime</li>
                <li><strong>Landing Pages</strong> - Customized sales pages for each journey</li>
                <li><strong>Payments</strong> - Receive payments directly from participants</li>
                <li><strong>Analytics</strong> - Data on progress and engagement</li>
              </ul>
            </div>

            <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #059669; margin: 0 0 12px; font-size: 16px;">💡 Quick Start Tip:</h3>
              <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6;">
                Click "Create New Flow" in your dashboard, upload a document with your content, and the system will generate a complete journey for you in minutes!
              </p>
            </div>

            <a href="${dashboardLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 18px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 18px; margin-bottom: 24px;">
              Go to My Dashboard
            </a>

            <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center;">
              <p style="color: #475569; font-size: 14px; margin: 0 0 8px;">
                <strong>Have questions? We're here to help!</strong>
              </p>
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Email us at: <a href="mailto:support@flow83.com" style="color: #7c3aed; text-decoration: none;">support@flow83.com</a>
              </p>
            </div>
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
      from: fromEmail,
      to: mentorEmail,
      subject,
      html
    });

    console.log('Mentor welcome email sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send mentor welcome email:', error);
    return false;
  }
}
