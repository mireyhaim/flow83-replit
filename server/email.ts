// Email service using Resend integration
import { Resend } from 'resend';

let connectionSettings: any;

// Gender-aware Hebrew text helper
type AddressingStyle = 'female' | 'male' | 'neutral';

interface GenderedText {
  youAre: string;        // אתה/את/אתם
  youEntered: string;    // נכנסת (same for both in past tense)
  youRegistered: string; // נרשמת (same for both in past tense)
  youCompleted: string;  // סיימת (same for both in past tense)
  forYou: string;        // עבורך/עבורכם
  toYou: string;         // לך/לכם
  waitingForYou: string; // מחכה לך
}

function getGenderedText(style: AddressingStyle): GenderedText {
  switch (style) {
    case 'female':
      return {
        youAre: 'את',
        youEntered: 'נכנסת',
        youRegistered: 'נרשמת',
        youCompleted: 'סיימת',
        forYou: 'עבורך',
        toYou: 'לך',
        waitingForYou: 'מחכה לך'
      };
    case 'male':
      return {
        youAre: 'אתה',
        youEntered: 'נכנסת',
        youRegistered: 'נרשמת',
        youCompleted: 'סיימת',
        forYou: 'עבורך',
        toYou: 'לך',
        waitingForYou: 'מחכה לך'
      };
    case 'neutral':
    default:
      return {
        youAre: 'את/ה',
        youEntered: 'נכנסת',
        youRegistered: 'נרשמת',
        youCompleted: 'סיימת',
        forYou: 'עבורך',
        toYou: 'לך',
        waitingForYou: 'מחכה לך'
      };
  }
}

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
// If senderName is provided (mentor name), use that instead of "Flow 83"
function formatFromAddress(fromEmail: string | undefined, senderName?: string): string {
  const displayName = senderName || 'Flow 83';
  const defaultFrom = `${displayName} <support@send.flow83.com>`;
  if (!fromEmail) return defaultFrom;
  
  // If already has display name format (contains <), use the custom sender name
  if (fromEmail.includes('<')) {
    // Replace any existing name with the sender name
    return fromEmail.replace(/^[^<]*</, `${displayName} <`);
  }
  
  // Just an email address, wrap with sender name
  return `${displayName} <${fromEmail}>`;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// senderName is optional - if provided, it will be used as the display name instead of "Flow 83"
async function getUncachableResendClient(senderName?: string) {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: formatFromAddress(fromEmail, senderName)
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
    // Use mentor name as sender if available
    const { client, fromEmail } = await getUncachableResendClient(mentorName);

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
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafafa; margin: 0; padding: 40px 20px; direction: rtl; text-align: right;">
        <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; direction: rtl; text-align: right;">
          <div style="padding: 32px; text-align: right; direction: rtl;">
            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 18px; font-weight: 600; text-align: right;">שלום ${participantName || 'לך'},</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 28px; text-align: right; direction: rtl;">
              התשלום שלך התקבל בהצלחה.<br><br>
              הגישה שלך ל<strong style="color: #7c3aed;">${journeyName}</strong>${mentorName ? ` של ${mentorName}` : ''} מוכנה.
            </p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px; direction: rtl; text-align: right;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px; font-weight: 500; text-align: right;">פרטי הכניסה שלך:</p>
              <table style="width: 100%; font-size: 14px; color: #374151; direction: rtl;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; text-align: right;">שם:</td>
                  <td style="padding: 6px 0; text-align: right;">${participantName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; text-align: right;">אימייל:</td>
                  <td style="padding: 6px 0; direction: ltr; text-align: left;">${participantEmail}</td>
                </tr>
                ${participantIdNumber ? `
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; text-align: right;">ת.ז.:</td>
                  <td style="padding: 6px 0; direction: ltr; text-align: left;">${participantIdNumber}</td>
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
  addressingStyle?: AddressingStyle;
}

export async function sendInactivityReminderEmail(params: InactivityReminderEmailParams): Promise<boolean> {
  const { participantEmail, participantName, journeyName, journeyLink, daysSinceActive, currentDay, mentorName, language = 'he', addressingStyle = 'neutral' } = params;
  const g = getGenderedText(addressingStyle);

  try {
    // Use mentor name as sender if available
    const { client, fromEmail } = await getUncachableResendClient(mentorName);
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
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f7ff; margin: 0; padding: 20px; direction: rtl; text-align: right;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); direction: rtl; text-align: right;">
          <div style="padding: 32px; text-align: right; direction: rtl;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px; text-align: right;">היי ${participantName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: right; direction: rtl;">
              שמנו לב שלא ${g.youEntered} לתהליך כבר ${daysSinceActive} ימים.<br><br>
              זה בסדר גמור לקחת הפסקה, אבל רצינו להזכיר ${g.toYou} ש<strong style="color: #7c3aed;">${journeyName}</strong>${mentorName ? ` של ${mentorName}` : ''} עדיין ${g.waitingForYou}.<br><br>
              ${g.youAre} ביום ${currentDay} - והמשך המסע מחכה!
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
  addressingStyle?: AddressingStyle;
}

export async function sendNotStartedReminderEmail(params: NotStartedReminderEmailParams): Promise<boolean> {
  const { participantEmail, participantName, journeyName, journeyLink, daysSinceRegistration, mentorName, language = 'he', addressingStyle = 'neutral' } = params;
  const g = getGenderedText(addressingStyle);

  try {
    // Use mentor name as sender if available
    const { client, fromEmail } = await getUncachableResendClient(mentorName);
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
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f7ff; margin: 0; padding: 20px; direction: rtl; text-align: right;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); direction: rtl; text-align: right;">
          <div style="padding: 32px; text-align: right; direction: rtl;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px; text-align: right;">היי ${participantName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: right; direction: rtl;">
              שמנו לב ש${g.youRegistered} ל<strong style="color: #7c3aed;">${journeyName}</strong>${mentorName ? ` של ${mentorName}` : ''} אבל עדיין לא התחלת.<br><br>
              המסע שלך מחכה! יום 1 כבר מוכן ${g.forYou}, עם תוכן מותאם אישית שיעזור ${g.toYou} להתחיל את השינוי.<br><br>
              זה הזמן להתחיל
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
  addressingStyle?: AddressingStyle;
}

export async function sendCompletionEmail(params: CompletionEmailParams): Promise<boolean> {
  const { participantEmail, participantName, journeyName, totalDays, mentorName, language = 'he', addressingStyle = 'neutral' } = params;
  const g = getGenderedText(addressingStyle);

  try {
    // Use mentor name as sender if available
    const { client, fromEmail } = await getUncachableResendClient(mentorName);
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
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f7ff; margin: 0; padding: 20px; direction: rtl; text-align: right;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); direction: rtl; text-align: right;">
          <div style="padding: 32px; text-align: right; direction: rtl;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px; text-align: right;">${participantName}, מזל טוב!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: right; direction: rtl;">
              ${g.youCompleted} את זה!<br><br>
              ${g.youCompleted} בהצלחה את <strong style="color: #059669;">${journeyName}</strong>${mentorName ? ` של ${mentorName}` : ''} - כל ${totalDays} הימים!<br><br>
              זה הישג משמעותי. השקעת בעצמך, התמדת, והגעת לסוף. זה לא מובן מאליו.
            </p>
            <div style="background: #ecfdf5; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 24px; color: #059669; font-weight: bold; margin-bottom: 8px;">${totalDays} ימים</div>
              <p style="color: #047857; font-size: 14px; margin: 0;">של צמיחה והתפתחות</p>
            </div>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0; text-align: right;">
              קח רגע לחגוג את עצמך. מגיע לך.
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
          <div style="padding: 32px;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px;">${participantName}, Congratulations!</h2>
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
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f7ff; margin: 0; padding: 20px; direction: rtl; text-align: right;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); direction: rtl; text-align: right;">
          <div style="padding: 32px; text-align: right; direction: rtl;">
            <h2 style="color: #1e1b4b; margin: 0 0 16px; text-align: right;">היי ${mentorName},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: right; direction: rtl;">
              יש לך משתתף חדש!<br><br>
              <strong style="color: #7c3aed;">${participantName}</strong> נרשם/ה לתהליך <strong>${journeyName}</strong>.
            </p>
            <div style="background: #f8f7ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; direction: rtl; text-align: right;">
              <p style="color: #475569; font-size: 14px; font-weight: 600; margin: 0 0 12px; text-align: right;">פרטי המשתתף:</p>
              <table style="width: 100%; font-size: 14px; color: #64748b; direction: rtl;">
                <tr>
                  <td style="padding: 4px 0; font-weight: 500; text-align: right;">שם:</td>
                  <td style="padding: 4px 0; text-align: right;">${participantName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 500; text-align: right;">אימייל:</td>
                  <td style="padding: 4px 0; direction: ltr; text-align: left;">${participantEmail}</td>
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
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f7ff; margin: 0; padding: 20px; direction: rtl; text-align: right;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); direction: rtl; text-align: right;">
          <div style="padding: 32px; text-align: right; direction: rtl;">
            <h2 style="color: #1e1b4b; margin: 0 0 20px; text-align: right;">שלום ${mentorName}, ברוכים הבאים ל-Flow 83!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.8; margin: 0 0 24px; text-align: right; direction: rtl;">
              שמחים שהצטרפת!<br><br>
              Flow 83 היא הפלטפורמה שתעזור לך להפוך את הידע והמתודולוגיה שלך לתהליכי טרנספורמציה דיגיטליים - חוויות יומיות מותאמות אישית שמועברות בצ'אט AI חכם.
            </p>

            <div style="background: #f8f7ff; border-radius: 16px; padding: 24px; margin-bottom: 24px; direction: rtl; text-align: right;">
              <h3 style="color: #7c3aed; margin: 0 0 16px; font-size: 18px; text-align: right;">מה תמצא בדשבורד שלך:</h3>
              <ul style="color: #475569; font-size: 15px; line-height: 2; margin: 0; padding-right: 20px; text-align: right;">
                <li><strong>יצירת Flow חדש</strong> - בנה תהליכים של 3 או 7 ימים מהתוכן שלך</li>
                <li><strong>ניהול משתתפים</strong> - עקוב אחרי ההתקדמות של כל משתתף</li>
                <li><strong>עריכת תוכן</strong> - התאם את התוכן והמסרים בכל עת</li>
                <li><strong>דפי נחיתה</strong> - דפי מכירה מותאמים לכל תהליך</li>
                <li><strong>תשלומים</strong> - קבל תשלומים ישירות מהמשתתפים</li>
                <li><strong>סטטיסטיקות</strong> - נתונים על התקדמות ומעורבות</li>
              </ul>
            </div>

            <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; margin-bottom: 24px; direction: rtl; text-align: right;">
              <h3 style="color: #059669; margin: 0 0 12px; font-size: 16px; text-align: right;">טיפ להתחלה מהירה:</h3>
              <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6; text-align: right;">
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
          <div style="padding: 32px;">
            <h2 style="color: #1e1b4b; margin: 0 0 20px;">Hello ${mentorName}, Welcome to Flow 83!</h2>
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

interface ParticipantLimitNotificationParams {
  mentorEmail: string;
  mentorName: string;
  currentParticipants: number;
  maxParticipants: number;
  threshold: 15 | 18 | 20;
  dashboardLink: string;
  language?: 'he' | 'en';
}

export async function sendParticipantLimitNotification(params: ParticipantLimitNotificationParams): Promise<boolean> {
  const { mentorEmail, mentorName, currentParticipants, maxParticipants, threshold, dashboardLink, language = 'he' } = params;

  try {
    // Platform notification - uses "Flow 83" as sender
    const { client, fromEmail } = await getUncachableResendClient();

    const isHebrew = language === 'he';
    const isAtLimit = currentParticipants >= maxParticipants;
    
    const subject = isHebrew
      ? isAtLimit 
        ? `⚠️ הגעת למגבלת המשתתפים - ${currentParticipants}/${maxParticipants}`
        : `📊 התקרבת למגבלת המשתתפים - ${currentParticipants}/${maxParticipants}`
      : isAtLimit
        ? `⚠️ You've reached your participant limit - ${currentParticipants}/${maxParticipants}`
        : `📊 You're approaching your participant limit - ${currentParticipants}/${maxParticipants}`;

    const html = isHebrew ? `
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f7ff; margin: 0; padding: 20px; direction: rtl;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="padding: 32px;">
            <h2 style="color: #1e1b4b; margin: 0 0 20px;">${isAtLimit ? `${mentorName}, הגעת למגבלת המשתתפים!` : `היי ${mentorName}, התקרבת למגבלה!`}</h2>
            
            <div style="background: ${isAtLimit ? '#fef2f2' : '#fefce8'}; border: 2px solid ${isAtLimit ? '#ef4444' : '#f59e0b'}; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 48px; font-weight: bold; color: ${isAtLimit ? '#dc2626' : '#d97706'}; margin-bottom: 8px;">
                ${currentParticipants}/${maxParticipants}
              </div>
              <div style="color: ${isAtLimit ? '#991b1b' : '#92400e'}; font-size: 16px;">
                ${isAtLimit ? 'הגעת למגבלת המשתתפים בתוכנית שלך' : 'משתתפים מהמכסה שלך'}
              </div>
            </div>

            <p style="color: #475569; font-size: 16px; line-height: 1.8; margin: 0 0 24px;">
              ${isAtLimit 
                ? 'משתתפים חדשים לא יוכלו להצטרף לפלואים שלך עד שתשדרג את החבילה. כדי להמשיך לקבל משתתפים חדשים, שדרג עכשיו!'
                : `נשארו לך רק ${maxParticipants - currentParticipants} מקומות פנויים. כדי לא להפסיד משתתפים פוטנציאליים, כדאי לשקול שדרוג.`
              }
            </p>

            <a href="${dashboardLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 18px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 18px; margin-bottom: 16px;">
              ${isAtLimit ? 'שדרג עכשיו' : 'צפה בדשבורד'}
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
          <div style="padding: 32px;">
            <h2 style="color: #1e1b4b; margin: 0 0 20px;">${isAtLimit ? `${mentorName}, you've reached your participant limit!` : `Hey ${mentorName}, you're approaching your limit!`}</h2>
            
            <div style="background: ${isAtLimit ? '#fef2f2' : '#fefce8'}; border: 2px solid ${isAtLimit ? '#ef4444' : '#f59e0b'}; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 48px; font-weight: bold; color: ${isAtLimit ? '#dc2626' : '#d97706'}; margin-bottom: 8px;">
                ${currentParticipants}/${maxParticipants}
              </div>
              <div style="color: ${isAtLimit ? '#991b1b' : '#92400e'}; font-size: 16px;">
                ${isAtLimit ? 'You have reached your plan participant limit' : 'participants of your quota used'}
              </div>
            </div>

            <p style="color: #475569; font-size: 16px; line-height: 1.8; margin: 0 0 24px;">
              ${isAtLimit 
                ? 'New participants cannot join your flows until you upgrade your plan. To continue receiving new participants, upgrade now!'
                : `You only have ${maxParticipants - currentParticipants} spots left. Consider upgrading to avoid missing potential participants.`
              }
            </p>

            <a href="${dashboardLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 18px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 18px; margin-bottom: 16px;">
              ${isAtLimit ? 'Upgrade Now' : 'View Dashboard'}
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

    console.log('Participant limit notification sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send participant limit notification:', error);
    return false;
  }
}

// Admin notification when mentor submits flow for approval
interface FlowApprovalRequestParams {
  adminEmail: string;
  mentorName: string;
  mentorEmail: string;
  flowName: string;
  flowPrice: number;
  flowId: string;
  adminDashboardLink: string;
}

export async function sendFlowApprovalRequestEmail(params: FlowApprovalRequestParams): Promise<boolean> {
  const { adminEmail, mentorName, mentorEmail, flowName, flowPrice, flowId, adminDashboardLink } = params;

  try {
    const { client, fromEmail } = await getUncachableResendClient();

    const subject = `🔔 Flow חדש ממתין לאישור: ${flowName}`;

    const html = `
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f7ff; margin: 0; padding: 20px; direction: rtl;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Flow חדש ממתין לאישור</h1>
          </div>
          <div style="padding: 32px;">
            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h2 style="color: #92400e; margin: 0 0 12px;">${flowName}</h2>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="color: #78716c;">
                  <strong>מנטור:</strong> ${mentorName}
                </div>
                <div style="color: #78716c;">
                  <strong>מייל:</strong> ${mentorEmail}
                </div>
                <div style="color: #78716c;">
                  <strong>מחיר:</strong> ${flowPrice > 0 ? `₪${flowPrice}` : 'חינם'}
                </div>
              </div>
            </div>

            <p style="color: #475569; font-size: 16px; line-height: 1.8; margin: 0 0 24px;">
              המנטור הגיש את ה-Flow לאישור. צריך להוסיף לינק תשלום של Grow ולשלוח למנטור.
            </p>

            <a href="${adminDashboardLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 18px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 18px;">
              צפה בדשבורד אדמין
            </a>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © Flow 83 - Admin Notification
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await client.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject,
      html
    });

    console.log('Flow approval request email sent to admin:', result);
    return true;
  } catch (error) {
    console.error('Failed to send flow approval request email:', error);
    return false;
  }
}

