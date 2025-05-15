"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, User, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";

interface RegistrationDialogProps {
  event: {
    id: string;
    title: string;
    startDate: string;
    maxParticipants?: number | null;
  };
  userId: string;
  studentId: string;
  isOpen: boolean;
}

export function RegistrationDialog({ event, userId, studentId, isOpen }: RegistrationDialogProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState("");

  const handleRegistration = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/events/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          userId,
          studentId,
          role: "ATTENDEE",
          additionalInfo
        }),
      });
      
      if (!response.ok) {
        throw new Error("Registration failed");
      }
      
      toast.success("Registration successful!");
      setIsDialogOpen(false);
      setAdditionalInfo("");
      
      // Refresh the page to show updated registration status
      router.refresh();
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to register for the event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" disabled={!isOpen}>
          {isOpen ? "Register" : "Registration Closed"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register for Event</DialogTitle>
          <DialogDescription>
            You are registering for <span className="font-medium">{event.title}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>Event Date: {new Date(event.startDate).toLocaleDateString()}</span>
          </div>
          
          {event.maxParticipants && (
            <div className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <span>Maximum Participants: {event.maxParticipants}</span>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="additional-info" className="text-sm font-medium">
              Additional Information (Optional)
            </label>
            <Textarea
              id="additional-info"
              placeholder="Any additional information you'd like to provide..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRegistration} 
            disabled={isSubmitting}
            className="ml-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Registration
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
