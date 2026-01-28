import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden premium-card hover-lift hover-glow relative group",
      className
    )}>
      {/* Subtle background gradient for premium feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h4 className="text-3xl font-bold tracking-tight">{value}</h4>
            {trend && (
              <div className="flex items-center mt-2">
                {trend.isPositive ? (
                  <div className="flex items-center text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                      <polyline points="16 7 22 7 22 13"></polyline>
                    </svg>
                    <span className="text-xs font-bold">{trend.value}%</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                      <polyline points="16 17 22 17 22 11"></polyline>
                    </svg>
                    <span className="text-xs font-bold">{trend.value}%</span>
                  </div>
                )}
                {description && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {description}
                  </span>
                )}
              </div>
            )}
            {!trend && description && (
              <p className="text-xs text-muted-foreground mt-2 font-medium">{description}</p>
            )}
          </div>
          <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl text-primary ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-500">
            {icon ? React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" }) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
