import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { StorageQuotaService } from '@/lib/services/storage-quota-service';

const storageQuotaService = new StorageQuotaService();

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get school context
    const { getRequiredSchoolId } = await import('@/lib/utils/school-context-helper');
    const schoolId = await getRequiredSchoolId();

    // Get storage quota
    const quota = await storageQuotaService.checkQuota(schoolId);

    return NextResponse.json(quota);
  } catch (error) {
    console.error('Storage quota error:', error);
    return NextResponse.json(
      { error: 'Failed to get storage quota' },
      { status: 500 }
    );
  }
}
