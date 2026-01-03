"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X, FileText, Loader2, CheckCircle, Info, HelpCircle, RotateCw, ZoomIn, ZoomOut, AlertTriangle, Camera } from "lucide-react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { uploadPaymentReceipt } from "@/lib/actions/paymentReceiptActions";
import { validateReceiptFile } from "@/lib/schemaValidation/paymentReceiptSchemaValidation";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

// Form schema
const receiptUploadFormSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be greater than zero"
  ),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(["CASH", "CHEQUE", "BANK_TRANSFER"], {
    required_error: "Payment method is required",
  }),
  transactionRef: z.string().optional(),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof receiptUploadFormSchema>;

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
}

interface ReceiptUploadFormProps {
  studentId: string;
  feeStructures: FeeStructure[];
  onSuccess?: (referenceNumber: string) => void;
}

export function ReceiptUploadForm({
  studentId,
  feeStructures,
  onSuccess,
}: ReceiptUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [imageQuality, setImageQuality] = useState<{
    isLowResolution: boolean;
    isLargeFile: boolean;
    estimatedQuality: "good" | "fair" | "poor";
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  // Detect mobile device
  useState(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(receiptUploadFormSchema),
    defaultValues: {
      studentId,
      feeStructureId: "",
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: undefined,
      transactionRef: "",
      remarks: "",
    },
  });

  // Analyze image quality
  const analyzeImageQuality = async (file: File): Promise<void> => {
    if (!file.type.startsWith("image/")) {
      setImageQuality(null);
      return;
    }

    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const fileSizeMB = file.size / 1024 / 1024;

        // Check resolution (minimum 800x600 recommended)
        const isLowResolution = width < 800 || height < 600;

        // Check file size (over 3MB is large)
        const isLargeFile = fileSizeMB > 3;

        // Estimate quality based on resolution and file size
        let estimatedQuality: "good" | "fair" | "poor" = "good";
        if (isLowResolution) {
          estimatedQuality = "poor";
        } else if (fileSizeMB < 0.1 || (width < 1200 && fileSizeMB < 0.3)) {
          estimatedQuality = "fair";
        }

        setImageQuality({
          isLowResolution,
          isLargeFile,
          estimatedQuality,
        });

        resolve();
      };

      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileError(null);
    setImageQuality(null);
    setRotation(0);
    setZoom(1);
  };

  // Rotate image
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Zoom in
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  // Zoom out
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  // Handle camera capture (mobile only)
  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        await processFile(file);
      }
    };
    input.click();
  };

  // Process file (shared logic for file selection and camera capture)
  const processFile = async (file: File) => {
    // Validate file
    const validation = await validateReceiptFile(file);
    if (!validation.valid) {
      setFileError(validation.error || "Invalid file");
      setSelectedFile(null);
      setFilePreview(null);
      setImageQuality(null);
      return;
    }

    setFileError(null);
    setRotation(0);
    setZoom(1);

    // Analyze image quality before compression
    await analyzeImageQuality(file);

    // Compress image if it's an image file
    let processedFile = file;
    if (file.type.startsWith("image/")) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: file.type,
        };
        processedFile = await imageCompression(file, options);
      } catch (error) {
        console.error("Image compression failed:", error);
      }
    }

    setSelectedFile(processedFile);

    // Create preview for images
    if (processedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(processedFile);
    } else {
      setFilePreview(null);
    }
  };

  // Format currency
  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    return num.toFixed(2);
  };

  // Handle form submission (show confirmation dialog first)
  const handleFormSubmit = (data: FormValues) => {
    if (!selectedFile) {
      setFileError("Please select a receipt image");
      return;
    }
    setShowConfirmDialog(true);
  };

  // Actual submission after confirmation
  const onSubmit = async () => {
    if (!selectedFile) return;

    const data = form.getValues();
    setShowConfirmDialog(false);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const result = await uploadPaymentReceipt({
        studentId: data.studentId,
        feeStructureId: data.feeStructureId,
        amount: parseFloat(data.amount),
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod,
        transactionRef: data.transactionRef || undefined,
        remarks: data.remarks || undefined,
        receiptImage: selectedFile,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.referenceNumber) {
        setUploadSuccess(true);
        setReferenceNumber(result.referenceNumber);
        toast({
          title: "Receipt uploaded successfully",
          description: `Reference number: ${result.referenceNumber}`,
        });

        // Call onSuccess callback after a short delay
        setTimeout(() => {
          onSuccess?.(result.referenceNumber!);
        }, 2000);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload receipt",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Show success message
  if (uploadSuccess && referenceNumber) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-600">
                Receipt Uploaded Successfully!
              </h3>
              <p className="text-gray-600 mt-2">
                Your payment receipt has been submitted for verification.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Reference Number</p>
              <p className="text-2xl font-bold text-gray-900">{referenceNumber}</p>
              <p className="text-xs text-gray-500 mt-2">
                Please save this reference number for tracking your receipt status
              </p>
            </div>
            <p className="text-sm text-gray-600">
              You will be notified once your receipt is verified by the administration.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Fee Structure Selection */}
          <FormField
            control={form.control}
            name="feeStructureId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Fee Structure *
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Select the type of fee you're paying for (e.g., Tuition, Library, Sports). The amount will be auto-filled based on your selection.</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Auto-fill amount when fee structure is selected
                    const selected = feeStructures.find((fs) => fs.id === value);
                    if (selected) {
                      form.setValue("amount", selected.amount.toString());
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fee structure" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {feeStructures.map((structure) => (
                      <SelectItem key={structure.id} value={structure.id}>
                        {structure.name} - ₹{structure.amount.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the fee structure you are paying for
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Amount *
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Enter the exact amount you paid. This should match the amount shown on your receipt. Partial payments are allowed.</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7"
                      {...field}
                      onBlur={(e) => {
                        const formatted = formatCurrency(e.target.value);
                        if (formatted) {
                          field.onChange(formatted);
                        }
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Enter the exact amount you paid (must match your receipt)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Date */}
          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Payment Date *
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Select the date when you made the payment. This should match the date on your receipt. Future dates are not allowed.</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Date when you made the payment (cannot be in the future)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Method */}
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Payment Method *
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Select how you made the payment: Cash (paid in person), Cheque (check payment), or Bank Transfer (online/wire transfer).</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How did you make the payment?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Transaction Reference (Optional) */}
          <FormField
            control={form.control}
            name="transactionRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Transaction Reference (Optional)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Enter any reference number from your payment: cheque number, bank transaction ID, or receipt number. This helps with verification.</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Cheque number, Transaction ID"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter cheque number, transaction ID, or other reference
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Remarks (Optional) */}
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Remarks (Optional)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Add any additional notes or context about this payment that might be helpful for verification.</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional notes about this payment"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Add any additional information about this payment
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* File Upload */}
          <div className="space-y-2">
            <FormLabel className="flex items-center gap-2">
              Receipt Image *
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Upload a clear photo or scan of your payment receipt. Ensure all text is readable and the entire receipt is visible.</p>
                </TooltipContent>
              </Tooltip>
            </FormLabel>

            {/* Receipt Image Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Tips for a good receipt image:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Use good lighting (avoid shadows)</li>
                    <li>Keep the receipt flat and in focus</li>
                    <li>Include all corners of the receipt</li>
                    <li>Make sure all text is readable</li>
                    <li>Avoid blurry or dark images</li>
                  </ul>
                </div>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${fileError
                ? "border-red-300 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
                }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {!selectedFile ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Upload className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} text-gray-400`} />
                  </div>
                  <div>
                    <label htmlFor="receipt-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Click to upload
                      </span>
                      <span className="text-gray-600"> or drag and drop</span>
                    </label>
                    <input
                      id="receipt-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Mobile Camera Capture Button */}
                  {isMobile && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCameraCapture}
                        className="w-full sm:w-auto"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Take Photo with Camera
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    JPEG, PNG, or PDF (max 5MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filePreview ? (
                    <div className="space-y-3">
                      {/* Image Quality Warnings */}
                      {imageQuality && (
                        <div className="space-y-2">
                          {imageQuality.estimatedQuality === "poor" && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Poor Image Quality</AlertTitle>
                              <AlertDescription>
                                The image resolution is too low. Please upload a clearer photo for better verification.
                              </AlertDescription>
                            </Alert>
                          )}
                          {imageQuality.estimatedQuality === "fair" && (
                            <Alert>
                              <Info className="h-4 w-4" />
                              <AlertTitle>Fair Image Quality</AlertTitle>
                              <AlertDescription>
                                The image quality is acceptable but could be better. Consider uploading a higher quality photo if possible.
                              </AlertDescription>
                            </Alert>
                          )}
                          {imageQuality.isLargeFile && (
                            <Alert>
                              <Info className="h-4 w-4" />
                              <AlertTitle>Large File Size</AlertTitle>
                              <AlertDescription>
                                The file is quite large ({(selectedFile!.size / 1024 / 1024).toFixed(2)} MB). It will be automatically compressed to improve upload speed.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}

                      {/* Image Preview with Controls */}
                      <div className="relative inline-block">
                        <div className="overflow-hidden rounded-lg border-2 border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={filePreview}
                            alt="Receipt preview"
                            className="max-h-64 transition-transform"
                            style={{
                              transform: `rotate(${rotation}deg) scale(${zoom})`,
                              transformOrigin: "center",
                            }}
                          />
                        </div>

                        {/* Control Buttons - Touch-friendly on mobile */}
                        <div className={`absolute top-2 right-2 flex ${isMobile ? 'flex-col gap-2' : 'gap-1'}`}>
                          <button
                            type="button"
                            onClick={handleRotate}
                            className={`bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md transition-colors ${isMobile ? 'p-3' : 'p-2'}`}
                            title="Rotate 90°"
                          >
                            <RotateCw className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                          </button>
                          <button
                            type="button"
                            onClick={handleZoomIn}
                            className={`bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md transition-colors ${isMobile ? 'p-3' : 'p-2'}`}
                            title="Zoom In"
                            disabled={zoom >= 3}
                          >
                            <ZoomIn className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                          </button>
                          <button
                            type="button"
                            onClick={handleZoomOut}
                            className={`bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md transition-colors ${isMobile ? 'p-3' : 'p-2'}`}
                            title="Zoom Out"
                            disabled={zoom <= 0.5}
                          >
                            <ZoomOut className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className={`bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors ${isMobile ? 'p-3' : 'p-2'}`}
                            title="Remove"
                          >
                            <X className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                          </button>
                        </div>

                        {/* Zoom Level Indicator */}
                        {zoom !== 1 && (
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {Math.round(zoom * 100)}%
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-xs">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          {imageQuality && !imageQuality.isLowResolution && (
                            <span className="ml-2 text-green-600">✓ Good resolution</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="ml-2 text-red-500 hover:text-red-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {fileError && (
              <p className="text-sm text-red-600">{fileError}</p>
            )}
            <p className="text-xs text-gray-500">
              Upload a clear photo or scan of your payment receipt
            </p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="text-gray-900 font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Receipt
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Receipt Upload</DialogTitle>
            <DialogDescription>
              Please review your receipt details before submitting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Receipt Preview */}
            {filePreview && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={filePreview}
                  alt="Receipt preview"
                  className="max-h-64 rounded-lg border-2 border-gray-200"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                  }}
                />
              </div>
            )}

            {/* Details Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-gray-900">Payment Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Fee Structure:</span>
                  <p className="font-medium">
                    {feeStructures.find((fs) => fs.id === form.getValues("feeStructureId"))?.name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <p className="font-medium">${form.getValues("amount")}</p>
                </div>
                <div>
                  <span className="text-gray-600">Payment Date:</span>
                  <p className="font-medium">
                    {new Date(form.getValues("paymentDate")).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Payment Method:</span>
                  <p className="font-medium">
                    {form.getValues("paymentMethod")?.replace("_", " ")}
                  </p>
                </div>
                {form.getValues("transactionRef") && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Transaction Reference:</span>
                    <p className="font-medium">{form.getValues("transactionRef")}</p>
                  </div>
                )}
                {form.getValues("remarks") && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Remarks:</span>
                    <p className="font-medium">{form.getValues("remarks")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quality Warnings in Dialog */}
            {imageQuality?.estimatedQuality === "poor" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning: Poor Image Quality</AlertTitle>
                <AlertDescription>
                  Your receipt image has low quality. This may result in rejection. Consider uploading a clearer photo.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Go Back
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Confirm & Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
