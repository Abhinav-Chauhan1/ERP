'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, X, HelpCircle, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface EventRSVPButtonProps {
  eventId: string;
  currentStatus: string | null;
}

export function EventRSVPButton({ eventId, currentStatus }: EventRSVPButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRSVP = async (status: 'ACCEPTED' | 'DECLINED' | 'MAYBE') => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/teacher/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update RSVP');
      }

      toast({
        title: 'RSVP Updated',
        description: `You have ${status.toLowerCase()} this event.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update RSVP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    switch (currentStatus) {
      case 'ACCEPTED':
        return 'Attending';
      case 'DECLINED':
        return 'Not Attending';
      case 'MAYBE':
        return 'Maybe';
      default:
        return 'RSVP';
    }
  };

  const getButtonVariant = () => {
    switch (currentStatus) {
      case 'ACCEPTED':
        return 'default';
      case 'DECLINED':
        return 'destructive';
      case 'MAYBE':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getButtonIcon = () => {
    switch (currentStatus) {
      case 'ACCEPTED':
        return <Check className="h-4 w-4" aria-hidden="true" />;
      case 'DECLINED':
        return <X className="h-4 w-4" aria-hidden="true" />;
      case 'MAYBE':
        return <HelpCircle className="h-4 w-4" aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={getButtonVariant()}
          disabled={isLoading}
          className="gap-2"
          aria-label="Update RSVP status"
        >
          {getButtonIcon()}
          {getButtonText()}
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => handleRSVP('ACCEPTED')}
          disabled={isLoading}
          className="gap-2"
        >
          <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
          Accept
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleRSVP('MAYBE')}
          disabled={isLoading}
          className="gap-2"
        >
          <HelpCircle className="h-4 w-4 text-yellow-600" aria-hidden="true" />
          Maybe
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleRSVP('DECLINED')}
          disabled={isLoading}
          className="gap-2"
        >
          <X className="h-4 w-4 text-red-600" aria-hidden="true" />
          Decline
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
