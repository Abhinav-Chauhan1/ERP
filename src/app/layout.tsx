import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/lib/auth";

import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "School ERP",
  description: "Comprehensive School Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
