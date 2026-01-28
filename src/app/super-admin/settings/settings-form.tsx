"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { updateSchoolInfo } from "@/lib/actions/settingsActions";
import { Loader2 } from "lucide-react";

interface SettingsFormProps {
    initialSettings: any;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        schoolName: initialSettings.schoolName || "",
        schoolEmail: initialSettings.schoolEmail || "",
        schoolPhone: initialSettings.schoolPhone || "",
        schoolAddress: initialSettings.schoolAddress || "",
        schoolWebsite: initialSettings.schoolWebsite || "",
        tagline: initialSettings.tagline || "",
        timezone: initialSettings.timezone || "UTC",
        schoolCode: initialSettings.schoolCode || "",
        affiliationNumber: initialSettings.affiliationNumber || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await updateSchoolInfo(formData);

            if (result.success) {
                toast({
                    title: "Settings updated",
                    description: "System settings have been updated successfully.",
                });
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to update settings.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General Information</TabsTrigger>
                    <TabsTrigger value="contact">Contact Details</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                            <CardDescription>Basic system identity settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="schoolName">Platform Name / School Name</Label>
                                <Input
                                    id="schoolName"
                                    name="schoolName"
                                    value={formData.schoolName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tagline">Tagline</Label>
                                <Input
                                    id="tagline"
                                    name="tagline"
                                    value={formData.tagline}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="timezone">System Timezone</Label>
                                <Input
                                    id="timezone"
                                    name="timezone"
                                    value={formData.timezone}
                                    onChange={handleChange}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contact">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>Public contact details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="schoolEmail">Email Address</Label>
                                    <Input
                                        id="schoolEmail"
                                        name="schoolEmail"
                                        type="email"
                                        value={formData.schoolEmail}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="schoolPhone">Phone Number</Label>
                                    <Input
                                        id="schoolPhone"
                                        name="schoolPhone"
                                        value={formData.schoolPhone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="schoolWebsite">Website</Label>
                                    <Input
                                        id="schoolWebsite"
                                        name="schoolWebsite"
                                        value={formData.schoolWebsite}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="schoolAddress">Address</Label>
                                <Input
                                    id="schoolAddress"
                                    name="schoolAddress"
                                    value={formData.schoolAddress}
                                    onChange={handleChange}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
