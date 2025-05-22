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
    
    // Get the host URL for the password reset link based on environment
    // Use production URL if deployed, otherwise fall back to development
    const hostUrl = process.env.REPLIT_DEPLOYMENT_URL || 
                    'https://tomriddelsdell.replit.app';
    
    // Form the reset link - this will now work in both development and production
    const resetLink = `${hostUrl}/reset-password?code=${resetCode}&email=${encodeURIComponent(email)}`;
    
    // Construct the email content
    const emailContent = {
      to: email,
      from: 't.riddelsdell@gmail.com', // Must be verified in SendGrid
      subject: 'Reset Your Password',
      trackingSettings: {
        clickTracking: {
          enable: false,
          enableText: false
        },
        openTracking: {
          enable: false
        },
        subscriptionTracking: {
          enable: false
        }
      },
      text: `
You requested a password reset for your account.

To reset your password, please copy and paste this link into your browser:
${resetLink}

Or use this confirmation code: ${resetCode}

If you didn't request this password reset, you can safely ignore this email.

This link will expire in 24 hours.
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Password Reset Request</h2>
          <p>You requested a password reset for your account.</p>
          
          <p><strong>Copy and paste this link into your browser:</strong></p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f7fafc; border-left: 4px solid #4299e1; font-family: monospace; font-size: 12px; word-break: break-all;">
            ${resetLink}
          </div>
          
          <p>Or use this confirmation code: <strong>${resetCode}</strong></p>
          
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