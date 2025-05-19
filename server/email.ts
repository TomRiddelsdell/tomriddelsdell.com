import { MailService } from '@sendgrid/mail';

// Initialize SendGrid with API key
const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

/**
 * Send an email using SendGrid
 * @param emailData - Contact form data
 * @returns Promise that resolves to true if email sent successfully, false otherwise
 */
export async function sendContactEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Validate the data
    if (!emailData.name || !emailData.email || !emailData.message) {
      console.error('Missing required fields for sending email');
      return false;
    }
    
    // Set the recipient email address
    const toEmail = 't.riddelsdell@gmail.com';
    
    // Create a meaningful subject line
    const subject = emailData.subject 
      ? `Portfolio Contact: ${emailData.subject}` 
      : `New message from ${emailData.name} via Portfolio Contact Form`;

    // Construct the email content
    const emailContent = {
      to: toEmail,
      from: 'noreply@portfoliocontact.com', // This should be a verified sender in your SendGrid account
      subject: subject,
      text: `Name: ${emailData.name}\nEmail: ${emailData.email}\n\nMessage:\n${emailData.message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">New Contact Form Submission</h2>
          <p><strong>From:</strong> ${emailData.name} (${emailData.email})</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f7fafc; border-left: 4px solid #4299e1;">
            <p>${emailData.message.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #718096;">
            This email was sent from your portfolio website contact form.
          </p>
        </div>
      `
    };

    // Send the email
    await mailService.send(emailContent);
    console.log(`Email sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}