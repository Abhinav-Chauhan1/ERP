'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  category: string | null;
  status: string;
  userRSVP: string | null;
}

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const getRSVPBadgeVariant = (status: string | null) => {
    switch (status) {
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-xl">{event.title}</CardTitle>
              {event.category && (
                <Badge variant="outline" className="text-xs">
                  {event.category.replace(/_/g, ' ')}
                </Badge>
              )}
              {event.status && (
                <Badge 
                  variant={
                    event.status === 'UPCOMING' ? 'default' : 
                    event.status === 'ONGOING' ? 'secondary' : 
                    'outline'
                  }
                  className="text-xs"
                >
                  {event.status}
                </Badge>
              )}
              {event.userRSVP && (
                <Badge variant={getRSVPBadgeVariant(event.userRSVP)} className="text-xs">
                  {event.userRSVP}
                </Badge>
              )}
            </div>
            {event.description && (
              <CardDescription className="line-clamp-2">
                {event.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Link href={`/teacher/events/${event.id}`}>
              <Button variant="ghost" size="sm" className="gap-2" aria-label={`View details for ${event.title}`}>
                View Details
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
