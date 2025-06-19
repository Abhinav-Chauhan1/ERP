"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: Date | string;
  status: string;
  section?: {
    id: string;
    name: string;
  };
}

interface AttendanceHistoryTableProps {
  attendanceData: AttendanceRecord[];
}

export function AttendanceHistoryTable({ attendanceData }: AttendanceHistoryTableProps) {
  const [filter, setFilter] = useState<string>("ALL");
  
  // Sort attendance data by date (newest first)
  const sortedData = [...attendanceData].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Filter data based on status
  const filteredData = filter === "ALL" 
    ? sortedData 
    : sortedData.filter(record => record.status === filter);
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Present</Badge>;
      case "ABSENT":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Absent</Badge>;
      case "LATE":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Late</Badge>;
      case "LEAVE":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Leave</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Select defaultValue="ALL" onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PRESENT">Present</SelectItem>
            <SelectItem value="ABSENT">Absent</SelectItem>
            <SelectItem value="LATE">Late</SelectItem>
            <SelectItem value="LEAVE">Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredData.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Section</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(new Date(record.date), "dd MMM yyyy")}</TableCell>
                  <TableCell>{format(new Date(record.date), "EEEE")}</TableCell>
                  <TableCell>{getStatusBadgeVariant(record.status)}</TableCell>
                  <TableCell>{record.section?.name || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No attendance records found
        </div>
      )}
    </div>
  );
}
