import sendEmail from '../sendemail/sendemail.js';
import { base } from './baseTemplate.js';

class EmailTemplates {
  /**
   * Get the base HTML template with the provided content
   * @param {string} content - The main email content in HTML
   * @returns {string} Complete HTML email template
   */
  static getBaseTemplate(content) {
    return base(content);
  }

  /**
   * Send email verification OTP
   * @param {Object} user - User object with email and name
   * @param {string} otp - The OTP code to be sent
   * @returns {Promise<boolean>} - Promise that resolves when email is sent
   */
  static async sendVerificationOTP(user, otp) {
    const subject = 'Verify Your Email - OTP';

    const content = `
      <h2>Email Verification</h2>
      
      <p>Hi <b>${user.fullName || ''}</b>,</p>
      
      <p>Thank you for registering with Misha Brands Factory! Please use the following OTP to verify your email address:</p>
      
      <div style="text-align: center; margin: 30px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
        ${otp}
      </div>
      
      <p>This OTP will expire in <strong>30 minutes</strong>.</p>
      
      <p>If you didn't request this verification, please ignore this email.</p>
      
      <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 20px;"></div>
      
      <p>Best Regards,<br>Misha Brands Factory Team</p>
    `;

    try {
      await sendEmail(user.email, subject, this.getBaseTemplate(content), true);
      console.log(`Verification OTP email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Verification OTP email send failed:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} content - Email content in HTML
   * @param {boolean} isHtml - Whether the content is HTML
   * @returns {Promise<boolean>} - Promise that resolves when email is sent
   */
  static async sendPasswordResetEmail(email, subject, content, isHtml = true) {
    try {
      await sendEmail(email, subject, this.getBaseTemplate(content), isHtml);
      console.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Password reset email send failed:', error);
      throw error;
    }
  }

  /**
   * Send a password change confirmation email
   * @param {Object} user - User object with email and name
   * @returns {Promise<boolean>} - Promise that resolves when email is sent
   */
  static async sendPasswordChangedEmail(user) {
    const subject = 'Your Password Has Been Changed';

    const content = `
      <h2>Password Changed</h2>
      
      <p>Hi <b>${user.firstName || user.fullName || ''}</b>,</p>
      
      <p>Your password has been successfully changed.</p>
      
      <p>If you did not change your password, please contact our support team immediately as your account may have been compromised.</p>
      
      <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 20px;"></div>
      
      <p>Best Regards,<br>Admin Team</p>
    `;

    try {
      await sendEmail(user.email, subject, this.getBaseTemplate(content), true);
      console.log(`Password changed email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Password changed email send failed:', error);
      throw error;
    }
  }

  /**
   * Send account verification confirmation email
   * @param {Object} user - User object with email and name
   * @returns {Promise<boolean>} - Promise that resolves when email is sent
   */
  static async sendAccountVerifiedEmail(user) {
    const subject = 'Account Verified Successfully';

    const content = `
      <h2>🎉 Account Verified!</h2>
      
      <p>Hi <b>${user.fullName || ''}</b>,</p>
      
      <p>Great news! Your account has been successfully verified by our admin team.</p>
      
      <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #e8f5e8; border-radius: 8px; border-left: 4px solid #4CAF50;">
        <p style="margin: 0; color: #4CAF50; font-weight: bold; font-size: 18px;">✓ Account Verified</p>
        <p style="margin: 5px 0 0 0; color: #666;">You can now access all features of your account</p>
      </div>
      
      <p>You now have full access to all the features and services available to your account type: <strong>${user.role}</strong>.</p>
      
      <p>Welcome to the Misha Brands Factory community!</p>
      
      <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 20px;"></div>
      
      <p>Best Regards,<br>Misha Brands Factory Team</p>
    `;

    try {
      await sendEmail(user.email, subject, this.getBaseTemplate(content), true);
      console.log(`Account verified email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Account verified email send failed:', error);
      throw error;
    }
  }

  /**
   * Send account unverification notification email
   * @param {Object} user - User object with email and name
   * @param {string} reason - Optional reason for unverification
   * @returns {Promise<boolean>} - Promise that resolves when email is sent
   */
  static async sendAccountUnverifiedEmail(user, reason = '') {
    const subject = 'Account Verification Status Updated';

    const content = `
      <h2>Account Verification Status Changed</h2>
      
      <p>Hi <b>${user.fullName || ''}</b>,</p>
      
      <p>We're writing to inform you that your account verification status has been updated.</p>
      
      <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
        <p style="margin: 0; color: #856404; font-weight: bold; font-size: 18px;">⚠ Account Unverified</p>
        <p style="margin: 5px 0 0 0; color: #666;">Your account verification has been removed</p>
      </div>
      
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      
      <p>This means that some features and services may be temporarily restricted until your account is re-verified.</p>
      
      <p>If you believe this is an error or if you have any questions, please contact our support team immediately.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <p>Need help? Contact our support team:</p>
        <p><strong>Email:</strong> support@Misha Brands Factory.com</p>
      </div>
      
      <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 20px;"></div>
      
      <p>Best Regards,<br>Misha Brands Factory Team</p>
    `;

    try {
      await sendEmail(user.email, subject, this.getBaseTemplate(content), true);
      console.log(`Account unverified email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Account unverified email send failed:', error);
      throw error;
    }
  }

  /**
   * Send account activation confirmation email
   * @param {Object} user - User object with email and name
   * @returns {Promise<boolean>} - Promise that resolves when email is sent
   */
  static async sendAccountActivatedEmail(user) {
    const subject = 'Account Activated Successfully';

    const content = `
      <h2>🎉 Account Activated!</h2>
      
      <p>Hi <b>${user.fullName || ''}</b>,</p>
      
      <p>Your account has been successfully activated!</p>
      
      <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #e8f5e8; border-radius: 8px; border-left: 4px solid #4CAF50;">
        <p style="margin: 0; color: #4CAF50; font-weight: bold; font-size: 18px;">✓ Account Active</p>
        <p style="margin: 5px 0 0 0; color: #666;">You can now log in and use your account</p>
      </div>
      
      <p>You can now log in and access all the features available to your account.</p>
      
      <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 20px;"></div>
      
      <p>Best Regards,<br>Misha Brands Factory Team</p>
    `;

    try {
      await sendEmail(user.email, subject, this.getBaseTemplate(content), true);
      console.log(`Account activated email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Account activated email send failed:', error);
      throw error;
    }
  }

  /**
   * Send account deactivation notification email
   * @param {Object} user - User object with email and name
   * @param {string} reason - Optional reason for deactivation
   * @returns {Promise<boolean>} - Promise that resolves when email is sent
   */
  static async sendAccountDeactivatedEmail(user, reason = '') {
    const subject = 'Account Deactivated';

    const content = `
      <h2>Account Status Update</h2>
      
      <p>Hi <b>${user.fullName || ''}</b>,</p>
      
      <p>We're writing to inform you that your account has been deactivated.</p>
      
      <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8d7da; border-radius: 8px; border-left: 4px solid #dc3545;">
        <p style="margin: 0; color: #721c24; font-weight: bold; font-size: 18px;">⚠ Account Deactivated</p>
        <p style="margin: 5px 0 0 0; color: #666;">Your account access has been temporarily suspended</p>
      </div>
      
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      
      <p>You will not be able to log in or access your account until it is reactivated.</p>
      
      <p>If you believe this is an error or if you have any questions, please contact our support team.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <p>Need help? Contact our support team:</p>
        <p><strong>Email:</strong> support@Misha Brands Factory.com</p>
      </div>
      
      <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 20px;"></div>
      
      <p>Best Regards,<br>Misha Brands Factory Team</p>
    `;

    try {
      await sendEmail(user.email, subject, this.getBaseTemplate(content), true);
      console.log(`Account deactivated email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Account deactivated email send failed:', error);
      throw error;
    }
  }

  /**
   * Send contact form confirmation email to user
   * @param {Object} contact - Contact object with form details
   * @returns {Promise<boolean>} - Promise that resolves when email is sent
   */
  static async sendContactConfirmationEmail(contact) {
    const subject = 'Thank you for contacting us - Misha Brands Factory';

    const getTypeDisplay = (type) => {
      const types = {
        'contact_us': 'General Inquiry',
        'grievance': 'Grievance',
        'suggestion': 'Suggestion',
        'rti': 'RTI Request'
      };
      return types[type] || 'Contact';
    };

    const getPriorityDisplay = (priority) => {
      const priorities = {
        'low': { text: 'Low', color: '#28a745', bgColor: '#d4edda' },
        'medium': { text: 'Medium', color: '#ffc107', bgColor: '#fff3cd' },
        'high': { text: 'High', color: '#fd7e14', bgColor: '#ffeaa7' },
        'urgent': { text: 'Urgent', color: '#dc3545', bgColor: '#f8d7da' }
      };
      return priorities[priority] || priorities['medium'];
    };

    const typeDisplay = getTypeDisplay(contact.type);
    const priorityInfo = getPriorityDisplay(contact.priority);

    const content = `
      <h2>Thank You for Contacting Us!</h2>
      
      <p>Dear <b>${contact.name}</b>,</p>
      
      <p>Thank you for reaching out to Misha Brands Factory. We have successfully received your message and our team will review it shortly.</p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #007bff;">
        <h3 style="margin-top: 0; color: #007bff;">Message Details</h3>
        
        <div style="margin-bottom: 15px;">
          <strong>Contact Type:</strong> ${typeDisplay}
        </div>
        
        ${contact.subject ? `
        <div style="margin-bottom: 15px;">
          <strong>Subject:</strong> ${contact.subject}
        </div>
        ` : ''}
        
        <div style="margin-bottom: 15px;">
          <strong>Priority:</strong> 
          <span style="background-color: ${priorityInfo.bgColor}; color: ${priorityInfo.color}; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${priorityInfo.text}
          </span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Phone:</strong> ${contact.phoneNumber}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Email:</strong> ${contact.email}
        </div>
        
        ${contact.attachments && contact.attachments.length > 0 ? `
        <div style="margin-bottom: 15px;">
          <strong>Attachments:</strong> ${contact.attachments.length} file(s) attached
        </div>
        ` : ''}
        
        <div>
          <strong>Message:</strong>
          <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 8px; border: 1px solid #dee2e6;">
            ${contact.message.replace(/\n/g, '<br>')}
          </div>
        </div>
      </div>
      
      <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #4CAF50;">
        <h3 style="margin-top: 0; color: #4CAF50;">What happens next?</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Our team will review your message within 24-48 hours</li>
          <li>You will receive a response based on the priority level of your inquiry</li>
          <li>For urgent matters, we aim to respond within 2-4 hours during business hours</li>
          <li>You can reference this message using your contact details if needed</li>
        </ul>
      </div>
      
      <p><strong>Reference Information:</strong></p>
      <ul>
        <li><strong>Submitted:</strong> ${new Date(contact.createdAt).toLocaleString()}</li>
        <li><strong>Contact ID:</strong> ${contact._id}</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <p>Need immediate assistance? Contact us:</p>
        <p><strong>Email:</strong> support@Misha Brands Factory.com</p>
        <p><strong>Phone:</strong> +91-XXXXXXXXXX</p>
      </div>
      
      <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 20px;"></div>
      
      <p>Thank you for choosing Misha Brands Factory!</p>
      <p>Best Regards,<br>Misha Brands Factory Sports Support Team</p>
    `;

    try {
      await sendEmail(contact.email, subject, this.getBaseTemplate(content), true);
      console.log(`Contact confirmation email sent to ${contact.email}`);
      return true;
    } catch (error) {
      console.error('Contact confirmation email send failed:', error);
      throw error;
    }
  }

  /**
   * Send contact form notification email to admin
   * @param {Object} contact - Contact object with form details
   * @returns {Promise<boolean>} - Promise that resolves when email is sent
   */
  static async sendContactNotificationEmail(contact) {
    const adminEmail = 'admin1@.com';
    const subject = `New ${contact.type.replace('_', ' ').toUpperCase()} - ${contact.name}`;

    const getTypeDisplay = (type) => {
      const types = {
        'contact_us': 'General Inquiry',
        'grievance': 'Grievance',
        'suggestion': 'Suggestion',
        'rti': 'RTI Request'
      };
      return types[type] || 'Contact';
    };

    const getPriorityDisplay = (priority) => {
      const priorities = {
        'low': { text: 'Low', color: '#28a745', bgColor: '#d4edda' },
        'medium': { text: 'Medium', color: '#ffc107', bgColor: '#fff3cd' },
        'high': { text: 'High', color: '#fd7e14', bgColor: '#ffeaa7' },
        'urgent': { text: 'Urgent', color: '#dc3545', bgColor: '#f8d7da' }
      };
      return priorities[priority] || priorities['medium'];
    };

    const typeDisplay = getTypeDisplay(contact.type);
    const priorityInfo = getPriorityDisplay(contact.priority);

    const content = `
      <h2>🔔 New Contact Form Submission</h2>
      
      <div style="background-color: #fff3cd; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <p style="margin: 0; font-weight: bold; color: #856404;">
          ⚡ Priority: 
          <span style="background-color: ${priorityInfo.bgColor}; color: ${priorityInfo.color}; padding: 4px 10px; border-radius: 4px; font-size: 14px;">
            ${priorityInfo.text}
          </span>
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="margin-top: 0; color: #333;">Contact Information</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 150px;">Name:</td>
            <td style="padding: 8px 0;">${contact.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${contact.email}">${contact.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
            <td style="padding: 8px 0;"><a href="tel:${contact.phoneNumber}">${contact.phoneNumber}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Type:</td>
            <td style="padding: 8px 0;">${typeDisplay}</td>
          </tr>
          ${contact.subject ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Subject:</td>
            <td style="padding: 8px 0;">${contact.subject}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Submitted:</td>
            <td style="padding: 8px 0;">${new Date(contact.createdAt).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Contact ID:</td>
            <td style="padding: 8px 0; font-family: monospace; background-color: #e9ecef; padding: 2px 6px; border-radius: 3px;">${contact._id}</td>
          </tr>
        </table>
      </div>
      
      <div style="background-color: white; border: 2px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="margin-top: 0; color: #333;">Message</h3>
        <div style="line-height: 1.6; color: #555;">
          ${contact.message.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      ${contact.attachments && contact.attachments.length > 0 ? `
      <div style="background-color: #e8f4fd; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #007bff;">
        <h3 style="margin-top: 0; color: #007bff;">📎 Attachments (${contact.attachments.length})</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${contact.attachments.map(att => `
            <li style="margin-bottom: 8px;">
              <strong>${att.fileName}</strong> 
              <span style="color: #666; font-size: 14px;">(${(att.fileSize / 1024).toFixed(1)} KB)</span>
              <div style="font-size: 12px; color: #888;">Uploaded: ${new Date(att.uploadedAt).toLocaleString()}</div>
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 25px 0;">
        <h4 style="margin-top: 0; color: #666;">Technical Information</h4>
        <div style="font-size: 14px; color: #666;">
          <div><strong>IP Address:</strong> ${contact.ipAddress || 'Not available'}</div>
          <div><strong>User Agent:</strong> ${contact.userAgent || 'Not available'}</div>
          <div><strong>Source:</strong> ${contact.source || 'website'}</div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #fff3cd; border-radius: 8px;">
        <p style="margin: 0; font-weight: bold; color: #856404;">
          ${priorityInfo.text === 'Urgent' ? '🚨 This is an URGENT inquiry - Please respond immediately!' :
        priorityInfo.text === 'High' ? '⚠️ This is a HIGH priority inquiry - Please respond within 4 hours' :
          'Please respond according to our standard response time guidelines'}
        </p>
      </div>
      
      <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 20px;"></div>
      
      <p style="color: #666; font-size: 14px;">
        This notification was automatically generated from the Misha Brands Factory contact form.
        <br>Contact ID: ${contact._id}
      </p>
    `;

    try {
      await sendEmail(adminEmail, subject, this.getBaseTemplate(content), true);
      console.log(`Contact notification email sent to admin for contact ${contact._id}`);
      return true;
    } catch (error) {
      console.error('Contact notification email send failed:', error);
      throw error;
    }
  }
}

/**
 * Generate password reset email template
 * @param {string} name - User's name
 * @param {string} resetUrl - Password reset URL
 * @returns {string} HTML content for the email
 */
export function getPasswordResetTemplate(name, resetUrl) {
  return `
    <h2>Password Reset Request</h2>
    
    <p>Hi <b>${name || 'User'}</b>,</p>
    
    <p>We received a request to reset your password for your account.</p>
    
    <div style="text-align: left; margin: 30px 0;">
      <a href="${resetUrl}" class="cta-button button">Reset Password</a>
    </div>
    
    <p>This link will expire in <strong>30 minutes</strong>.</p>
    
    <p>If you didn't request a password reset, please ignore this email or contact support if you believe your account may be compromised.</p>
    
    <div class="divider"></div>
    
    <p>Best Regards,<br>Misha Brands Factory Team</p>
  `;
}

/**
 * Generate password change confirmation email template
 * @param {string} name - User's name
 * @param {boolean} isReset - Whether this is a reset or change confirmation
 * @returns {string} HTML content for the email
 */
export function getPasswordChangeTemplate(name, isReset) {
  return `
    <h2>${isReset ? 'Password Reset' : 'Password Changed'}</h2>
    
    <p>Hi <b>${name || 'User'}</b>,</p>
    
    <p>Your password has been successfully ${isReset ? 'reset' : 'changed'}.</p>
    
    <p>If you did not ${isReset ? 'reset' : 'change'} your password, please contact our support team immediately as your account may have been compromised.</p>
    
    <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 20px;"></div>
    
    <p>Best Regards,<br>Misha Brands Factory Team</p>
  `;
}

// Export the functions for use in your contact controller
export const sendContactConfirmationEmail = EmailTemplates.sendContactConfirmationEmail.bind(EmailTemplates);
export const sendContactNotificationEmail = EmailTemplates.sendContactNotificationEmail.bind(EmailTemplates);

export default EmailTemplates;