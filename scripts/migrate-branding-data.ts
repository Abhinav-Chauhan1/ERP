/**
 * Migration Script: Consolidate SchoolBranding into SystemSettings
 * 
 * This script migrates data from the SchoolBranding model to SystemSettings
 * Run this before deploying the updated schema
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateBrandingData() {
  console.log('Starting branding data migration...');

  try {
    // Get the active branding record
    const branding = await prisma.schoolBranding.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!branding) {
      console.log('No active branding record found. Skipping migration.');
      return;
    }

    console.log('Found active branding record:', branding.id);

    // Get the system settings record
    const settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      console.log('No system settings found. Creating default settings with branding data...');
      
      await prisma.systemSettings.create({
        data: {
          schoolName: branding.schoolName,
          tagline: branding.tagline,
          schoolLogo: branding.logo,
          faviconUrl: branding.favicon,
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          accentColor: branding.accentColor,
          emailLogo: branding.emailLogo,
          emailFooter: branding.emailFooter,
          emailSignature: branding.emailSignature,
          letterheadLogo: branding.letterheadLogo,
          letterheadText: branding.letterheadText,
          documentFooter: branding.documentFooter,
          schoolAddress: branding.address,
          schoolPhone: branding.phone,
          schoolEmail: branding.email,
          schoolWebsite: branding.website,
          facebookUrl: branding.facebookUrl,
          twitterUrl: branding.twitterUrl,
          linkedinUrl: branding.linkedinUrl,
          instagramUrl: branding.instagramUrl,
        },
      });

      console.log('Created system settings with branding data');
    } else {
      console.log('Updating existing system settings with branding data...');

      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          schoolName: branding.schoolName || settings.schoolName,
          tagline: branding.tagline,
          schoolLogo: branding.logo || settings.schoolLogo,
          faviconUrl: branding.favicon || settings.faviconUrl,
          primaryColor: branding.primaryColor || settings.primaryColor,
          secondaryColor: branding.secondaryColor,
          accentColor: branding.accentColor,
          emailLogo: branding.emailLogo,
          emailFooter: branding.emailFooter,
          emailSignature: branding.emailSignature,
          letterheadLogo: branding.letterheadLogo,
          letterheadText: branding.letterheadText,
          documentFooter: branding.documentFooter,
          schoolAddress: branding.address || settings.schoolAddress,
          schoolPhone: branding.phone || settings.schoolPhone,
          schoolEmail: branding.email || settings.schoolEmail,
          schoolWebsite: branding.website || settings.schoolWebsite,
          facebookUrl: branding.facebookUrl,
          twitterUrl: branding.twitterUrl,
          linkedinUrl: branding.linkedinUrl,
          instagramUrl: branding.instagramUrl,
        },
      });

      console.log('Updated system settings successfully');
    }

    console.log('Migration completed successfully!');
    console.log('\nNote: The SchoolBranding table is still present but deprecated.');
    console.log('You can safely drop it after verifying the migration.');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateBrandingData()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
