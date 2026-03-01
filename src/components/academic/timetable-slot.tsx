import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TimetableSlotProps = {
  subject: string;
  className: string;
  room: string;
  type: "class" | "duty" | "meeting" | "break";
  onClick?: () => void;
};

export function TimetableSlot({ 
  subject, 
  className, 
  room, 
  type = "class",
  onClick 
}: TimetableSlotProps) {
  return (
    <Card 
      className={cn(
        "p-2 m-0.5 rounded h-full cursor-pointer transition-colors",
        type === 'class' && "bg-blue-50 border-blue-200 border hover:bg-blue-100",
        type === 'duty' && "bg-amber-50 border-amber-200 border hover:bg-amber-100",
        type === 'meeting' && "bg-teal-50 border-teal-200 border hover:bg-teal-100",
        type === 'break' && "bg-gray-50 border-gray-200 border"
      )}
      onClick={onClick}
    >
      <p className="font-medium text-sm mb-1">{subject}</p>
      <div className="text-xs flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <span>{className}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <span>{room}</span>
        </div>
      </div>
    </Card>
  );
}
