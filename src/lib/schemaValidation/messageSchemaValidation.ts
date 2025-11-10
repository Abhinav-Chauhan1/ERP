import { z } from "zod";

// Message Schema
export const messageSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  subject: z.string().optional().nullable(),
  content: z.string().min(1, "Message content is required"),
  attachments: z.string().optional().nullable(),
});

export type MessageFormValues = z.infer<typeof messageSchema>;

// Reply Schema
export const replySchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  content: z.string().min(1, "Reply content is required"),
});

export type ReplyFormValues = z.infer<typeof replySchema>;

// Forward Schema
export const forwardSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  recipientId: z.string().min(1, "Recipient is required"),
});

export type ForwardFormValues = z.infer<typeof forwardSchema>;
