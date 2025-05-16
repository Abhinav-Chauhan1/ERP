import { UserRole } from "@prisma/client";

declare module "@clerk/nextjs" {
  interface PublicMetadata {
    role?: UserRole;
  }
}
