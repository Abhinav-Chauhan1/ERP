"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Info, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle,
  ExternalLink,
  BookOpen,
  Video,
  FileText,
  MessageCircle,
  X
} from "lucide-react";

// Help Content Types
export interface HelpContent {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'tip' | 'warning' | 'info' | 'tutorial' | 'faq';
  category?: string;
  tags?: string[];
  relatedLinks?: Array<{
    title: string;
    url: string;
    type: 'internal' | 'external';
  }>;
  videoUrl?: string;
  lastUpdated?: Date;
}

// Quick Help Tooltip
interface QuickHelpProps {
  content: string;
  title?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  children?: ReactNode;
}

export function QuickHelp({ 
  content, 
  title, 
  side = 'top', 
  className, 
  children 
}: QuickHelpProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className={cn('h-5 w-5 p-0', className)}>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Help</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent side={side} className="w-80">
        {title && (
          <div className="font-medium mb-2">{title}</div>
        )}
        <p className="text-sm text-muted-foreground">{content}</p>
      </PopoverContent>
    </Popover>
  );
}

// Inline Help Text
interface InlineHelpProps {
  children: ReactNode;
  type?: 'info' | 'tip' | 'warning' | 'success';
  className?: string;
}

export function InlineHelp({ children, type = 'info', className }: InlineHelpProps) {
  const config = {
    info: {
      icon: Info,
      className: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    tip: {
      icon: Lightbulb,
      className: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    },
    warning: {
      icon: AlertTriangle,
      className: 'text-orange-600 bg-orange-50 border-orange-200',
    },
    success: {
      icon: CheckCircle,
      className: 'text-green-600 bg-green-50 border-green-200',
    },
  };

  const { icon: Icon, className: typeClassName } = config[type];

  return (
    <div className={cn(
      'flex items-start gap-2 p-3 rounded-md border text-sm',
      typeClassName,
      className
    )}>
      <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

// Help Panel Component
interface HelpPanelProps {
  helpContent: HelpContent[];
  searchable?: boolean;
  categorized?: boolean;
  className?: string;
}

export function HelpPanel({ 
  helpContent, 
  searchable = true, 
  categorized = true, 
  className 
}: HelpPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedContent, setSelectedContent] = useState<HelpContent | null>(null);

  // Filter content based on search and category
  const filteredContent = helpContent.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(helpContent.map(item => item.category).filter((category): category is string => Boolean(category))));

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tip':
        return <Lightbulb className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'tutorial':
        return <BookOpen className="h-4 w-4" />;
      case 'faq':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'tip':
        return 'secondary';
      case 'warning':
        return 'destructive';
      case 'tutorial':
        return 'default';
      case 'faq':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters */}
      {(searchable || categorized) && (
        <div className="space-y-3">
          {searchable && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search help content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              />
            </div>
          )}
          
          {categorized && categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Help Content List */}
      <div className="space-y-3">
        {filteredContent.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No help content found matching your criteria.</p>
          </div>
        ) : (
          filteredContent.map(item => (
            <Card 
              key={item.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedContent(item)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </div>
                  <Badge variant={getTypeBadgeVariant(item.type) as any}>
                    {item.type}
                  </Badge>
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              {item.tags && item.tags.length > 0 && (
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Help Content Detail Dialog */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedContent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {getTypeIcon(selectedContent.type)}
                  <DialogTitle>{selectedContent.title}</DialogTitle>
                  <Badge variant={getTypeBadgeVariant(selectedContent.type) as any}>
                    {selectedContent.type}
                  </Badge>
                </div>
                <DialogDescription>
                  {selectedContent.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Video */}
                {selectedContent.videoUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <span className="font-medium">Video Tutorial</span>
                    </div>
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">
                        Video player would be embedded here
                      </p>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Content</span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm">
                      {selectedContent.content}
                    </div>
                  </div>
                </div>

                {/* Related Links */}
                {selectedContent.relatedLinks && selectedContent.relatedLinks.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      <span className="font-medium">Related Links</span>
                    </div>
                    <div className="space-y-2">
                      {selectedContent.relatedLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target={link.type === 'external' ? '_blank' : '_self'}
                          rel={link.type === 'external' ? 'noopener noreferrer' : undefined}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          {link.type === 'external' && <ExternalLink className="h-3 w-3" />}
                          {link.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedContent.tags && selectedContent.tags.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-medium text-sm">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedContent.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Updated */}
                {selectedContent.lastUpdated && (
                  <div className="text-xs text-muted-foreground">
                    Last updated: {selectedContent.lastUpdated.toLocaleDateString()}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Contextual Help Trigger
interface ContextualHelpTriggerProps {
  helpId: string;
  helpContent: HelpContent[];
  children?: ReactNode;
  className?: string;
}

export function ContextualHelpTrigger({ 
  helpId, 
  helpContent, 
  children, 
  className 
}: ContextualHelpTriggerProps) {
  const content = helpContent.find(item => item.id === helpId);
  
  if (!content) {
    return children || null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className={cn('h-5 w-5 p-0', className)}>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Help: {content.title}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {content.type === 'tip' && <Lightbulb className="h-5 w-5" />}
            {content.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
            {content.type === 'tutorial' && <BookOpen className="h-5 w-5" />}
            {content.type === 'faq' && <MessageCircle className="h-5 w-5" />}
            {content.type === 'info' && <Info className="h-5 w-5" />}
            <DialogTitle>{content.title}</DialogTitle>
          </div>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        <div className="whitespace-pre-wrap text-sm">
          {content.content}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Help Tour Component (for guided tours)
interface HelpTourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

interface HelpTourProps {
  steps: HelpTourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
}

export function HelpTour({ 
  steps, 
  isActive, 
  onComplete, 
  onSkip, 
  className 
}: HelpTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isActive || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className={cn('fixed inset-0 z-50', className)}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Tour Content */}
      <div className="relative z-10">
        <Card className="absolute max-w-sm p-4 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{step.title}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{step.content}</p>
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                <Button size="sm" onClick={handleNext}>
                  {isLastStep ? 'Finish' : 'Next'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Mock help content for demonstration
export const mockHelpContent: HelpContent[] = [
  {
    id: 'billing-overview',
    title: 'Understanding Billing Dashboard',
    description: 'Learn how to navigate and use the billing dashboard effectively',
    content: `The billing dashboard provides a comprehensive overview of your subscription and payment information.

Key features include:
- Payment history with detailed transaction records
- Subscription management with plan comparison
- Invoice generation and download
- Payment method management
- Usage tracking and limits

To get started, navigate to the billing section from the main menu.`,
    type: 'tutorial',
    category: 'Billing',
    tags: ['billing', 'dashboard', 'payments', 'subscription'],
    relatedLinks: [
      {
        title: 'Payment Methods Guide',
        url: '/help/payment-methods',
        type: 'internal'
      }
    ],
    lastUpdated: new Date('2024-01-15')
  },
  {
    id: 'school-management-tip',
    title: 'Bulk School Operations',
    description: 'Save time by performing actions on multiple schools at once',
    content: `Use the bulk actions feature to efficiently manage multiple schools:

1. Select schools using the checkboxes
2. Choose an action from the bulk actions menu
3. Confirm the operation
4. Monitor progress in the notifications

Available bulk actions:
- Suspend/Activate schools
- Update subscription plans
- Send notifications
- Export data`,
    type: 'tip',
    category: 'School Management',
    tags: ['schools', 'bulk-actions', 'efficiency'],
    lastUpdated: new Date('2024-01-10')
  },
  {
    id: 'sla-warning',
    title: 'SLA Compliance Monitoring',
    description: 'Important information about SLA tracking and escalation',
    content: `SLA (Service Level Agreement) compliance is critical for customer satisfaction.

Warning signs to watch for:
- Tickets approaching deadline (yellow status)
- Overdue tickets (red status)
- High volume of escalated tickets

Best practices:
- Review SLA dashboard daily
- Set up automated alerts
- Assign tickets promptly
- Escalate proactively when needed`,
    type: 'warning',
    category: 'Support',
    tags: ['sla', 'support', 'tickets', 'compliance'],
    lastUpdated: new Date('2024-01-12')
  }
];