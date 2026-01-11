/**
 * Seed Certificate Templates
 * 
 * Creates default certificate templates for the system
 */

import { PrismaClient, CertificateType } from '@prisma/client';
import { DEFAULT_LAYOUTS, DEFAULT_STYLES, getDefaultTemplateContent } from '../src/lib/utils/certificate-template-utils';

const prisma = new PrismaClient();

async function seedCertificateTemplates() {
  console.log('🎓 Seeding certificate templates...');

  // Get or create an admin user for the createdBy field
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    console.log('⚠️  No admin user found. Please create an admin user first.');
    return;
  }

  const templates = [
    {
      name: 'Classic Achievement Certificate',
      description: 'A classic certificate template for recognizing student achievements',
      type: CertificateType.ACHIEVEMENT,
      category: 'Academic',
      layout: JSON.stringify(DEFAULT_LAYOUTS.classic),
      styling: JSON.stringify(DEFAULT_STYLES.classic),
      content: getDefaultTemplateContent('ACHIEVEMENT'),
      mergeFields: JSON.stringify([
        'studentName',
        'achievementTitle',
        'issueDate',
        'schoolName',
        'principalName',
        'certificateNumber',
      ]),
      pageSize: 'A4',
      orientation: 'LANDSCAPE',
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: 'Modern Completion Certificate',
      description: 'A modern certificate template for course completion',
      type: CertificateType.COMPLETION,
      category: 'Academic',
      layout: JSON.stringify(DEFAULT_LAYOUTS.modern),
      styling: JSON.stringify(DEFAULT_STYLES.modern),
      content: getDefaultTemplateContent('COMPLETION'),
      mergeFields: JSON.stringify([
        'studentName',
        'courseName',
        'grade',
        'academicYear',
        'certificateNumber',
        'issueDate',
      ]),
      pageSize: 'A4',
      orientation: 'LANDSCAPE',
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: 'Elegant Participation Certificate',
      description: 'An elegant certificate template for event participation',
      type: CertificateType.PARTICIPATION,
      category: 'Events',
      layout: JSON.stringify(DEFAULT_LAYOUTS.elegant),
      styling: JSON.stringify(DEFAULT_STYLES.elegant),
      content: getDefaultTemplateContent('PARTICIPATION'),
      mergeFields: JSON.stringify([
        'studentName',
        'eventName',
        'eventDate',
        'schoolName',
        'certificateNumber',
      ]),
      pageSize: 'A4',
      orientation: 'LANDSCAPE',
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: 'Merit Certificate',
      description: 'A certificate template for recognizing academic merit',
      type: CertificateType.MERIT,
      category: 'Academic',
      layout: JSON.stringify(DEFAULT_LAYOUTS.classic),
      styling: JSON.stringify({
        ...DEFAULT_STYLES.classic,
        primaryColor: '#059669',
        secondaryColor: '#10b981',
        borderColor: '#059669',
      }),
      content: getDefaultTemplateContent('MERIT'),
      mergeFields: JSON.stringify([
        'studentName',
        'courseName',
        'rank',
        'percentage',
        'academicYear',
        'certificateNumber',
      ]),
      pageSize: 'A4',
      orientation: 'LANDSCAPE',
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: 'Sports Achievement Certificate',
      description: 'A certificate template for sports achievements',
      type: CertificateType.ACHIEVEMENT,
      category: 'Sports',
      layout: JSON.stringify(DEFAULT_LAYOUTS.modern),
      styling: JSON.stringify({
        ...DEFAULT_STYLES.modern,
        primaryColor: '#dc2626',
        secondaryColor: '#ef4444',
        borderColor: '#dc2626',
      }),
      content: `
        <div style="text-align: center; padding: 2rem;">
          <h1 style="font-size: 3rem; margin-bottom: 1rem; color: #dc2626;">
            Sports Achievement Certificate
          </h1>
          <p style="font-size: 1.2rem; margin: 2rem 0;">
            This is to certify that
          </p>
          <h2 style="font-size: 2.5rem; margin: 1rem 0; color: #ef4444;">
            {{studentName}}
          </h2>
          <p style="font-size: 1.2rem; margin: 2rem 0;">
            has achieved
          </p>
          <h3 style="font-size: 2rem; margin: 1rem 0;">
            {{position}} in {{eventName}}
          </h3>
          <p style="font-size: 1rem; margin: 2rem 0;">
            held on {{eventDate}}
          </p>
          <p style="font-size: 0.9rem; margin-top: 3rem;">
            Certificate No: {{certificateNumber}}
          </p>
        </div>
      `,
      mergeFields: JSON.stringify([
        'studentName',
        'position',
        'eventName',
        'eventDate',
        'certificateNumber',
      ]),
      pageSize: 'A4',
      orientation: 'LANDSCAPE',
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    // Indian School Specific Certificates
    {
      name: 'Character Certificate',
      description: 'Character/Conduct certificate for students - commonly required in India',
      type: CertificateType.CHARACTER,
      category: 'Administrative',
      layout: JSON.stringify(DEFAULT_LAYOUTS.classic),
      styling: JSON.stringify({
        ...DEFAULT_STYLES.classic,
        primaryColor: '#1e40af',
        secondaryColor: '#3b82f6',
        borderColor: '#1e40af',
      }),
      content: getDefaultTemplateContent('CHARACTER'),
      mergeFields: JSON.stringify([
        'studentName',
        'fatherName',
        'className',
        'academicYear',
        'conduct',
        'character',
        'issueDate',
        'certificateNumber',
        'schoolName',
      ]),
      pageSize: 'A4',
      orientation: 'PORTRAIT',
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: 'Bonafide Certificate',
      description: 'Bonafide/Enrollment certificate to certify student is enrolled in school',
      type: CertificateType.BONAFIDE,
      category: 'Administrative',
      layout: JSON.stringify(DEFAULT_LAYOUTS.classic),
      styling: JSON.stringify({
        ...DEFAULT_STYLES.classic,
        primaryColor: '#0d9488',
        secondaryColor: '#14b8a6',
        borderColor: '#0d9488',
      }),
      content: getDefaultTemplateContent('BONAFIDE'),
      mergeFields: JSON.stringify([
        'studentName',
        'fatherName',
        'motherName',
        'admissionNumber',
        'className',
        'section',
        'academicYear',
        'dateOfBirth',
        'purpose',
        'issueDate',
        'certificateNumber',
        'schoolName',
      ]),
      pageSize: 'A4',
      orientation: 'PORTRAIT',
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
    {
      name: 'Transfer Certificate (TC)',
      description: 'Transfer Certificate - Official document for student transfer between schools',
      type: CertificateType.TRANSFER,
      category: 'Administrative',
      layout: JSON.stringify(DEFAULT_LAYOUTS.classic),
      styling: JSON.stringify({
        ...DEFAULT_STYLES.classic,
        primaryColor: '#7c2d12',
        secondaryColor: '#ea580c',
        borderColor: '#7c2d12',
      }),
      content: getDefaultTemplateContent('TRANSFER'),
      mergeFields: JSON.stringify([
        'certificateNumber',
        'admissionNumber',
        'studentName',
        'fatherName',
        'motherName',
        'dateOfBirth',
        'dateOfBirthWords',
        'nationality',
        'category',
        'admissionDate',
        'classAtAdmission',
        'classLeaving',
        'dateOfLeaving',
        'reasonForLeaving',
        'promotionStatus',
        'conduct',
        'feeStatus',
        'gamesPlayed',
        'extraActivities',
        'remarks',
        'issueDate',
        'schoolName',
      ]),
      pageSize: 'A4',
      orientation: 'PORTRAIT',
      isActive: true,
      isDefault: true,
      createdBy: adminUser.id,
    },
  ];

  for (const template of templates) {
    try {
      // Check if template already exists
      const existing = await prisma.certificateTemplate.findUnique({
        where: { name: template.name },
      });

      if (existing) {
        console.log(`  ⏭️  Template "${template.name}" already exists, skipping...`);
        continue;
      }

      await prisma.certificateTemplate.create({
        data: template,
      });

      console.log(`  ✅ Created template: ${template.name}`);
    } catch (error) {
      console.error(`  ❌ Error creating template "${template.name}":`, error);
    }
  }

  console.log('✅ Certificate templates seeded successfully!');
}

seedCertificateTemplates()
  .catch((error) => {
    console.error('Error seeding certificate templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
