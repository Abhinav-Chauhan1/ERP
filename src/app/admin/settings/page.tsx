"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings, School, Bell, Mail, Shield, Database,
  Palette, Globe, Clock, DollarSign, FileText, Users, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getSystemSettings,
  updateGeneralSettings,
  updateAcademicSettings,
  updateNotificationSettings,
  updateSecuritySettings,
  updateAppearanceSettings,
  triggerBackup,
} from "@/lib/actions/settingsActions";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // School Information
  const [schoolName, setSchoolName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [schoolWebsite, setSchoolWebsite] = useState("");
  const [schoolFax, setSchoolFax] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  
  // Academic Settings
  const [academicYear, setAcademicYear] = useState("");
  const [currentTerm, setCurrentTerm] = useState("");
  const [gradingSystem, setGradingSystem] = useState("percentage");
  const [passingGrade, setPassingGrade] = useState(50);
  const [autoAttendance, setAutoAttendance] = useState(false);
  const [lateArrivalThreshold, setLateArrivalThreshold] = useState(15);
  
  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [notifyEnrollment, setNotifyEnrollment] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(true);
  const [notifyAttendance, setNotifyAttendance] = useState(true);
  const [notifyExamResults, setNotifyExamResults] = useState(true);
  const [notifyLeaveApps, setNotifyLeaveApps] = useState(true);
  
  // Security Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [passwordExpiry, setPasswordExpiry] = useState(90);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  
  // Appearance Settings
  const [theme, setTheme] = useState("light");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [language, setLanguage] = useState("en");
  const [dateFormat, setDateFormat] = useState("mdy");

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await getSystemSettings();
      if (result.success && result.data) {
        const settings = result.data;
        
        // General
        setSchoolName(settings.schoolName || "");
        setSchoolEmail(settings.schoolEmail || "");
        setSchoolPhone(settings.schoolPhone || "");
        setSchoolAddress(settings.schoolAddress || "");
        setSchoolWebsite(settings.schoolWebsite || "");
        setSchoolFax(settings.schoolFax || "");
        setTimezone(settings.timezone || "UTC");
        
        // Academic
        setAcademicYear(settings.currentAcademicYear || "");
        setCurrentTerm(settings.currentTerm || "");
        setGradingSystem(settings.gradingSystem || "percentage");
        setPassingGrade(settings.passingGrade || 50);
        setAutoAttendance(settings.autoAttendance || false);
        setLateArrivalThreshold(settings.lateArrivalThreshold || 15);
        
        // Notifications
        setEmailNotifications(settings.emailNotifications ?? true);
        setSmsNotifications(settings.smsNotifications ?? false);
        setPushNotifications(settings.pushNotifications ?? true);
        setNotifyEnrollment(settings.notifyEnrollment ?? true);
        setNotifyPayment(settings.notifyPayment ?? true);
        setNotifyAttendance(settings.notifyAttendance ?? true);
        setNotifyExamResults(settings.notifyExamResults ?? true);
        setNotifyLeaveApps(settings.notifyLeaveApps ?? true);
        
        // Security
        setTwoFactorAuth(settings.twoFactorAuth ?? false);
        setSessionTimeout(settings.sessionTimeout || 30);
        setPasswordExpiry(settings.passwordExpiry || 90);
        setAutoBackup(settings.autoBackup ?? true);
        setBackupFrequency(settings.backupFrequency || "daily");
        
        // Appearance
        setTheme(settings.theme || "light");
        setPrimaryColor(settings.primaryColor || "#3b82f6");
        setLanguage(settings.language || "en");
        setDateFormat(settings.dateFormat || "mdy");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setInitialLoading(false);
    }
  };
  
  const handleSaveGeneral = async () => {
    // Validation
    if (!schoolName.trim()) {
      toast.error("School name is required");
      return;
    }

    if (schoolEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const result = await updateGeneralSettings({
        schoolName: schoolName.trim(),
        schoolEmail: schoolEmail || undefined,
        schoolPhone: schoolPhone || undefined,
        schoolAddress: schoolAddress || undefined,
        schoolWebsite: schoolWebsite || undefined,
        schoolFax: schoolFax || undefined,
        timezone,
      });
      
      if (result.success) {
        toast.success("General settings saved successfully");
        setHasUnsavedChanges(false);
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving general settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAcademic = async () => {
    // Validation
    if (passingGrade < 0 || passingGrade > 100) {
      toast.error("Passing grade must be between 0 and 100");
      return;
    }

    if (lateArrivalThreshold < 0 || lateArrivalThreshold > 60) {
      toast.error("Late arrival threshold must be between 0 and 60 minutes");
      return;
    }

    setLoading(true);
    try {
      const result = await updateAcademicSettings({
        currentAcademicYear: academicYear || undefined,
        currentTerm: currentTerm || undefined,
        gradingSystem,
        passingGrade,
        autoAttendance,
        lateArrivalThreshold,
      });
      
      if (result.success) {
        toast.success("Academic settings saved successfully");
        setHasUnsavedChanges(false);
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving academic settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      const result = await updateNotificationSettings({
        emailNotifications,
        smsNotifications,
        pushNotifications,
        notifyEnrollment,
        notifyPayment,
        notifyAttendance,
        notifyExamResults,
        notifyLeaveApps,
      });
      
      if (result.success) {
        toast.success("Notification settings saved successfully");
        setHasUnsavedChanges(false);
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    // Validation
    if (sessionTimeout < 5 || sessionTimeout > 1440) {
      toast.error("Session timeout must be between 5 and 1440 minutes");
      return;
    }

    if (passwordExpiry < 30 || passwordExpiry > 365) {
      toast.error("Password expiry must be between 30 and 365 days");
      return;
    }

    setLoading(true);
    try {
      const result = await updateSecuritySettings({
        twoFactorAuth,
        sessionTimeout,
        passwordExpiry,
        autoBackup,
        backupFrequency,
      });
      
      if (result.success) {
        toast.success("Security settings saved successfully");
        setHasUnsavedChanges(false);
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving security settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppearance = async () => {
    setLoading(true);
    try {
      const result = await updateAppearanceSettings({
        theme,
        primaryColor,
        language,
        dateFormat,
      });
      
      if (result.success) {
        toast.success("Appearance settings saved successfully");
        setHasUnsavedChanges(false);
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving appearance settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleBackupNow = async () => {
    setLoading(true);
    try {
      const result = await triggerBackup();
      
      if (result.success) {
        toast.success("Backup initiated successfully");
      } else {
        toast.error(result.error || "Failed to trigger backup");
      }
    } catch (error) {
      console.error("Error triggering backup:", error);
      toast.error("Failed to trigger backup");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your school's system configuration and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <School className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="academic">
            <FileText className="h-4 w-4 mr-2" />
            Academic
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
              <CardDescription>
                Basic information about your educational institution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input
                    id="schoolName"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Enter school name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolEmail">Email Address</Label>
                  <Input
                    id="schoolEmail"
                    type="email"
                    value={schoolEmail}
                    onChange={(e) => setSchoolEmail(e.target.value)}
                    placeholder="school@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolPhone">Phone Number</Label>
                  <Input
                    id="schoolPhone"
                    value={schoolPhone}
                    onChange={(e) => setSchoolPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolAddress">Address</Label>
                <Textarea
                  id="schoolAddress"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  placeholder="Enter school address"
                  rows={3}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Additional contact details for communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={schoolWebsite}
                    onChange={(e) => setSchoolWebsite(e.target.value)}
                    placeholder="https://www.school.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fax">Fax Number</Label>
                  <Input
                    id="fax"
                    value={schoolFax}
                    onChange={(e) => setSchoolFax(e.target.value)}
                    placeholder="+1 234 567 8901"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Settings */}
        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Configuration</CardTitle>
              <CardDescription>
                Configure academic year, terms, and grading system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Current Academic Year</Label>
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger id="academicYear">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2023-2024">2023-2024</SelectItem>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentTerm">Current Term</Label>
                  <Select value={currentTerm} onValueChange={setCurrentTerm}>
                    <SelectTrigger id="currentTerm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Term 1</SelectItem>
                      <SelectItem value="2">Term 2</SelectItem>
                      <SelectItem value="3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradingSystem">Grading System</Label>
                  <Select value={gradingSystem} onValueChange={setGradingSystem}>
                    <SelectTrigger id="gradingSystem">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (0-100)</SelectItem>
                      <SelectItem value="gpa">GPA (0-4.0)</SelectItem>
                      <SelectItem value="letter">Letter Grades (A-F)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passingGrade">Passing Grade</Label>
                  <Input
                    id="passingGrade"
                    type="number"
                    value={passingGrade}
                    onChange={(e) => setPassingGrade(parseInt(e.target.value) || 50)}
                    placeholder="50"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveAcademic} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Settings</CardTitle>
              <CardDescription>
                Configure attendance tracking and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Attendance Marking</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically mark students as absent if not marked present
                  </p>
                </div>
                <Switch checked={autoAttendance} onCheckedChange={setAutoAttendance} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Late Arrival Threshold</Label>
                  <p className="text-sm text-muted-foreground">
                    Minutes after class start to mark as late
                  </p>
                </div>
                <Input 
                  type="number" 
                  value={lateArrivalThreshold} 
                  onChange={(e) => setLateArrivalThreshold(parseInt(e.target.value) || 15)}
                  className="w-20" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <Label>Email Notifications</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <Label>SMS Notifications</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via SMS
                  </p>
                </div>
                <Switch
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <Label>Push Notifications</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in browser
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose which events trigger notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>New Student Enrollment</Label>
                <Switch checked={notifyEnrollment} onCheckedChange={setNotifyEnrollment} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Fee Payment Received</Label>
                <Switch checked={notifyPayment} onCheckedChange={setNotifyPayment} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Attendance Alerts</Label>
                <Switch checked={notifyAttendance} onCheckedChange={setNotifyAttendance} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Exam Results Published</Label>
                <Switch checked={notifyExamResults} onCheckedChange={setNotifyExamResults} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Leave Applications</Label>
                <Switch checked={notifyLeaveApps} onCheckedChange={setNotifyLeaveApps} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
              <CardDescription>
                Manage security settings and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for admin accounts
                  </p>
                </div>
                <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto logout after inactivity (minutes)
                  </p>
                </div>
                <Input 
                  type="number" 
                  value={sessionTimeout} 
                  onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 30)}
                  className="w-20" 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Password Expiry</Label>
                  <p className="text-sm text-muted-foreground">
                    Require password change every (days)
                  </p>
                </div>
                <Input 
                  type="number" 
                  value={passwordExpiry} 
                  onChange={(e) => setPasswordExpiry(parseInt(e.target.value) || 90)}
                  className="w-20" 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data & Backup</CardTitle>
              <CardDescription>
                Manage data backup and retention policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable daily automatic backups
                  </p>
                </div>
                <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
              </div>
              <div className="space-y-2">
                <Label>Backup Frequency</Label>
                <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBackupNow} disabled={loading}>
                  <Database className="h-4 w-4 mr-2" />
                  {loading ? "Processing..." : "Backup Now"}
                </Button>
                <Button variant="outline">
                  View Backups
                </Button>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveSecurity} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Display</CardTitle>
              <CardDescription>
                Customize the look and feel of your system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2 items-center">
                  <div 
                    onClick={() => setPrimaryColor("#3b82f6")}
                    className={`w-10 h-10 rounded-md bg-blue-600 cursor-pointer border-2 ${primaryColor === "#3b82f6" ? "border-blue-600 ring-2 ring-blue-300" : "border-transparent hover:border-gray-300"}`}
                  ></div>
                  <div 
                    onClick={() => setPrimaryColor("#16a34a")}
                    className={`w-10 h-10 rounded-md bg-green-600 cursor-pointer border-2 ${primaryColor === "#16a34a" ? "border-green-600 ring-2 ring-green-300" : "border-transparent hover:border-gray-300"}`}
                  ></div>
                  <div 
                    onClick={() => setPrimaryColor("#9333ea")}
                    className={`w-10 h-10 rounded-md bg-purple-600 cursor-pointer border-2 ${primaryColor === "#9333ea" ? "border-purple-600 ring-2 ring-purple-300" : "border-transparent hover:border-gray-300"}`}
                  ></div>
                  <div 
                    onClick={() => setPrimaryColor("#ea580c")}
                    className={`w-10 h-10 rounded-md bg-orange-600 cursor-pointer border-2 ${primaryColor === "#ea580c" ? "border-orange-600 ring-2 ring-orange-300" : "border-transparent hover:border-gray-300"}`}
                  ></div>
                  <div 
                    onClick={() => setPrimaryColor("#dc2626")}
                    className={`w-10 h-10 rounded-md bg-red-600 cursor-pointer border-2 ${primaryColor === "#dc2626" ? "border-red-600 ring-2 ring-red-300" : "border-transparent hover:border-gray-300"}`}
                  ></div>
                  <Input 
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveAppearance} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo & Branding</CardTitle>
              <CardDescription>
                Upload your school logo and customize branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>School Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <School className="h-8 w-8 text-gray-400" />
                  </div>
                  <Button variant="outline">Upload Logo</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-gray-400" />
                  </div>
                  <Button variant="outline">Upload Favicon</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
