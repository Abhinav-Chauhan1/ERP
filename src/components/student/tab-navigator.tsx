"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TabNavigatorProps {
  targetTabValue: string;
  buttonText: string;
  className?: string;
}

export function TabNavigator({ targetTabValue, buttonText, className }: TabNavigatorProps) {
  const handleClick = () => {
    const tabElement = document.querySelector(`[data-value="${targetTabValue}"]`) as HTMLElement;
    if (tabElement) {
      tabElement.click();
    }
  };

  return (
    <Button onClick={handleClick} className={className}>
      {buttonText}
    </Button>
  );
}