// Email to mentor when flow is approved with mini-site link
interface FlowApprovedParams {
  mentorEmail: string;
  mentorName: string;
  flowName: string;
  miniSiteLink: string;
}

export async function sendFlowApprovedEmail(params: FlowApprovedParams): Promise<boolean> {
  const { mentorEmail, mentorName, flowName, miniSiteLink } = params;

  try {
    const { client, fromEmail } = await getUncachableResendClient();

    const subject = `✅ ה-Flow שלך אושר! הנה הלינק לפרסום: ${flowName}`;

    const html = `
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f7ff; margin: 0; padding: 20px; direction: rtl;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎉 מזל טוב! ה-Flow שלך אושר</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #1e1b4b; font-size: 18px; margin: 0 0 16px;">
              היי ${mentorName}!
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.8; margin: 0 0 24px;">
              ה-Flow שלך <strong>"${flowName}"</strong> אושר ומוכן לפרסום!
              הנה הלינק למיני-סייט שלך. שתפו אותו עם הלקוחות שלכם:
            </p>

            <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #475569; font-size: 14px; margin: 0 0 12px; font-weight: 600;">
                הלינק לפרסום:
              </p>
              <a href="${miniSiteLink}" style="color: #7c3aed; font-size: 16px; word-break: break-all; text-decoration: none;">
                ${miniSiteLink}
              </a>
            </div>

            <a href="${miniSiteLink}" style="display: block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 18px 32px; border-radius: 50px; text-align: center; font-weight: 600; font-size: 18px; margin-bottom: 16px;">
              צפה במיני-סייט
            </a>

            <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0;">
              שתפו את הלינק ברשתות החברתיות, בקבוצות וואטסאפ או בכל מקום שמתאים לכם!
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
    `;

    const result = await client.emails.send({
      from: fromEmail,
      to: mentorEmail,
      subject,
      html
    });

    console.log('Flow approved email sent to mentor:', result);
    return true;
  } catch (error) {
    console.error('Failed to send flow approved email:', error);
    return false;
  }
}

