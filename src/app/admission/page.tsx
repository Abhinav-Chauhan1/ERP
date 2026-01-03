"use client";


import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { admissionApplicationSchema, AdmissionApplicationFormValues } from "@/lib/schemaValidation/admissionSchemaValidation";
import { createAdmissionApplication, getAvailableClasses, uploadAdmissionDocument } from "@/lib/actions/admissionActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, CheckCircle2, Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { Label } from "@/components/ui/label";

type Class = {
  id: string;
  name: string;
  academicYear: {
    name: string;
  };
};

type UploadedDocument = {
  type: string;
  url: string;
  filename: string;
  file?: File;
};

export default function AdmissionPortalPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  // Document upload states
  const [birthCertificate, setBirthCertificate] = useState<UploadedDocument | null>(null);
  const [reportCard, setReportCard] = useState<UploadedDocument | null>(null);
  const [photograph, setPhotograph] = useState<UploadedDocument | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const form = useForm<AdmissionApplicationFormValues>({
    resolver: zodResolver(admissionApplicationSchema),
    defaultValues: {
      studentName: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      address: "",
      previousSchool: "",
      appliedClassId: "",
    },
  });

  // Fetch available classes on component mount
  useEffect(() => {
    async function fetchClasses() {
      try {
        const availableClasses = await getAvailableClasses();
        setClasses(availableClasses);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setError("Failed to load available classes. Please refresh the page.");
      } finally {
        setIsLoadingClasses(false);
      }
    }

    fetchClasses();
  }, []);

  // Handle file upload
  const handleFileUpload = async (file: File, type: string) => {
    try {
      setUploadingDoc(type);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const result = await uploadAdmissionDocument(formData);

      if (result.success && result.data) {
        const uploadedDoc: UploadedDocument = {
          type: result.data.type,
          url: result.data.url,
          filename: result.data.filename,
          file,
        };

        // Update the appropriate state based on document type
        if (type === "BIRTH_CERTIFICATE") {
          setBirthCertificate(uploadedDoc);
        } else if (type === "PREVIOUS_REPORT_CARD") {
          setReportCard(uploadedDoc);
        } else if (type === "PHOTOGRAPH") {
          setPhotograph(uploadedDoc);
        }
      } else {
        setError(result.error || "Failed to upload document. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      setError("An unexpected error occurred while uploading. Please try again.");
    } finally {
      setUploadingDoc(null);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      // Validate file type based on document type
      if (type === "PHOTOGRAPH") {
        if (!file.type.startsWith("image/")) {
          setError("Photograph must be an image file");
          return;
        }
      } else {
        const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
        if (!allowedTypes.includes(file.type)) {
          setError("Document must be a PDF or image file");
          return;
        }
      }

      handleFileUpload(file, type);
    }
  };

  // Remove uploaded document
  const removeDocument = (type: string) => {
    if (type === "BIRTH_CERTIFICATE") {
      setBirthCertificate(null);
    } else if (type === "PREVIOUS_REPORT_CARD") {
      setReportCard(null);
    } else if (type === "PHOTOGRAPH") {
      setPhotograph(null);
    }
  };

  const onSubmit = async (data: AdmissionApplicationFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Collect uploaded documents
      const documents: Array<{ type: string; url: string; filename: string }> = [];
      if (birthCertificate) {
        documents.push({
          type: birthCertificate.type,
          url: birthCertificate.url,
          filename: birthCertificate.filename,
        });
      }
      if (reportCard) {
        documents.push({
          type: reportCard.type,
          url: reportCard.url,
          filename: reportCard.filename,
        });
      }
      if (photograph) {
        documents.push({
          type: photograph.type,
          url: photograph.url,
          filename: photograph.filename,
        });
      }

      const result = await createAdmissionApplication(data, documents);

      if (result.success && result.data) {
        setSuccess(true);
        setApplicationNumber(result.data.applicationNumber);
        form.reset();
        // Clear document uploads
        setBirthCertificate(null);
        setReportCard(null);
        setPhotograph(null);
      } else {
        setError(result.error || "Failed to submit application. Please try again.");
      }
    } catch (error: any) {
      console.error("Error submitting application:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success && applicationNumber) {
    return (
      <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto w-full">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Application Submitted Successfully!</CardTitle>
              <CardDescription>
                Your admission application has been received
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600 mb-2">Your Application Number</p>
                <p className="text-3xl font-bold text-blue-600">{applicationNumber}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Please save this number for future reference
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  <p className="font-semibold mb-2">What's Next?</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>A confirmation email has been sent to your registered email address</li>
                    <li>Our admissions team will review your application</li>
                    <li>You will be notified about the status within 5-7 business days</li>
                    <li>Keep your application number safe for tracking purposes</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setApplicationNumber(null);
                    setBirthCertificate(null);
                    setReportCard(null);
                    setPhotograph(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Submit Another Application
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="flex-1"
                >
                  Print Confirmation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">School Admission Portal</h1>
          <p className="text-lg text-gray-600">
            Apply for admission to our school for the upcoming academic year
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Admission Application Form</CardTitle>
            <CardDescription>
              Please fill in all the required information. Fields marked with * are mandatory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Student Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Student Information
                  </h3>

                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter student's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"
                                    }`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MALE">Male</SelectItem>
                              <SelectItem value="FEMALE">Female</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="appliedClassId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Applied Class *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoadingClasses}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={
                                isLoadingClasses ? "Loading classes..." : "Select class to apply for"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name} ({cls.academicYear.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousSchool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous School (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter previous school name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Parent Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Parent/Guardian Information
                  </h3>

                  <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent/Guardian Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter parent's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="parentEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="parent@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parentPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+1234567890"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter complete address"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Document Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Document Uploads
                  </h3>
                  <p className="text-sm text-gray-600">
                    Please upload the required documents. Accepted formats: PDF, JPG, PNG (Max 5MB each)
                  </p>

                  {/* Birth Certificate */}
                  <div className="space-y-2">
                    <Label htmlFor="birthCertificate">
                      Birth Certificate <span className="text-red-500">*</span>
                    </Label>
                    {!birthCertificate ? (
                      <div className="flex items-center gap-2">
                        <Input
                          id="birthCertificate"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, "BIRTH_CERTIFICATE")}
                          disabled={uploadingDoc === "BIRTH_CERTIFICATE"}
                          className="flex-1"
                        />
                        {uploadingDoc === "BIRTH_CERTIFICATE" && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="flex-1 text-sm text-green-700 truncate">
                          {birthCertificate.filename}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument("BIRTH_CERTIFICATE")}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Previous Report Card */}
                  <div className="space-y-2">
                    <Label htmlFor="reportCard">
                      Previous Report Card (Optional)
                    </Label>
                    {!reportCard ? (
                      <div className="flex items-center gap-2">
                        <Input
                          id="reportCard"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, "PREVIOUS_REPORT_CARD")}
                          disabled={uploadingDoc === "PREVIOUS_REPORT_CARD"}
                          className="flex-1"
                        />
                        {uploadingDoc === "PREVIOUS_REPORT_CARD" && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="flex-1 text-sm text-green-700 truncate">
                          {reportCard.filename}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument("PREVIOUS_REPORT_CARD")}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Photograph */}
                  <div className="space-y-2">
                    <Label htmlFor="photograph">
                      Student Photograph <span className="text-red-500">*</span>
                    </Label>
                    {!photograph ? (
                      <div className="flex items-center gap-2">
                        <Input
                          id="photograph"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, "PHOTOGRAPH")}
                          disabled={uploadingDoc === "PHOTOGRAPH"}
                          className="flex-1"
                        />
                        {uploadingDoc === "PHOTOGRAPH" && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <ImageIcon className="h-5 w-5 text-green-600" />
                        <span className="flex-1 text-sm text-green-700 truncate">
                          {photograph.filename}
                        </span>
                        {photograph.file && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={URL.createObjectURL(photograph.file)}
                            alt="Preview"
                            width={40}
                            height={40}
                            className="h-10 w-10 object-cover rounded"
                          />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument("PHOTOGRAPH")}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setBirthCertificate(null);
                      setReportCard(null);
                      setPhotograph(null);
                    }}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Reset Form
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      isLoadingClasses ||
                      !birthCertificate ||
                      !photograph ||
                      uploadingDoc !== null
                    }
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </div>

                {(!birthCertificate || !photograph) && (
                  <p className="text-sm text-amber-600 text-center">
                    Please upload Birth Certificate and Student Photograph to submit the application
                  </p>
                )}

                <p className="text-sm text-gray-500 text-center">
                  By submitting this form, you agree to our terms and conditions.
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Information Section */}
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Important Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>All fields marked with * are mandatory</li>
              <li>Birth Certificate and Student Photograph are required documents</li>
              <li>Previous Report Card is optional but recommended</li>
              <li>Accepted file formats: PDF, JPG, PNG (Maximum 5MB per file)</li>
              <li>Please ensure all information provided is accurate</li>
              <li>You will receive a confirmation email with your application number</li>
              <li>Keep your application number safe for future reference</li>
              <li>The admission team will review your application within 5-7 business days</li>
              <li>For any queries, please contact the admission office</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

