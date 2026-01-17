import { Resend } from 'resend';

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  console.log('Fetching Resend credentials...');
  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  
  const data = await response.json();
  console.log('Connection response:', JSON.stringify(data, null, 2));
  
  const connectionSettings = data.items?.[0];

  if (!connectionSettings || !connectionSettings.settings?.api_key) {
    throw new Error('Resend not connected or missing API key');
  }
  
  return { 
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email 
  };
}

async function sendTestEmail() {
  try {
    const { apiKey, fromEmail } = await getCredentials();
    console.log('Got credentials. From email:', fromEmail);
    
    const resend = new Resend(apiKey);
    
    const result = await resend.emails.send({
      from: fromEmail || 'Flow 83 <onboarding@resend.dev>',
      to: 'mireymol@gmail.com',
      subject: 'בדיקת מערכת המיילים - Flow 83',
      html: `
        <div dir="rtl" style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #7c3aed;">מייל בדיקה מ-Flow 83</h1>
          <p>אם אתה רואה את המייל הזה, מערכת המיילים עובדת!</p>
          <p style="color: #888;">נשלח בתאריך: ${new Date().toLocaleString('he-IL')}</p>
        </div>
      `
    });
    
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

sendTestEmail();
