import { Metadata } from "next";
import { Calendar, Clock } from "lucide-react";
import { ExamList } from "@/components/student/exam-list";
import { getUpcomingExams } from "@/lib/actions/student-assessment-actions";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Upcoming Exams | Student Portal",
  description: "View your upcoming exam schedule",
};

export default async function ExamsPage() {
  const exams = await getUpcomingExams();
  
  return (
    <div className="container p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Upcoming Exams</h1>
          <p className="text-gray-500">
            View your upcoming exam schedule and prepare accordingly
          </p>
        </div>
        
        <div className="flex items-center bg-blue-50 text-blue-800 px-4 py-2 rounded-md">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          <span className="text-sm font-medium">
            {exams.length} upcoming {exams.length === 1 ? "exam" : "exams"}
          </span>
        </div>
      </div>

      <ExamList exams={exams} emptyMessage="You don't have any upcoming exams scheduled" />
    </div>
  );
}
