/**
 * Password Setup Email Template
 * 
 * Email template for users migrated from Clerk to NextAuth v5.
 * Provides instructions and a secure link for setting up their password.
 * 
 * Requirements: 14.5
 */

export interface PasswordSetupEmailData {
  firstName: string;
  lastName: string;
  email: string;
  setupLink: string;
  expiresInHours: number;
  role: string;
}

/**
 * Generate HTML email for password setup
 */
export function generatePasswordSetupEmail(data: PasswordSetupEmailData): string {
  const { firstName, lastName, email, setupLink, expiresInHours, role } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Set Up Your Password - SikshaMitra</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .message {
      font-size: 15px;
      color: #4b5563;
      margin-bottom: 20px;
      line-height: 1.7;
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .info-box h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #1e40af;
    }
    .info-box p {
      margin: 5px 0;
      font-size: 14px;
      color: #1e3a8a;
    }
    .info-box strong {
      color: #1e40af;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 8px rgba(59, 130, 246, 0.4);
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .warning-box p {
      margin: 5px 0;
      font-size: 14px;
      color: #92400e;
    }
    .warning-box strong {
      color: #b45309;
    }
    .instructions {
      background-color: #f9fafb;
      padding: 20px;
      border-radius: 6px;
      margin: 25px 0;
    }
    .instructions h3 {
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #1f2937;
    }
    .instructions ol {
      margin: 0;
      padding-left: 20px;
    }
    .instructions li {
      margin: 10px 0;
      font-size: 14px;
      color: #4b5563;
    }
    .security-tips {
      background-color: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .security-tips h4 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #065f46;
    }
    .security-tips ul {
      margin: 0;
      padding-left: 20px;
    }
    .security-tips li {
      margin: 5px 0;
      font-size: 13px;
      color: #047857;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
      font-size: 13px;
      color: #6b7280;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .header {
        padding: 30px 20px;
      }
      .content {
        padding: 30px 20px;
      }
      .button {
        padding: 12px 24px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🔐 Set Up Your Password</h1>
      <p>Welcome to the new authentication system</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Hello ${firstName} ${lastName},
      </div>
      
      <div class="message">
        We've upgraded our authentication system to provide you with better security and control over your account. 
        As part of this upgrade, you need to set up a new password for your SikshaMitra account.
      </div>

      <div class="info-box">
        <h3>📋 Your Account Details</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> ${role}</p>
        <p><strong>Status:</strong> Active</p>
      </div>

      <div class="button-container">
        <a href="${setupLink}" class="button">Set Up Password</a>
      </div>

      <div class="warning-box">
        <p><strong>⏰ Important:</strong> This link will expire in <strong>${expiresInHours} hours</strong>.</p>
        <p>Please set up your password as soon as possible to avoid any interruption in accessing your account.</p>
      </div>

      <div class="instructions">
        <h3>📝 How to Set Up Your Password</h3>
        <ol>
          <li>Click the "Set Up Password" button above</li>
          <li>You'll be redirected to a secure password setup page</li>
          <li>Enter a strong password that meets our security requirements</li>
          <li>Confirm your password and submit</li>
          <li>You'll be able to log in immediately with your new password</li>
        </ol>
      </div>

      <div class="security-tips">
        <h4>🛡️ Password Security Tips</h4>
        <ul>
          <li>Use at least 8 characters</li>
          <li>Include uppercase and lowercase letters</li>
          <li>Add numbers and special characters</li>
          <li>Avoid using personal information</li>
          <li>Don't reuse passwords from other accounts</li>
          <li>Consider using a password manager</li>
        </ul>
      </div>

      <div class="divider"></div>

      <div class="message">
        <strong>Need Help?</strong><br>
        If you have any questions or encounter any issues, please contact our support team. 
        We're here to help make this transition as smooth as possible.
      </div>

      <div class="message">
        <strong>Didn't request this?</strong><br>
        If you didn't expect this email, please contact our support team immediately. 
        This is part of a system-wide upgrade, and all users are required to set up new passwords.
      </div>
    </div>
    
    <div class="footer">
      <p><strong>SikshaMitra</strong></p>
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>If you need assistance, please contact support.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        © ${new Date().getFullYear()} SikshaMitra. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of password setup email
 */
export function generatePasswordSetupEmailText(data: PasswordSetupEmailData): string {
  const { firstName, lastName, email, setupLink, expiresInHours, role } = data;

  return `
Set Up Your Password - SikshaMitra

Hello ${firstName} ${lastName},

We've upgraded our authentication system to provide you with better security and control over your account. As part of this upgrade, you need to set up a new password for your SikshaMitra account.

YOUR ACCOUNT DETAILS
Email: ${email}
Role: ${role}
Status: Active

SET UP YOUR PASSWORD
Click the link below to set up your password:
${setupLink}

IMPORTANT: This link will expire in ${expiresInHours} hours.
Please set up your password as soon as possible to avoid any interruption in accessing your account.

HOW TO SET UP YOUR PASSWORD
1. Click the link above
2. You'll be redirected to a secure password setup page
3. Enter a strong password that meets our security requirements
4. Confirm your password and submit
5. You'll be able to log in immediately with your new password

PASSWORD SECURITY TIPS
- Use at least 8 characters
- Include uppercase and lowercase letters
- Add numbers and special characters
- Avoid using personal information
- Don't reuse passwords from other accounts
- Consider using a password manager

NEED HELP?
If you have any questions or encounter any issues, please contact our support team. We're here to help make this transition as smooth as possible.

DIDN'T REQUEST THIS?
If you didn't expect this email, please contact our support team immediately. This is part of a system-wide upgrade, and all users are required to set up new passwords.

---
SikshaMitra
This is an automated email. Please do not reply to this message.
If you need assistance, please contact support.

© ${new Date().getFullYear()} SikshaMitra. All rights reserved.
  `.trim();
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    ADMIN: 'Administrator',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
    PARENT: 'Parent',
  };
  return roleMap[role] || role;
}
