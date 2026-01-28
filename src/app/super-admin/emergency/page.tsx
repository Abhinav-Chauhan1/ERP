import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import EmergencyAccessDashboard from '@/components/super-admin/emergency/emergency-access-dashboard';

export const metadata: Metadata = {
  title: 'Emergency Access Controls | Super Admin',
  description: 'Manage emergency access controls for users and schools',
};

export default async function EmergencyAccessPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-6">
      <EmergencyAccessDashboard />
    </div>
  );
}