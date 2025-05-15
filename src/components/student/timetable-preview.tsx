import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface TimeTablePreviewProps {
  studentId: string;
}

export function TimeTablePreview({ studentId }: TimeTablePreviewProps) {
  // This would typically come from an API call based on the studentId
  // For now, using dummy data
  const todaySchedule = [
    { id: 1, subject: "Mathematics", teacher: "Mr. Johnson", time: "08:00 - 09:30", room: "101" },
    { id: 2, subject: "Science", teacher: "Mrs. Smith", time: "09:45 - 11:15", room: "Lab 2" },
    { id: 3, subject: "Lunch Break", teacher: "", time: "11:15 - 12:00", room: "Cafeteria" },
    { id: 4, subject: "English", teacher: "Ms. Davis", time: "12:00 - 13:30", room: "203" },
    { id: 5, subject: "Computer Science", teacher: "Mr. Wilson", time: "13:45 - 15:15", room: "IT Lab" },
  ];

  const currentDay = format(new Date(), "EEEE");
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Today's Schedule
          </div>
          <span className="text-sm font-normal text-gray-500">{currentDay}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <div className="space-y-1">
          {todaySchedule.map((period, index) => (
            <div 
              key={period.id} 
              className={`flex items-center p-2 rounded-md ${
                index === 2 ? 'bg-gray-50' : 'border-l-4 border-blue-500'
              }`}
            >
              <div className="flex-1">
                <p className={`font-medium ${index === 2 ? 'text-gray-500' : ''}`}>
                  {period.subject}
                </p>
                {period.teacher && (
                  <p className="text-xs text-gray-500">{period.teacher}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm">{period.time}</p>
                <p className="text-xs text-gray-500">{period.room}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center pt-4">
          <a 
            href="/student/academics/schedule" 
            className="text-sm text-blue-600 hover:underline"
          >
            View full schedule
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
