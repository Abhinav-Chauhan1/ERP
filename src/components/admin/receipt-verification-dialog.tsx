"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Download,
  Loader2,
  ZoomIn,
  User,
  CreditCard,
  Calendar,
  FileText,
  DollarSign,
  MessageSquare,
  Trash2,
  History,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { verifyReceipt } from "@/lib/actions/receiptVerificationActions";
import { addReceiptNote, getReceiptNotes, deleteReceiptNote } from "@/lib/actions/receiptNotesActions";
import toast from "react-hot-toast";

interface ReceiptData {
  id: string;
  referenceNumber: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionRef?: string | null;
  remarks?: string | null;
  receiptImageUrl: string;
  createdAt: Date;
  student: {
    id: string;
    admissionNumber?: string | null;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    enrollments: Array<{
      class: {
        name: string;
      };
      section: {
        name: string;
      };
    }>;
  };
  feeStructure: {
    id: string;
    name: string;
    amount: number;
    academicYear?: {
      year: string;
    };
    items?: Array<{
      feeType: {
        name: string;
      };
    }>;
  };
}

interface ReceiptVerificationDialogProps {
  receipt: ReceiptData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
  onReject?: () => void;
}

export function ReceiptVerificationDialog({
  receipt,
  open,
  onOpenChange,
  onVerified,
  onReject,
}: ReceiptVerificationDialogProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!receipt) return;

    setIsLoadingNotes(true);
    const result = await getReceiptNotes(receipt.id);
    if (result.success && result.data) {
      setNotes(result.data);
    }
    setIsLoadingNotes(false);
  }, [receipt]);

  // Load notes when dialog opens
  useEffect(() => {
    if (open && receipt) {
      loadNotes();
    }
  }, [open, receipt, loadNotes]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !receipt) return;

    setIsAddingNote(true);
    const result = await addReceiptNote(receipt.id, newNote);

    if (result.success) {
      toast.success("Note added successfully");
      setNewNote("");
      loadNotes(); // Reload notes
    } else {
      toast.error(result.error || "Failed to add note");
    }
    setIsAddingNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    const result = await deleteReceiptNote(noteId);

    if (result.success) {
      toast.success("Note deleted successfully");
      loadNotes(); // Reload notes
    } else {
      toast.error(result.error || "Failed to delete note");
    }
  };

  if (!receipt) return null;

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await verifyReceipt(receipt.id);
      if (result.success) {
        toast.success("Receipt verified successfully!");
        setShowConfirmation(false);
        onOpenChange(false);
        if (onVerified) {
          onVerified();
        }
      } else {
        toast.error(result.error || "Failed to verify receipt");
      }
    } catch (error) {
      console.error("Error verifying receipt:", error);
      toast.error("An error occurred while verifying the receipt");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = () => {
    onOpenChange(false);
    if (onReject) {
      onReject();
    }
  };

  const handleDownload = () => {
    window.open(receipt.receiptImageUrl, "_blank");
  };

  // Calculate current balance (simplified - in real scenario, fetch from DB)
  const totalFeeAmount = receipt.feeStructure.amount;
  const paidAmount = receipt.amount;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Receipt Verification</DialogTitle>
            <DialogDescription>
              Review the receipt details and payment information before verification
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)]">
            <div className="space-y-6 pr-4">
              {/* Receipt Image */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Receipt Image</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImageZoomed(!imageZoomed)}
                    >
                      <ZoomIn className="h-4 w-4 mr-1" />
                      {imageZoomed ? "Zoom Out" : "Zoom In"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <div
                  className={`relative w-full bg-muted rounded-lg overflow-hidden ${imageZoomed ? "h-[800px]" : "h-[400px]"
                    }`}
                >
                  <Image
                    src={receipt.receiptImageUrl}
                    alt={`Receipt ${receipt.referenceNumber}`}
                    fill
                    className="object-contain"
                    loading="lazy"
                  />
                </div>
              </div>

              <Separator />

              {/* Student Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Student Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {receipt.student.user.firstName} {receipt.student.user.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{receipt.student.user.email}</p>
                  </div>
                  {receipt.student.admissionNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Admission ID</p>
                      <p className="font-medium font-mono">
                        {receipt.student.admissionNumber}
                      </p>
                    </div>
                  )}
                  {receipt.student.enrollments[0] && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Class</p>
                        <p className="font-medium">
                          {receipt.student.enrollments[0].class.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Section</p>
                        <p className="font-medium">
                          {receipt.student.enrollments[0].section.name}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Fee Structure Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Fee Structure Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Fee Structure</p>
                    <p className="font-medium">{receipt.feeStructure.name}</p>
                  </div>
                  {receipt.feeStructure.academicYear && (
                    <div>
                      <p className="text-sm text-muted-foreground">Academic Year</p>
                      <p className="font-medium">
                        {receipt.feeStructure.academicYear.year}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Total Fee Amount</p>
                    <p className="font-semibold text-lg">
                      ₹{totalFeeAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="font-semibold text-lg text-amber-600">
                      ₹{(totalFeeAmount - paidAmount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Details from Receipt */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Payment Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-900">
                  <div>
                    <p className="text-sm text-muted-foreground">Reference Number</p>
                    <p className="font-medium font-mono">{receipt.referenceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Amount</p>
                    <p className="font-bold text-2xl text-green-600">
                      ₹{receipt.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Date</p>
                    <p className="font-medium">
                      {format(new Date(receipt.paymentDate), "MMMM dd, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <Badge variant="outline" className="font-medium">
                      {receipt.paymentMethod}
                    </Badge>
                  </div>
                  {receipt.transactionRef && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Transaction Reference
                      </p>
                      <p className="font-medium font-mono">{receipt.transactionRef}</p>
                    </div>
                  )}
                  {receipt.remarks && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Remarks</p>
                      <p className="font-medium">{receipt.remarks}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Submitted On</p>
                    <p className="font-medium">
                      {format(new Date(receipt.createdAt), "MMMM dd, yyyy 'at' hh:mm a")}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Internal Notes Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Internal Notes</h3>
                  <Badge variant="secondary" className="ml-auto">
                    Admin Only
                  </Badge>
                </div>

                {/* Add Note Form */}
                <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                  <Label htmlFor="new-note">Add Note</Label>
                  <Textarea
                    id="new-note"
                    placeholder="Add internal notes about this receipt (visible to admins only)..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    maxLength={5000}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {newNote.length}/5000 characters
                    </span>
                    <Button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || isAddingNote}
                      size="sm"
                    >
                      {isAddingNote ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Note"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Notes History */}
                {isLoadingNotes ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : notes.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Notes History ({notes.length})
                    </p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-background border rounded-lg p-3 space-y-2"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{note.authorName}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(note.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNote(note.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notes yet. Add a note to track information about this receipt.
                  </p>
                )}
              </div>

              {/* Balance After Verification */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-900">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    After Verification
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Fee</p>
                    <p className="font-semibold">₹{totalFeeAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Payment</p>
                    <p className="font-semibold text-green-600">
                      ₹{receipt.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining Balance</p>
                    <p className="font-semibold text-amber-600">
                      ₹{(totalFeeAmount - paidAmount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Link href="/admin/finance/receipt-audit-logs" target="_blank">
              <Button variant="outline" type="button">
                <History className="h-4 w-4 mr-2" />
                View Audit Log
              </Button>
            </Link>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject Receipt
            </Button>
            <Button
              onClick={() => setShowConfirmation(true)}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Verify Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment Verification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify this payment receipt? This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Create a completed payment record of ₹{receipt.amount.toFixed(2)}</li>
                <li>Update the student's fee balance</li>
                <li>Send a notification to the student</li>
                <li>Mark this receipt as verified</li>
              </ul>
              <p className="mt-3 font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVerifying}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVerify}
              disabled={isVerifying}
              className="bg-green-600 hover:bg-green-700"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Verification
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
