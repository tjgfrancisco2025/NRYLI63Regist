// Email service using Resend (recommended)
// Install: npm install resend

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConfirmationEmail(registrationData) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'NRYLI Registration <noreply@yourfirm.com>',
      to: [registrationData.delegate_email],
      subject: `Registration Confirmation - ${registrationData.registration_id}`,
      html: generateEmailTemplate(registrationData),
    });

    if (error) {
      console.error('Email sending error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
}

function generateEmailTemplate(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>NRYLI Registration Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .info-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #2a5298; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .registration-id { background: #e8f4f8; padding: 15px; border-radius: 5px; font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>63rd National Rizal Youth Leadership Institute</h1>
          <p>Registration Confirmation</p>
        </div>
        
        <div class="content">
          <h2>Dear ${data.first_name} ${data.surname},</h2>
          
          <p>Thank you for registering for the 63rd National Rizal Youth Leadership Institute. Your registration has been successfully submitted and is currently being processed.</p>
          
          <div class="registration-id">
            Registration ID: ${data.registration_id}
          </div>
          
          <div class="info-section">
            <h3>Registration Details</h3>
            <p><strong>Delegate Type:</strong> ${data.delegate_type}</p>
            <p><strong>Institution:</strong> ${data.institution}</p>
            <p><strong>Region Cluster:</strong> ${data.region_cluster}</p>
            <p><strong>Contact Number:</strong> ${data.delegate_contact}</p>
            <p><strong>Email:</strong> ${data.delegate_email}</p>
            <p><strong>T-shirt Size:</strong> ${data.tshirt_size}</p>
            <p><strong>Payment Method:</strong> ${data.payment_option}</p>
          </div>
          
          <div class="info-section">
            <h3>Next Steps</h3>
            <ul>
              <li>Your registration is currently being reviewed</li>
              <li>You will receive an email confirmation within 24-48 hours</li>
              <li>Please keep your Registration ID for future reference</li>
              <li>For any inquiries, contact us at nryli2025@example.com</li>
            </ul>
          </div>
          
          <p>We look forward to your participation in the 63rd NRYLI!</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2025 National Rizal Youth Leadership Institute</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Alternative: Using EmailJS for client-side email sending
export function sendEmailWithEmailJS(templateParams) {
  // Install: npm install @emailjs/browser
  // Configure EmailJS service in your account
  
  const emailjs = require('@emailjs/browser');
  
  return emailjs.send(
    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
    templateParams,
    process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
  );
}