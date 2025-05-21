import { MailService } from '@sendgrid/mail';

// Initialize SendGrid with API key
const mailService = new MailService();
const apiKey = process.env.SENDGRID_API_KEY || '';
mailService.setApiKey(apiKey);

if (!apiKey || !apiKey.startsWith('SG.')) {
  console.warn('SendGrid API key is not properly configured. Email functionality will not work.');
} else {
  console.log('SendGrid API key configured successfully.');
}

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
/**
 * Send a password reset email with a reset link
 * @param email - User's email address
 * @param resetCode - The reset code/token to include in the link
 * @returns Promise that resolves to true if email sent successfully, false otherwise
 */
export async function sendPasswordResetEmail(email: string, resetCode: string): Promise<boolean> {
  try {
    // Validate the data
    if (!email || !resetCode) {
      console.error('Missing email or reset code for password reset email');
      return false;
    }
    
    // Form the reset link (in a production environment, this would point to your domain)
    const resetLink = `${process.env.HOST_URL || 'http://localhost:5000'}/reset-password?code=${resetCode}&email=${encodeURIComponent(email)}`;
    
    // Construct the email content
    const emailContent = {
      to: email,
      from: 't.riddelsdell@gmail.com', // Must be verified in SendGrid
      subject: 'Reset Your Password',
      text: `
You requested a password reset for your account.

To reset your password, please use the following code: ${resetCode}

Or click the link below:
${resetLink}

If you didn't request this password reset, you can safely ignore this email.

This link will expire in 24 hours.
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Password Reset Request</h2>
          <p>You requested a password reset for your account.</p>
          
          <p>To reset your password, please use the following code:</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f7fafc; border-left: 4px solid #4299e1; font-family: monospace; font-size: 18px;">
            ${resetCode}
          </div>
          
          <p>Or click the button below:</p>
          <div style="margin: 20px 0;">
            <a href="${resetLink}" style="background-color: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
          
          <p style="margin-top: 20px; font-size: 12px; color: #718096;">
            This link will expire in 24 hours.
          </p>
        </div>
      `
    };

    // Send the email
    await mailService.send(emailContent);
    console.log(`Password reset email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

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
      from: 't.riddelsdell@gmail.com', // Using the same email as recipient, which should be verified in SendGrid
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