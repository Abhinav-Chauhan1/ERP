"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { getAvailableClasses, createAdmissionApplication } from "@/lib/actions/admissionActions";
import Link from "next/link";

export default function CreateAdmissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);

  // Student Information
  const [studentName, setStudentName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [gender, setGender] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [abcId, setAbcId] = useState("");
  const [nationality, setNationality] = useState("Indian");
  const [religion, setReligion] = useState("");
  const [caste, setCaste] = useState("");
  const [category, setCategory] = useState("");
  const [motherTongue, setMotherTongue] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [previousSchool, setPreviousSchool] = useState("");
  const [tcNumber, setTcNumber] = useState("");
  const [classAppliedFor, setClassAppliedFor] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [specialNeeds, setSpecialNeeds] = useState("");

  // Parent/Guardian Information
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [address, setAddress] = useState("");

  // Father Details
  const [fatherName, setFatherName] = useState("");
  const [fatherOccupation, setFatherOccupation] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [fatherEmail, setFatherEmail] = useState("");
  const [fatherAadhaar, setFatherAadhaar] = useState("");

  // Mother Details
  const [motherName, setMotherName] = useState("");
  const [motherOccupation, setMotherOccupation] = useState("");
  const [motherPhone, setMotherPhone] = useState("");
  const [motherEmail, setMotherEmail] = useState("");
  const [motherAadhaar, setMotherAadhaar] = useState("");

  // Guardian Details
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianAadhaar, setGuardianAadhaar] = useState("");

  const [annualIncome, setAnnualIncome] = useState("");

  useEffect(() => {
    async function loadClasses() {
      try {
        const classesData = await getAvailableClasses();
        setClasses(classesData);
      } catch (error) {
        console.error("Error loading classes:", error);
        toast.error("Failed to load classes");
      }
    }
    loadClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!studentName || !dateOfBirth || !gender || !classAppliedFor || !parentName || !parentEmail || !parentPhone || !address) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const result = await createAdmissionApplication({
        studentName,
        dateOfBirth,
        gender: gender as "MALE" | "FEMALE" | "OTHER",
        parentName,
        parentEmail,
        parentPhone,
        address,
        previousSchool: previousSchool || undefined,
        appliedClassId: classAppliedFor,

        // Indian-specific fields
        aadhaarNumber: aadhaarNumber || undefined,
        abcId: abcId || undefined,
        nationality: nationality || undefined,
        religion: religion || undefined,
        caste: caste || undefined,
        category: category as any || undefined,
        motherTongue: motherTongue || undefined,
        birthPlace: birthPlace || undefined,
        bloodGroup: bloodGroup || undefined,
        tcNumber: tcNumber || undefined,
        medicalConditions: medicalConditions || undefined,
        specialNeeds: specialNeeds || undefined,

        // Parent/Guardian details
        fatherName: fatherName || undefined,
        fatherOccupation: fatherOccupation || undefined,
        fatherPhone: fatherPhone || undefined,
        fatherEmail: fatherEmail || undefined,
        fatherAadhaar: fatherAadhaar || undefined,
        motherName: motherName || undefined,
        motherOccupation: motherOccupation || undefined,
        motherPhone: motherPhone || undefined,
        motherEmail: motherEmail || undefined,
        motherAadhaar: motherAadhaar || undefined,
        guardianName: guardianName || undefined,
        guardianRelation: guardianRelation || undefined,
        guardianPhone: guardianPhone || undefined,
        guardianEmail: guardianEmail || undefined,
        guardianAadhaar: guardianAadhaar || undefined,
        annualIncome: annualIncome ? parseFloat(annualIncome) : undefined,
      });

      if (result.success) {
        toast.success("Admission application created successfully");
        router.push("/admin/admissions");
      } else {
        toast.error(result.error || "Failed to create admission");
      }
    } catch (error) {
      console.error("Error creating admission:", error);
      toast.error("An error occurred while creating admission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href="/admin/admissions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Admission Application</h1>
          <p className="text-muted-foreground">Create a new admission application</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="studentName">
                    Student Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter student name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    date={dateOfBirth}
                    onSelect={setDateOfBirth}
                    disabled={(date) => date > new Date()}
                    startYear={1950}
                    endYear={new Date().getFullYear()}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                  <Input
                    id="aadhaarNumber"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="12-digit Aadhaar number"
                    maxLength={12}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abcId">ABC ID</Label>
                  <Input
                    id="abcId"
                    value={abcId}
                    onChange={(e) => setAbcId(e.target.value)}
                    placeholder="Academic Bank of Credits ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="Nationality"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="religion">Religion</Label>
                  <Input
                    id="religion"
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    placeholder="Religion"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caste">Caste</Label>
                  <Input
                    id="caste"
                    value={caste}
                    onChange={(e) => setCaste(e.target.value)}
                    placeholder="Caste"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="OBC">OBC</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="ST">ST</SelectItem>
                      <SelectItem value="EWS">EWS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motherTongue">Mother Tongue</Label>
                  <Input
                    id="motherTongue"
                    value={motherTongue}
                    onChange={(e) => setMotherTongue(e.target.value)}
                    placeholder="Mother tongue"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthPlace">Birth Place</Label>
                  <Input
                    id="birthPlace"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="Place of birth"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select value={bloodGroup} onValueChange={setBloodGroup}>
                    <SelectTrigger id="bloodGroup">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classAppliedFor">
                    Class Applied For <span className="text-red-500">*</span>
                  </Label>
                  <Select value={classAppliedFor} onValueChange={setClassAppliedFor}>
                    <SelectTrigger id="classAppliedFor">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousSchool">Previous School</Label>
                  <Input
                    id="previousSchool"
                    value={previousSchool}
                    onChange={(e) => setPreviousSchool(e.target.value)}
                    placeholder="Enter previous school name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tcNumber">TC Number</Label>
                  <Input
                    id="tcNumber"
                    value={tcNumber}
                    onChange={(e) => setTcNumber(e.target.value)}
                    placeholder="Transfer Certificate Number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalConditions">Medical Conditions</Label>
                <Textarea
                  id="medicalConditions"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="Any medical conditions or allergies"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialNeeds">Special Needs</Label>
                <Textarea
                  id="specialNeeds"
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  placeholder="Any special educational needs"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Primary Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="parentName">
                    Contact Person Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="parentName"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Enter contact person name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentEmail">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentPhone">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="parentPhone"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full address"
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Father Details */}
          <Card>
            <CardHeader>
              <CardTitle>Father Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fatherName">Father Name</Label>
                  <Input
                    id="fatherName"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Enter father's name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fatherOccupation">Occupation</Label>
                  <Input
                    id="fatherOccupation"
                    value={fatherOccupation}
                    onChange={(e) => setFatherOccupation(e.target.value)}
                    placeholder="Enter occupation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fatherPhone">Phone</Label>
                  <Input
                    id="fatherPhone"
                    value={fatherPhone}
                    onChange={(e) => setFatherPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fatherEmail">Email</Label>
                  <Input
                    id="fatherEmail"
                    type="email"
                    value={fatherEmail}
                    onChange={(e) => setFatherEmail(e.target.value)}
                    placeholder="Enter email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fatherAadhaar">Aadhaar Number</Label>
                  <Input
                    id="fatherAadhaar"
                    value={fatherAadhaar}
                    onChange={(e) => setFatherAadhaar(e.target.value)}
                    placeholder="12-digit Aadhaar number"
                    maxLength={12}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mother Details */}
          <Card>
            <CardHeader>
              <CardTitle>Mother Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="motherName">Mother Name</Label>
                  <Input
                    id="motherName"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="Enter mother's name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motherOccupation">Occupation</Label>
                  <Input
                    id="motherOccupation"
                    value={motherOccupation}
                    onChange={(e) => setMotherOccupation(e.target.value)}
                    placeholder="Enter occupation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motherPhone">Phone</Label>
                  <Input
                    id="motherPhone"
                    value={motherPhone}
                    onChange={(e) => setMotherPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motherEmail">Email</Label>
                  <Input
                    id="motherEmail"
                    type="email"
                    value={motherEmail}
                    onChange={(e) => setMotherEmail(e.target.value)}
                    placeholder="Enter email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motherAadhaar">Aadhaar Number</Label>
                  <Input
                    id="motherAadhaar"
                    value={motherAadhaar}
                    onChange={(e) => setMotherAadhaar(e.target.value)}
                    placeholder="12-digit Aadhaar number"
                    maxLength={12}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guardian Details */}
          <Card>
            <CardHeader>
              <CardTitle>Guardian Details (If Applicable)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="guardianName">Guardian Name</Label>
                  <Input
                    id="guardianName"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Enter guardian's name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianRelation">Relation</Label>
                  <Input
                    id="guardianRelation"
                    value={guardianRelation}
                    onChange={(e) => setGuardianRelation(e.target.value)}
                    placeholder="Relation to student"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianPhone">Phone</Label>
                  <Input
                    id="guardianPhone"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianEmail">Email</Label>
                  <Input
                    id="guardianEmail"
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="Enter email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianAadhaar">Aadhaar Number</Label>
                  <Input
                    id="guardianAadhaar"
                    value={guardianAadhaar}
                    onChange={(e) => setGuardianAadhaar(e.target.value)}
                    placeholder="12-digit Aadhaar number"
                    maxLength={12}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="annualIncome">Annual Family Income (₹)</Label>
                <Input
                  id="annualIncome"
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  placeholder="Enter annual income"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/admissions">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Application"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
