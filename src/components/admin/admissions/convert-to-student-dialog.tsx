"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Copy, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { convertAdmissionToStudent } from "@/lib/actions/admissionConversionActions";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConvertToStudentDialogProps {
  applicationId: string;
  applicationNumber: string;
  studentName: string;
  onSuccess?: () => void;
}

export function ConvertToStudentDialog({
  applicationId,
  applicationNumber,
  studentName,
  onSuccess,
}: ConvertToStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rollNumber, setRollNumber] = useState("");
  const [sendCredentials, setSendCredentials] = useState(true);
  const [credentials, setCredentials] = useState<{
    email: string;
    temporaryPassword: string;
    admissionId: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleConvert = async () => {
    setLoading(true);
    try {
      const result = await convertAdmissionToStudent(applicationId, {
        rollNumber: rollNumber || undefined,
        sendCredentials,
      });

      if (result.success && result.data) {
        setCredentials(result.data.credentials);
        toast.success("Student enrolled successfully!");
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.error || "Failed to enroll student");
        setOpen(false);
      }
    } catch (error) {
      console.error("Error converting admission:", error);
      toast.error("An error occurred while enrolling student");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCredentials(null);
    setRollNumber("");
    setSendCredentials(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Enroll as Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {!credentials ? (
          <>
            <DialogHeader>
              <DialogTitle>Enroll Student</DialogTitle>
              <DialogDescription>
                Convert application {applicationNumber} to an enrolled student. This will create a
                user account and student profile.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <AlertDescription>
                  <strong>Student:</strong> {studentName}
                  <br />
                  A user account will be created with login credentials.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number (Optional)</Label>
                <Input
                  id="rollNumber"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="Enter roll number"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendCredentials"
                  checked={sendCredentials}
                  onCheckedChange={(checked) => setSendCredentials(checked as boolean)}
                />
                <Label
                  htmlFor="sendCredentials"
                  className="text-sm font-normal cursor-pointer"
                >
                  Send login credentials via email
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleConvert} disabled={loading}>
                {loading ? "Enrolling..." : "Enroll Student"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Student Enrolled Successfully!</DialogTitle>
              <DialogDescription>
                The student has been enrolled. Save these credentials securely.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  ✓ Student account created successfully
                  <br />✓ Login credentials generated
                  {sendCredentials && (
                    <>
                      <br />✓ Credentials sent to parent email
                    </>
                  )}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Admission ID</Label>
                  <div className="flex items-center gap-2">
                    <Input value={credentials.admissionId} readOnly className="font-mono" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials.admissionId, "Admission ID")}
                    >
                      {copiedField === "Admission ID" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email (Username)</Label>
                  <div className="flex items-center gap-2">
                    <Input value={credentials.email} readOnly className="font-mono" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials.email, "Email")}
                    >
                      {copiedField === "Email" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Temporary Password</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={credentials.temporaryPassword}
                      readOnly
                      className="font-mono bg-yellow-50"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials.temporaryPassword, "Password")}
                    >
                      {copiedField === "Password" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800 text-sm">
                  ⚠️ Make sure to save these credentials. The password cannot be retrieved later.
                  The student should change their password after first login.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
