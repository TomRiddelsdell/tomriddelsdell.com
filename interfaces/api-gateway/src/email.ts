import sgMail from '@sendgrid/mail';

interface EmailData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function sendContactEmail(emailData: EmailData): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return false;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: process.env.CONTACT_EMAIL || 'contact@tomriddelsdell.com.com',
      from: process.env.FROM_EMAIL || 'noreply@tomriddelsdell.com.com',
      subject: emailData.subject || `Contact Form: ${emailData.name}`,
      text: `Name: ${emailData.name}\nEmail: ${emailData.email}\n\nMessage:\n${emailData.message}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${emailData.name}</p>
        <p><strong>Email:</strong> ${emailData.email}</p>
        <p><strong>Message:</strong></p>
        <p>${emailData.message.replace(/\n/g, '<br>')}</p>
      `,
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}