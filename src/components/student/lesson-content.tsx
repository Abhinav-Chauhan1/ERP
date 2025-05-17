"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, FileText, ExternalLink } from "lucide-react";

interface Resource {
  name: string;
  description?: string;
  url: string;
  type: "download" | "link" | "document";
}

interface LessonContentProps {
  content: string;
  resources: Resource[];
}

export function LessonContent({ content, resources }: LessonContentProps) {
  const [activeTab, setActiveTab] = useState("content");

  return (
    <Card>
      <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b px-6 pt-6">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="content">Lesson Content</TabsTrigger>
            <TabsTrigger value="resources" disabled={resources.length === 0}>
              Resources {resources.length > 0 && `(${resources.length})`}
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="content" className="mt-0">
          <CardContent className="p-6">
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="resources" className="mt-0">
          <CardContent className="p-6">
            <div className="space-y-4">
              {resources.map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center">
                    <div className="rounded-md bg-blue-50 p-2 mr-3">
                      {resource.type === "download" ? (
                        <Download className="h-4 w-4 text-blue-700" />
                      ) : resource.type === "link" ? (
                        <ExternalLink className="h-4 w-4 text-blue-700" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-700" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{resource.name}</h4>
                      {resource.description && (
                        <p className="text-sm text-gray-500">{resource.description}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      {resource.type === "download" ? "Download" : "Open"}
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