interface SubscriptionConfirmationParams {
  userEmail: string;
  userName: string;
  planName: string;
}

export async function sendSubscriptionConfirmationEmail(params: SubscriptionConfirmationParams): Promise<boolean> {
  const { userEmail, userName, planName } = params;

  try {
    const { client, fromEmail } = await getUncachableResendClient();

    const subject = `ברוכים הבאים ל-Flow83 ${planName}!`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: rgba(30, 27, 75, 0.8); border-radius: 24px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.3); backdrop-filter: blur(10px);">
            
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="color: #f8fafc; font-size: 28px; margin: 0 0 8px 0; font-weight: 700;">
                ברוכים הבאים למסלול ${planName}!
              </h1>
              <p style="color: #a78bfa; font-size: 16px; margin: 0;">
                ${userName}, התשלום שלך התקבל בהצלחה
              </p>
            </div>

            <div style="background: rgba(139, 92, 246, 0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(139, 92, 246, 0.2);">
              <h2 style="color: #c4b5fd; font-size: 18px; margin: 0 0 16px 0;">מה כלול במסלול שלך:</h2>
              <ul style="color: #e2e8f0; font-size: 15px; line-height: 1.8; margin: 0; padding-right: 20px;">
                <li>Flows ללא הגבלה</li>
                <li>משתתפים ללא הגבלה</li>
                <li>צ'אט AI אישי למשתתפים</li>
                <li>גבייה אוטומטית</li>
                <li>עמלה מופחתת על כל משתתף</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="https://www.flow83.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);">
                לדשבורד שלי →
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 24px 0 0 0;">
              יש שאלות? אנחנו כאן בשבילך.<br>
              <a href="mailto:support@flow83.com" style="color: #a78bfa;">support@flow83.com</a>
            </p>
          </div>

          <div style="text-align: center; padding: 24px 0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © Flow 83 - פלטפורמה ליצירת תהליכי טרנספורמציה
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await client.emails.send({
      from: fromEmail,
      to: userEmail,
      subject,
      html
    });

    console.log('Subscription confirmation email sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send subscription confirmation email:', error);
    return false;
  }
}
