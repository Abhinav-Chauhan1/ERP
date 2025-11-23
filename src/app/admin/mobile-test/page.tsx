"use client";


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { Badge } from "@/components/ui/badge";

export default function MobileTestPage() {
  const [switchValue, setSwitchValue] = useState(false);

  // Sample data for responsive table
  const sampleData = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "Admin", status: "Active" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "Teacher", status: "Active" },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "Student", status: "Inactive" },
  ];

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (item: typeof sampleData[0]) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: "email",
      label: "Email Address",
      mobileLabel: "Email",
      render: (item: typeof sampleData[0]) => item.email,
    },
    {
      key: "role",
      label: "Role",
      render: (item: typeof sampleData[0]) => item.role,
    },
    {
      key: "status",
      label: "Status",
      render: (item: typeof sampleData[0]) => (
        <Badge variant={item.status === "Active" ? "default" : "secondary"}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: typeof sampleData[0]) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost">Edit</Button>
          <Button size="sm" variant="ghost">Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Mobile Responsiveness Test Page</h1>
        <p className="text-muted-foreground">
          This page demonstrates mobile-responsive components. Resize your browser or view on a mobile device to see the responsive behavior.
        </p>
      </div>

      {/* Touch-Friendly Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Touch-Friendly Buttons (44px min on mobile)</CardTitle>
          <CardDescription>All buttons meet WCAG 2.1 AA touch target guidelines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Default Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small Button</Button>
            <Button size="default">Default Size</Button>
            <Button size="lg">Large Button</Button>
            <Button size="icon">🔍</Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Touch-Friendly Form Controls</CardTitle>
          <CardDescription>Larger touch targets on mobile devices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter your name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Enter your message" />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms" className="text-sm font-normal">
              I agree to the terms and conditions
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Notification Preference</Label>
            <RadioGroup defaultValue="email">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email-radio" />
                <Label htmlFor="email-radio" className="font-normal">Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="sms-radio" />
                <Label htmlFor="sms-radio" className="font-normal">SMS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both-radio" />
                <Label htmlFor="both-radio" className="font-normal">Both</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Enable Notifications</Label>
            <Switch
              id="notifications"
              checked={switchValue}
              onCheckedChange={setSwitchValue}
            />
          </div>
        </CardContent>
      </Card>

      {/* Responsive Table */}
      <Card>
        <CardHeader>
          <CardTitle>Responsive Table</CardTitle>
          <CardDescription>
            Table view on desktop, card view on mobile (&lt; 768px)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={sampleData}
            columns={columns}
            keyExtractor={(item) => item.id}
          />
        </CardContent>
      </Card>

      {/* Responsive Layout Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Responsive Layouts</CardTitle>
          <CardDescription>Layouts that adapt to screen size</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Flex Layout (Column on mobile, Row on desktop)</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 p-4 bg-primary/10 rounded-md">Box 1</div>
              <div className="flex-1 p-4 bg-primary/10 rounded-md">Box 2</div>
              <div className="flex-1 p-4 bg-primary/10 rounded-md">Box 3</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Grid Layout (1 col mobile, 2 col tablet, 3 col desktop)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary/50 rounded-md">Card 1</div>
              <div className="p-4 bg-secondary/50 rounded-md">Card 2</div>
              <div className="p-4 bg-secondary/50 rounded-md">Card 3</div>
              <div className="p-4 bg-secondary/50 rounded-md">Card 4</div>
              <div className="p-4 bg-secondary/50 rounded-md">Card 5</div>
              <div className="p-4 bg-secondary/50 rounded-md">Card 6</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Desktop Testing:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Resize your browser window to see responsive behavior</li>
            <li>Use browser DevTools responsive mode</li>
            <li>Test at 375px, 768px, and 1024px widths</li>
          </ul>
          <p className="mt-4"><strong>Mobile Device Testing:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Test on actual iOS and Android devices</li>
            <li>Verify touch targets are easy to tap</li>
            <li>Check that tables transform to cards</li>
            <li>Ensure forms are easy to fill out</li>
          </ul>
          <p className="mt-4"><strong>Key Breakpoint:</strong> 768px (md) - Primary mobile/desktop transition</p>
        </CardContent>
      </Card>
    </div>
  );
}

