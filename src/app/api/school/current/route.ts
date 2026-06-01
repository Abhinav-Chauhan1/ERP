import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

/**
 * GET /api/school/current
 * Returns basic info for the currently authenticated school admin's school,
 * including live student count for billing calculations.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const schoolId = session.user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: 'No school context' }, { status: 403 });
  }

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      plan: true,
      _count: { select: { students: true } },
    },
  });

  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: school.id,
    name: school.name,
    plan: school.plan,
    studentCount: school._count.students,
  });
}
