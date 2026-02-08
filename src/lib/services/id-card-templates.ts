import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface IDCardGenerationData {
    studentId: string;
    studentName: string;
    admissionId: string;
    schoolId?: string;
    className?: string;
    section?: string;
    rollNumber?: string;
    bloodGroup?: string;
    emergencyContact?: string;
    photoUrl?: string;
    validUntil?: Date;
    dob?: Date;
    fatherName?: string;
    motherName?: string;
    address?: string;
}

export interface SchoolSettingsData {
    schoolName: string;
    schoolAddress?: string;
    schoolPhone?: string;
    schoolEmail?: string;
    schoolLogo?: string;
    affiliationNumber?: string;
    schoolCode?: string;
    board?: string;
}

export interface IDCardTemplate {
    id: string;
    name: string;
    description: string;
    generate(doc: jsPDF, data: IDCardGenerationData, schoolSettings: SchoolSettingsData, academicYear: string): Promise<void>;
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(data: string): Promise<string> {
    try {
        return await QRCode.toDataURL(data, {
            width: 150,
            margin: 1,
            errorCorrectionLevel: 'H',
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Standard ID Card Template
 * (The original design)
 */
export class StandardTemplate implements IDCardTemplate {
    id = 'STANDARD';
    name = 'Standard Template';
    description = 'Default ID card design with basic details';

    async generate(doc: jsPDF, data: IDCardGenerationData, schoolSettings: SchoolSettingsData, academicYear: string): Promise<void> {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const cardWidth = 85.6;
        const cardHeight = 53.98;

        // Center the card
        const startX = (pageWidth - cardWidth) / 2;
        const startY = (pageHeight - cardHeight) / 2;

        // Draw ID card border
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(startX, startY, cardWidth, cardHeight);

        // Add school header background
        doc.setFillColor(41, 128, 185); // Blue color
        doc.rect(startX, startY, cardWidth, 12, 'F');

        // Add school name
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolSettings.schoolName.toUpperCase(), startX + cardWidth / 2, startY + 5, { align: 'center' });
        doc.setFontSize(7);
        doc.text('STUDENT ID CARD', startX + cardWidth / 2, startY + 9, { align: 'center' });

        // Add student photo (if available)
        const photoX = startX + 5;
        const photoY = startY + 15;
        const photoWidth = 20;
        const photoHeight = 25;

        if (data.photoUrl) {
            try {
                doc.addImage(data.photoUrl, 'JPEG', photoX, photoY, photoWidth, photoHeight);
            } catch (error) {
                console.warn('Failed to add student photo:', error);
                this.drawPhotoPlaceholder(doc, photoX, photoY, photoWidth, photoHeight);
            }
        } else {
            this.drawPhotoPlaceholder(doc, photoX, photoY, photoWidth, photoHeight);
        }

        // Add student details
        const detailsX = photoX + photoWidth + 3;
        const detailsY = photoY;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(data.studentName.toUpperCase(), detailsX, detailsY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        let currentY = detailsY + 4;

        if (data.className) {
            doc.text(`Class: ${data.className}${data.section ? ` - ${data.section}` : ''}`, detailsX, currentY);
            currentY += 3.5;
        }

        if (data.rollNumber) {
            doc.text(`Roll No: ${data.rollNumber}`, detailsX, currentY);
            currentY += 3.5;
        }

        doc.text(`ID: ${data.admissionId}`, detailsX, currentY);
        currentY += 3.5;

        if (data.bloodGroup) {
            doc.text(`Blood: ${data.bloodGroup}`, detailsX, currentY);
            currentY += 3.5;
        }

        if (data.emergencyContact) {
            doc.setFontSize(6);
            doc.text(`Emergency: ${data.emergencyContact}`, detailsX, currentY);
        }

        // Generate and add QR code
        const qrCodeData = await generateQRCode(
            JSON.stringify({
                studentId: data.studentId,
                admissionId: data.admissionId,
                name: data.studentName,
            })
        );

        const qrSize = 15;
        const qrX = startX + 5;
        const qrY = startY + cardHeight - qrSize - 3;

        doc.addImage(qrCodeData, 'PNG', qrX, qrY, qrSize, qrSize);

        // Add barcode as text (simplified approach for server-side rendering)
        doc.setFontSize(7);
        doc.setFont('courier', 'bold');
        const barcodeX = startX + cardWidth - 30;
        const barcodeY = startY + cardHeight - 8;

        // Add barcode label
        doc.setFontSize(5);
        doc.setTextColor(100, 100, 100);
        doc.text('ID:', barcodeX - 5, barcodeY - 2);

        // Add barcode value
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text(data.admissionId, barcodeX, barcodeY);

        // Add visual barcode representation (simple bars)
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        let barX = barcodeX;
        for (let i = 0; i < data.admissionId.length; i++) {
            const charCode = data.admissionId.charCodeAt(i);
            if (charCode % 2 === 0) {
                doc.line(barX, barcodeY + 1, barX, barcodeY + 5);
            }
            barX += 1.5;
        }

        // Validity and Academic Year
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        const validUntil = data.validUntil || new Date(new Date().getFullYear() + 1, 3, 31); // Default to March 31st next year
        doc.text(
            `Valid Until: ${validUntil.toLocaleDateString()}`,
            startX + cardWidth / 2,
            startY + cardHeight - 1,
            { align: 'center' }
        );

        doc.text(
            `Academic Year: ${academicYear}`,
            startX + cardWidth / 2,
            startY + 13.5,
            { align: 'center' }
        );
    }

    private drawPhotoPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number) {
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, w, h);
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text('No Photo', x + w / 2, y + h / 2, { align: 'center' });
    }
}

/**
 * CBSE Template
 * Includes Affiliation No, School Code, and more detailed student info
 */
export class CBSETemplate implements IDCardTemplate {
    id = 'CBSE';
    name = 'CBSE/Board Template';
    description = 'Formal design with Affiliation No and School Code';

    async generate(doc: jsPDF, data: IDCardGenerationData, schoolSettings: SchoolSettingsData, academicYear: string): Promise<void> {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const cardWidth = 85.6;
        const cardHeight = 53.98;

        // Center the card
        const startX = (pageWidth - cardWidth) / 2;
        const startY = (pageHeight - cardHeight) / 2;

        // Draw ID card border
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(startX, startY, cardWidth, cardHeight);

        // --- Header Section ---
        // Header Logic: Logo on left, Name centered, Address/Affiliation below

        // Header Background
        doc.setFillColor(255, 220, 180); // Light orange/cream for CBSE look
        doc.rect(startX, startY, cardWidth, 16, 'F');

        // School Name
        doc.setTextColor(100, 0, 0); // Dark red
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolSettings.schoolName.toUpperCase(), startX + cardWidth / 2, startY + 5, { align: 'center' });

        // Address & Affiliation Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');

        let subHeaderText = schoolSettings.schoolAddress ? schoolSettings.schoolAddress.split(',')[0] : ''; // Truncate address if long
        if (schoolSettings.affiliationNumber) {
            subHeaderText += ` | Affiliation No: ${schoolSettings.affiliationNumber}`;
        }
        if (schoolSettings.schoolCode) {
            subHeaderText += ` | School Code: ${schoolSettings.schoolCode}`;
        }

        doc.text(subHeaderText, startX + cardWidth / 2, startY + 8, { align: 'center' });

        // Header separator
        doc.setDrawColor(200, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(startX, startY + 16, startX + cardWidth, startY + 16);

        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('IDENTITY CARD', startX + cardWidth / 2, startY + 14.5, { align: 'center' });


        // --- Student Photo ---
        const photoX = startX + 4;
        const photoY = startY + 19;
        const photoWidth = 22;
        const photoHeight = 26;

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        // Border for photo
        doc.rect(photoX - 0.5, photoY - 0.5, photoWidth + 1, photoHeight + 1);

        if (data.photoUrl) {
            try {
                doc.addImage(data.photoUrl, 'JPEG', photoX, photoY, photoWidth, photoHeight);
            } catch (error) {
                this.drawPhotoPlaceholder(doc, photoX, photoY, photoWidth, photoHeight);
            }
        } else {
            this.drawPhotoPlaceholder(doc, photoX, photoY, photoWidth, photoHeight);
        }

        // --- Student Details ---
        const labelX = photoX + photoWidth + 4;
        const valueX = labelX + 22; // Align values
        let currentY = startY + 21;
        const lineHeight = 3.5;

        doc.setFontSize(7);

        const addField = (label: string, value: string | undefined) => {
            if (!value) return;
            doc.setFont('helvetica', 'normal');
            doc.text(label, labelX, currentY);
            doc.setFont('helvetica', 'bold');
            doc.text(`:  ${value.substring(0, 25)}`, valueX - 2, currentY); // Truncate if too long
            currentY += lineHeight;
        };

        addField('Name', data.studentName.toUpperCase());
        addField('Class', `${data.className || ''} ${data.section || ''}`);
        addField('Admission No', data.admissionId);
        if (data.dob) addField('D.O.B', new Date(data.dob).toLocaleDateString());
        if (data.fatherName) addField("Father's Name", data.fatherName);
        addField('Contact', data.emergencyContact || schoolSettings.schoolPhone);
        addField('Address', data.address ? data.address.substring(0, 30) : ''); // Brief address

        // --- Footer / Principal Signature space ---
        const footerY = startY + cardHeight - 8;

        // Uploaded Signature or Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.text('Principal Signature', startX + cardWidth - 15, footerY + 5, { align: 'center' });

        // Valid Upto
        const validUntil = data.validUntil || new Date(new Date().getFullYear() + 1, 3, 31);
        doc.text(`Valid Upto: ${validUntil.toLocaleDateString()}`, startX + 10, footerY + 5);

        // Academic Year relative
        doc.text(`Session: ${academicYear}`, startX + cardWidth / 2, footerY + 5, { align: 'center' });

        // Bottom stripe
        doc.setFillColor(100, 0, 0);
        doc.rect(startX, startY + cardHeight - 2, cardWidth, 2, 'F');
    }

    private drawPhotoPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number) {
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, w, h);
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text('PHOTO', x + w / 2, y + h / 2, { align: 'center' });
    }
}

export const ID_CARD_TEMPLATES: Record<string, IDCardTemplate> = {
    'STANDARD': new StandardTemplate(),
    'CBSE': new CBSETemplate(),
};
