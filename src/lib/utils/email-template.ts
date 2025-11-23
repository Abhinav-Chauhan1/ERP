import { SystemSettings } from "@prisma/client";

interface EmailTemplateOptions {
  subject: string;
  body: string;
  branding: SystemSettings | null;
}

/**
 * Generate a branded email HTML template
 */
export function generateBrandedEmail({
  subject,
  body,
  branding,
}: EmailTemplateOptions): string {
  const schoolName = branding?.schoolName || "School ERP";
  const logo = branding?.emailLogo || branding?.logoUrl || branding?.schoolLogo;
  const primaryColor = branding?.primaryColor || "#3b82f6";
  const footer = branding?.emailFooter || "";
  const signature = branding?.emailSignature || "";
  const address = branding?.schoolAddress || "";
  const phone = branding?.schoolPhone || "";
  const email = branding?.schoolEmail || "";
  const website = branding?.schoolWebsite || "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background-color: ${primaryColor};
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header img {
      max-height: 60px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
    .signature {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      font-style: italic;
      color: #666;
    }
    .contact-info {
      margin-top: 15px;
      line-height: 1.8;
    }
    .social-links {
      margin-top: 15px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 5px;
      color: ${primaryColor};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logo ? `<img src="${logo}" alt="${schoolName} Logo">` : ""}
      <h1>${schoolName}</h1>
    </div>
    <div class="content">
      ${body}
      ${
        signature
          ? `<div class="signature">${signature.replace(/\n/g, "<br>")}</div>`
          : ""
      }
    </div>
    <div class="footer">
      ${footer ? `<p>${footer.replace(/\n/g, "<br>")}</p>` : ""}
      <div class="contact-info">
        ${address ? `<p>${address.replace(/\n/g, "<br>")}</p>` : ""}
        ${phone ? `<p>Phone: ${phone}</p>` : ""}
        ${email ? `<p>Email: ${email}</p>` : ""}
        ${website ? `<p>Website: <a href="${website}">${website}</a></p>` : ""}
      </div>
      ${
        branding?.facebookUrl ||
        branding?.twitterUrl ||
        branding?.linkedinUrl ||
        branding?.instagramUrl
          ? `
        <div class="social-links">
          ${branding.facebookUrl ? `<a href="${branding.facebookUrl}">Facebook</a>` : ""}
          ${branding.twitterUrl ? `<a href="${branding.twitterUrl}">Twitter</a>` : ""}
          ${branding.linkedinUrl ? `<a href="${branding.linkedinUrl}">LinkedIn</a>` : ""}
          ${branding.instagramUrl ? `<a href="${branding.instagramUrl}">Instagram</a>` : ""}
        </div>
      `
          : ""
      }
      <p style="margin-top: 15px; color: #999;">
        © ${new Date().getFullYear()} ${schoolName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate a simple text email (fallback for clients that don't support HTML)
 */
export function generatePlainTextEmail({
  subject,
  body,
  branding,
}: EmailTemplateOptions): string {
  const schoolName = branding?.schoolName || "School ERP";
  const footer = branding?.emailFooter || "";
  const signature = branding?.emailSignature || "";
  const address = branding?.schoolAddress || "";
  const phone = branding?.schoolPhone || "";
  const email = branding?.schoolEmail || "";
  const website = branding?.schoolWebsite || "";

  return `
${schoolName}
${subject}

${body}

${signature ? `\n${signature}\n` : ""}

---
${footer ? `${footer}\n` : ""}
${address ? `${address}\n` : ""}
${phone ? `Phone: ${phone}\n` : ""}
${email ? `Email: ${email}\n` : ""}
${website ? `Website: ${website}\n` : ""}

© ${new Date().getFullYear()} ${schoolName}. All rights reserved.
  `.trim();
}
