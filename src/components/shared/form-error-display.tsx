import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FormErrorDisplayProps {
  errors?: Array<{ field: string; message: string }>;
  message?: string;
  className?: string;
}

/**
 * Display validation errors in a user-friendly format
 * Shows a general error message and/or specific field errors
 */
export function FormErrorDisplay({ errors, message, className }: FormErrorDisplayProps) {
  if (!errors && !message) {
    return null;
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {message && <p className="mb-2">{message}</p>}
        {errors && errors.length > 0 && (
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>
                <span className="font-medium">{error.field}:</span> {error.message}
              </li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
