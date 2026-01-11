import { SystemSettings } from "@prisma/client";

interface DocumentHeaderOptions {
  branding: SystemSettings | null;
  title?: string;
  includeLetterhead?: boolean;
}

/**
 * Generate HTML for document header with school branding
 */
export function generateDocumentHeader({
  branding,
  title,
  includeLetterhead = true,
}: DocumentHeaderOptions): string {
  const schoolName = branding?.schoolName || "SikshaMitra";
  const logo = branding?.letterheadLogo || branding?.logoUrl || branding?.schoolLogo;
  const letterheadText = branding?.letterheadText || "";
  const address = branding?.schoolAddress || "";
  const phone = branding?.schoolPhone || "";
  const email = branding?.schoolEmail || "";
  const website = branding?.schoolWebsite || "";

  if (!includeLetterhead) {
    return `
      <div style="text-align: center; margin-bottom: 30px;">
        ${logo ? `<img src="${logo}" alt="${schoolName}" style="max-height: 80px; margin-bottom: 10px;">` : ""}
        <h1 style="margin: 10px 0; font-size: 28px; color: #333;">${schoolName}</h1>
        ${title ? `<h2 style="margin: 10px 0; font-size: 20px; color: #666;">${title}</h2>` : ""}
      </div>
    `;
  }

  return `
    <div style="border-bottom: 3px solid ${branding?.primaryColor || "#3b82f6"}; padding-bottom: 20px; margin-bottom: 30px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        ${logo
      ? `<img src="${logo}" alt="${schoolName}" style="max-height: 80px;">`
      : ""
    }
        <div style="text-align: ${logo ? "right" : "center"}; flex: 1;">
          <h1 style="margin: 0; font-size: 28px; color: #333; font-weight: bold;">${schoolName}</h1>
          ${letterheadText ? `<p style="margin: 5px 0; font-size: 14px; color: #666;">${letterheadText}</p>` : ""}
          <div style="margin-top: 10px; font-size: 12px; color: #666; line-height: 1.6;">
            ${address ? `<div>${address.replace(/\n/g, ", ")}</div>` : ""}
            ${phone || email || website ? `<div>${[phone, email, website].filter(Boolean).join(" | ")}</div>` : ""}
          </div>
        </div>
      </div>
      ${title ? `<h2 style="text-align: center; margin: 20px 0 0 0; font-size: 22px; color: #333;">${title}</h2>` : ""}
    </div>
  `;
}

/**
 * Generate HTML for document footer with school branding
 */
export function generateDocumentFooter({
  branding,
}: {
  branding: SystemSettings | null;
}): string {
  const schoolName = branding?.schoolName || "SikshaMitra";
  const footer = branding?.documentFooter || "";
  const website = branding?.schoolWebsite || "";

  return `
    <div style="border-top: 2px solid ${branding?.primaryColor || "#3b82f6"}; padding-top: 15px; margin-top: 40px; text-align: center; font-size: 11px; color: #666;">
      ${footer ? `<p style="margin: 5px 0;">${footer.replace(/\n/g, "<br>")}</p>` : ""}
      <p style="margin: 5px 0;">
        ${website ? `<a href="${website}" style="color: ${branding?.primaryColor || "#3b82f6"}; text-decoration: none;">${website}</a> | ` : ""}
        © ${new Date().getFullYear()} ${schoolName}. All rights reserved.
      </p>
    </div>
  `;
}

/**
 * Generate CSS styles for branded documents
 */
export function generateDocumentStyles(branding: SystemSettings | null): string {
  const primaryColor = branding?.primaryColor || "#3b82f6";
  const secondaryColor = branding?.secondaryColor || "#8b5cf6";

  return `
    <style>
      @page {
        margin: 2cm;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .primary-color {
        color: ${primaryColor};
      }
      .secondary-color {
        color: ${secondaryColor};
      }
      .bg-primary {
        background-color: ${primaryColor};
        color: white;
      }
      .bg-secondary {
        background-color: ${secondaryColor};
        color: white;
      }
      .border-primary {
        border-color: ${primaryColor};
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      th {
        background-color: ${primaryColor};
        color: white;
        padding: 12px;
        text-align: left;
        font-weight: 600;
      }
      td {
        padding: 10px 12px;
        border-bottom: 1px solid #e9ecef;
      }
      tr:hover {
        background-color: #f8f9fa;
      }
      .signature-line {
        border-top: 2px solid #333;
        width: 200px;
        margin-top: 60px;
        padding-top: 5px;
        text-align: center;
      }
    </style>
  `;
}
