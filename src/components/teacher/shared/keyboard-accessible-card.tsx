"use client";

import { ReactNode, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

/**
 * Keyboard Accessible Card Component
 * 
 * Wraps card content to make it keyboard navigable.
 * Supports Enter and Space keys for activation.
 * 
 * @param href - Navigation URL
 * @param children - Card content
 * @param onClick - Optional click handler
 * @param className - Additional CSS classes
 * @param ariaLabel - Accessible label for the card
 */
interface KeyboardAccessibleCardProps {
  href?: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

export function KeyboardAccessibleCard({
  href,
  children,
  onClick,
  className = "",
  ariaLabel,
}: KeyboardAccessibleCardProps) {
  const router = useRouter();

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Activate on Enter or Space key
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      
      if (onClick) {
        onClick();
      } else if (href) {
        router.push(href);
      }
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg ${className}`}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
