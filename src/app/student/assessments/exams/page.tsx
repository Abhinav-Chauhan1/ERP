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
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upcoming Exams</h1>
          <p className="text-muted-foreground mt-1">
            View your upcoming exam schedule and prepare accordingly
          </p>
        </div>
        
        {exams.length > 0 && (
          <div className="flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-md">
            <Calendar className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">
              {exams.length} upcoming {exams.length === 1 ? "exam" : "exams"}
            </span>
          </div>
        )}
      </div>

      <ExamList exams={exams} emptyMessage="You don't have any upcoming exams scheduled" />
    </div>
  );
}
