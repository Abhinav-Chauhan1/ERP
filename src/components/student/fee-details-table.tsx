import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface FeeItem {
  id: string;
  amount: number;
  dueDate: Date | null;
  feeType: {
    id: string;
    name: string;
    description: string | null;
    frequency: string;
  };
}

interface FeePayment {
  id: string;
  amount: number;
  paidAmount: number;
  status: string;
}

interface FeeDetailsTableProps {
  feeItems: FeeItem[];
  payments: FeePayment[];
}

export function FeeDetailsTable({ feeItems, payments }: FeeDetailsTableProps) {
  const now = new Date();
  
  // Helper function to determine if a fee is paid
  const getPaymentStatus = (feeItem: FeeItem) => {
    const payment = payments.find(p => p.amount === feeItem.amount);
    
    if (payment?.status === "COMPLETED") {
      return {
        status: "PAID",
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        badge: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
      };
    }
    
    if (feeItem.dueDate && new Date(feeItem.dueDate) < now) {
      return {
        status: "OVERDUE",
        icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        badge: <Badge variant="destructive">Overdue</Badge>
      };
    }
    
    return {
      status: "PENDING",
      icon: <Clock className="h-4 w-4 text-amber-600" />,
      badge: <Badge variant="outline" className="border-amber-500 text-amber-700">Pending</Badge>
    };
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fee Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Frequency
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {feeItems.map((item) => {
            const { icon, badge } = getPaymentStatus(item);
            
            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.feeType.name}</div>
                  {item.feeType.description && (
                    <div className="text-xs text-gray-500">{item.feeType.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium">${item.amount.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {item.dueDate ? format(new Date(item.dueDate), "MMM dd, yyyy") : "Not specified"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.feeType.frequency.replace("_", " ")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {icon}
                    <span className="ml-2">{badge}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
