"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  Download, 
  Camera, 
  FileText,
  AlertTriangle,
  Info
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ReceiptUploadGuidelines() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="h-4 w-4 mr-2" />
          Upload Guidelines
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receipt Upload Guidelines</DialogTitle>
          <DialogDescription>
            Follow these guidelines for faster verification of your payment receipts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Tips Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Quick Tips</AlertTitle>
            <AlertDescription>
              Use good lighting, keep receipt flat, ensure all text is readable, and include all corners.
            </AlertDescription>
          </Alert>

          {/* Download Full Guide */}
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <a href="/docs/RECEIPT_UPLOAD_GUIDELINES.md" download>
                <Download className="h-4 w-4 mr-2" />
                Download Full Guidelines (PDF)
              </a>
            </Button>
          </div>

          {/* Accordion Sections */}
          <Accordion type="single" collapsible className="w-full">
            {/* What Makes a Good Receipt */}
            <AccordionItem value="good-receipt">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>What Makes a Good Receipt Photo?</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">✅ DO:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Use good lighting (avoid shadows)</li>
                      <li>Keep receipt flat and smooth</li>
                      <li>Focus properly (sharp, readable text)</li>
                      <li>Include all four corners</li>
                      <li>Use high resolution (min 800x600px)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">❌ DON'T:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Take photos in dark areas</li>
                      <li>Submit damaged or faded receipts</li>
                      <li>Upload blurry images</li>
                      <li>Crop important parts</li>
                      <li>Use flash if it creates glare</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Required Information */}
            <AccordionItem value="required-info">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Required Information on Receipt</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Your receipt MUST include:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Payment amount</li>
                    <li>Payment date</li>
                    <li>Payment method (cash/cheque/transfer)</li>
                    <li>Issuing organization/bank name</li>
                    <li>Receipt number or transaction ID</li>
                    <li>Your name or student name</li>
                  </ul>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium mb-2">Accepted Formats:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>JPEG/JPG (recommended for photos)</li>
                      <li>PNG (good for scanned documents)</li>
                      <li>PDF (acceptable for digital receipts)</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Maximum file size: 5 MB
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Common Rejection Reasons */}
            <AccordionItem value="rejection-reasons">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span>Common Rejection Reasons</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <div className="border-l-4 border-red-500 pl-3">
                    <h5 className="font-semibold">1. Unclear Image (40%)</h5>
                    <p className="text-muted-foreground">Blurry, too dark, or text not readable</p>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Solution: Retake photo in good lighting with steady hand
                    </p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-3">
                    <h5 className="font-semibold">2. Amount Mismatch (25%)</h5>
                    <p className="text-muted-foreground">Amount doesn't match entered value</p>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Solution: Double-check amount before submitting
                    </p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-3">
                    <h5 className="font-semibold">3. Invalid Receipt (20%)</h5>
                    <p className="text-muted-foreground">Wrong institution or purpose</p>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Solution: Ensure receipt is for school fees
                    </p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-3">
                    <h5 className="font-semibold">4. Missing Details (10%)</h5>
                    <p className="text-muted-foreground">Receipt number, date, or name not visible</p>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Solution: Include complete receipt with all details
                    </p>
                  </div>
                  <div className="border-l-4 border-gray-500 pl-3">
                    <h5 className="font-semibold">5. Other Issues (5%)</h5>
                    <p className="text-muted-foreground">Duplicate, wrong format, corrupted file</p>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Solution: Follow guidelines carefully
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Step-by-Step Process */}
            <AccordionItem value="upload-process">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-purple-600" />
                  <span>Step-by-Step Upload Process</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div>
                      <h5 className="font-semibold">Prepare Your Receipt</h5>
                      <p className="text-muted-foreground">Ensure receipt is complete and undamaged</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div>
                      <h5 className="font-semibold">Take a Good Photo</h5>
                      <p className="text-muted-foreground">Use good lighting, keep flat, ensure focus</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                      3
                    </div>
                    <div>
                      <h5 className="font-semibold">Fill Out Form</h5>
                      <p className="text-muted-foreground">Enter exact details from receipt</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                      4
                    </div>
                    <div>
                      <h5 className="font-semibold">Upload Receipt</h5>
                      <p className="text-muted-foreground">Review preview, rotate if needed, confirm</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                      5
                    </div>
                    <div>
                      <h5 className="font-semibold">Track Status</h5>
                      <p className="text-muted-foreground">Save reference number, check notifications</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Mobile Tips */}
            <AccordionItem value="mobile-tips">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-indigo-600" />
                  <span>Tips for Mobile Users</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <h5 className="font-semibold mb-2">Using Camera Capture:</h5>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Tap "Take Photo with Camera" button</li>
                      <li>Allow camera permissions if prompted</li>
                      <li>Position receipt in frame</li>
                      <li>Tap capture button</li>
                      <li>Review and retake if needed</li>
                    </ol>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Touch Controls:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Rotate:</strong> Tap rotate button to fix orientation</li>
                      <li><strong>Zoom:</strong> Use zoom buttons to check details</li>
                      <li><strong>Remove:</strong> Tap X to select different photo</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* FAQ */}
            <AccordionItem value="faq">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-gray-600" />
                  <span>Frequently Asked Questions</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <h5 className="font-semibold">How long does verification take?</h5>
                    <p className="text-muted-foreground">Usually 1-3 business days. You'll receive a notification when verified.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold">What if my receipt is rejected?</h5>
                    <p className="text-muted-foreground">You'll receive a notification with the reason. You can upload a new receipt immediately.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold">Can I edit details after submission?</h5>
                    <p className="text-muted-foreground">No, but you can upload a new receipt if rejected. Ensure details are correct before submitting.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold">Can I submit a bank statement instead?</h5>
                    <p className="text-muted-foreground">Yes, if it clearly shows the payment to the school with all required details.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Contact Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Need Help?</AlertTitle>
            <AlertDescription>
              Contact Finance Office: finance@school.edu | Phone: +1 (555) 123-4567
              <br />
              Office Hours: Monday-Friday, 9 AM - 5 PM
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
