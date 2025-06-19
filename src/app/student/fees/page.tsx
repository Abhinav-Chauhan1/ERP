import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { 
  DollarSign, 
  CreditCard, 
  FileText, 
  Award, 
  ChevronRight 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudentFeeDetails } from "@/lib/actions/student-fee-actions";

export const metadata: Metadata = {
  title: "Fees | Student Portal",
  description: "View and manage your fee payments",
};

export default async function StudentFeesPage() {
  // Get fee summary for the student
  const { 
    totalFees, 
    paidAmount, 
    balance, 
    paymentPercentage, 
    overdueFees, 
    className, 
    academicYear 
  } = await getStudentFeeDetails();
  
  const overdueAmount = overdueFees.reduce((sum, fee) => sum + fee.amount, 0);
  
  const feeLinks = [
    {
      title: "Fee Details",
      description: "View your detailed fee structure and payment status",
      icon: FileText,
      href: "/student/fees/details",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Payment History",
      description: "View your payment history and receipts",
      icon: CreditCard,
      href: "/student/fees/payments",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Due Payments",
      description: "View and pay your pending fee payments",
      icon: DollarSign,
      href: "/student/fees/due",
      color: "bg-amber-50 text-amber-600",
      badge: overdueFees.length > 0 ? `${overdueFees.length} due` : undefined,
      badgeColor: "bg-red-100 text-red-800",
    },
    {
      title: "Scholarships",
      description: "View and apply for available scholarships",
      icon: Award,
      href: "/student/fees/scholarships",
      color: "bg-purple-50 text-purple-600",
    },
  ];
  
  return (
    <div className="container p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Fees & Payments</h1>
        <p className="text-gray-500">
          View and manage your fee details and payments
        </p>
      </div>
      
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Fee Summary</h2>
            <p className="text-gray-600">Class: <span className="font-medium">{className}</span> | Academic Year: <span className="font-medium">{academicYear}</span></p>
          </div>
          
          <div className="flex flex-col items-center bg-white px-6 py-3 rounded-lg shadow-sm">
            <span className="text-gray-500 text-sm">Payment Progress</span>
            <span 
              className={`text-3xl font-bold ${
                paymentPercentage >= 90 ? 'text-green-600' :
                paymentPercentage >= 75 ? 'text-blue-600' :
                paymentPercentage >= 60 ? 'text-amber-600' :
                'text-red-600'
              }`}
            >
              {Math.round(paymentPercentage)}%
            </span>
          </div>
          
          <div className="flex gap-3">
            <div className="flex flex-col items-center bg-white px-4 py-3 rounded-lg shadow-sm">
              <span className="text-gray-500 text-xs">Total Fees</span>
              <span className="text-2xl font-bold text-gray-800">${totalFees.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col items-center bg-white px-4 py-3 rounded-lg shadow-sm">
              <span className="text-gray-500 text-xs">Balance Due</span>
              <span className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${balance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        
        {overdueAmount > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-red-800 font-medium">You have overdue payments!</p>
                <p className="text-sm text-red-600">Total overdue amount: ${overdueAmount.toFixed(2)}</p>
              </div>
              <Button asChild variant="destructive" size="sm">
                <Link href="/student/fees/due">Pay Now</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {feeLinks.map((link) => (
          <Card key={link.href}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <div className={`rounded-lg p-2 mr-3 ${link.color}`}>
                  <link.icon className="h-6 w-6" />
                </div>
                <div className="flex justify-between items-center w-full">
                  <span>{link.title}</span>
                  {link.badge && (
                    <div className={`text-xs px-2 py-1 rounded-full ${link.badgeColor}`}>
                      {link.badge}
                    </div>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">{link.description}</p>
              <Button asChild className="w-full mt-2">
                <Link href={link.href}>
                  Access {link.title}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
