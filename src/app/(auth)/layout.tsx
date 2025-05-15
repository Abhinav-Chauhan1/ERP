import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already authenticated
  const user = await currentUser();
  
  // If user is already signed in, redirect to dashboard or home
  if (user) {
    // Determine redirect path based on user role (stored in metadata)
    const role = (user.publicMetadata?.role as string) || 'student';
    const redirectPath = role === 'admin' ? '/admin' : 
                         role === 'teacher' ? '/teacher' : 
                         role === 'parent' ? '/parent' : 
                         '/student';
                         
    return redirect(redirectPath);
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50">
      <div className="py-8">
        <div className="mx-auto text-center mb-2">
          <h1 className="text-2xl font-bold">School ERP</h1>
          <p className="text-gray-500">Manage your school effectively</p>
        </div>
        {children}
      </div>
    </div>
  );
}
