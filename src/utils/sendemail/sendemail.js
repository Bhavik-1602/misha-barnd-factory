import nodemailer from 'nodemailer';
import validator from 'validator'; // For email validation

/**
 * Send email with improved functionality for HTML content
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} content - Email content (text or HTML)
 * @param {boolean} isHtml - Whether the content is HTML (default: true)
 * @returns {Promise<boolean>} - Promise that resolves when email is sent
 */
const sendEmail = async (to, subject, content, isHtml = true) => {
  try {
    // Validate email address
    if (!validator.isEmail(to)) {
      throw new Error(`Invalid email address: ${to}`);
    }

    // Create transporter with Gmail SMTP configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail with 2FA
      },
    });

    // Configure mail options
    const mailOptions = {
      from: `"Misha Brands Factory" <${process.env.EMAIL_FROM}>`, // Proper formatting for sender
      to,
      subject,
      [isHtml ? 'html' : 'text']: content, // Set content based on isHtml flag
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

export default sendEmail;