"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, X, Reply } from "lucide-react";
import { replyToMessage } from "@/lib/actions/student-communication-actions";

// Validation schema
const replySchema = z.object({
  content: z
    .string()
    .min(1, "Reply content is required")
    .max(10000, "Reply content must be less than 10000 characters"),
});

type ReplyFormData = z.infer<typeof replySchema>;

interface MessageReplyFormProps {
  originalMessage: {
    id: string;
    subject: string | null;
    content: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar: string | null;
      role: string;
    };
  };
  onReply?: () => void;
  onCancel: () => void;
}

export function MessageReplyForm({
  originalMessage,
  onReply,
  onCancel,
}: MessageReplyFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: ReplyFormData) => {
    setIsLoading(true);

    const result = await replyToMessage({
      messageId: originalMessage.id,
      content: data.content,
    });

    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully",
      });
      reset();
      onReply?.();
    } else {
      toast({
        title: "Failed to send reply",
        description: result.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "TEACHER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "STUDENT":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const replySubject = originalMessage.subject?.startsWith("Re: ")
    ? originalMessage.subject
    : `Re: ${originalMessage.subject || "(No Subject)"}`;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Reply className="h-5 w-5 text-primary" />
            <CardTitle>Reply to Message</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Send a reply to {originalMessage.sender.firstName}{" "}
          {originalMessage.sender.lastName}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Original Message Context */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Original Message
            </p>
          </div>

          {/* Recipient (Pre-filled) */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={originalMessage.sender.avatar || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {getInitials(
                  originalMessage.sender.firstName,
                  originalMessage.sender.lastName
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {originalMessage.sender.firstName}{" "}
                  {originalMessage.sender.lastName}
                </p>
                <Badge
                  variant="outline"
                  className={getRoleBadgeColor(originalMessage.sender.role)}
                >
                  {originalMessage.sender.role}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {originalMessage.sender.email}
              </p>
            </div>
          </div>

          {/* Subject (Pre-filled) */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <p className="text-sm font-medium">{replySubject}</p>
          </div>

          {/* Original Content Preview */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Original Message
            </Label>
            <div className="text-sm text-muted-foreground bg-background p-3 rounded border max-h-32 overflow-y-auto">
              <p className="whitespace-pre-wrap line-clamp-4">
                {originalMessage.content}
              </p>
            </div>
          </div>
        </div>

        {/* Reply Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Reply Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Your Reply <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Type your reply here..."
              className="min-h-[200px] resize-none"
              {...register("content")}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{watch("content")?.length || 0} / 10000 characters</span>
            </div>
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content.message}</p>
            )}
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Reply
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
