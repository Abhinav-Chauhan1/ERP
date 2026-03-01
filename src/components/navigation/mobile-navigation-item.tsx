"use client";

import Link from 'next/link';
import { 
  Home, 
  BookOpen, 
  CheckSquare, 
  TrendingUp, 
  MessageCircle, 
  Settings 
} from 'lucide-react';
import { 
  getNavigationItemClasses, 
  getIconClasses,
  type ClassLevel,
  type NavigationStyle 
} from '@/lib/utils/mobile-navigation';

const ICONS = {
  Home,
  BookOpen,
  CheckSquare,
  TrendingUp,
  MessageCircle,
  Settings,
} as const;

interface MobileNavigationItemProps {
  id: string;
  label: string;
  href: string;
  icon: keyof typeof ICONS;
  description?: string;
  isActive?: boolean;
  classLevel: ClassLevel;
  navigationStyle: NavigationStyle;
  onClick?: () => void;
  showLabel?: boolean;
}

export function MobileNavigationItem({
  id,
  label,
  href,
  icon,
  description,
  isActive = false,
  classLevel,
  navigationStyle,
  onClick,
  showLabel = true,
}: MobileNavigationItemProps) {
  const Icon = ICONS[icon];
  const itemClasses = getNavigationItemClasses(id, classLevel, navigationStyle, isActive);
  const iconClasses = getIconClasses(classLevel, navigationStyle);

  const content = (
    <>
      <Icon className={iconClasses} />
      {showLabel && (
        <span className={`
          mt-1 text-center leading-tight
          ${classLevel === 'primary' ? 'text-xs' : 'text-xs'}
          ${navigationStyle === 'mobile' ? 'block' : 'hidden sm:block'}
        `}>
          {label}
        </span>
      )}
      {classLevel === 'secondary' && description && navigationStyle !== 'mobile' && (
        <span className="text-xs opacity-75 text-center leading-tight mt-0.5 hidden lg:block">
          {description}
        </span>
      )}
    </>
  );

  return (
    <Link
      href={href}
      className={itemClasses}
      onClick={onClick}
      aria-label={`${label}${description ? ` - ${description}` : ''}`}
      role="button"
      tabIndex={0}
    >
      {content}
    </Link>
  );
}

/**
 * Simplified navigation item for primary classes (1-5)
 */
export function SimplifiedNavigationItem({
  id,
  label,
  href,
  icon,
  isActive = false,
  onClick,
}: {
  id: string;
  label: string;
  href: string;
  icon: keyof typeof ICONS;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const Icon = ICONS[icon];
  
  return (
    <Link
      href={href}
      className={`
        min-h-[80px] min-w-[80px] sm:min-h-[100px] sm:min-w-[100px]
        flex flex-col items-center justify-center
        rounded-2xl shadow-lg transition-all duration-200
        active:scale-95 focus:outline-none focus:ring-4 focus:ring-offset-2
        text-white font-bold text-lg
        ${id === 'home' ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300' : ''}
        ${id === 'learn' ? 'bg-green-500 hover:bg-green-600 focus:ring-green-300' : ''}
        ${id === 'tasks' ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-300' : ''}
        ${id === 'progress' ? 'bg-teal-500 hover:bg-teal-600 focus:ring-teal-300' : ''}
        ${id === 'messages' ? 'bg-pink-500 hover:bg-pink-600 focus:ring-pink-300' : ''}
        ${id === 'settings' ? 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-300' : ''}
        ${isActive ? 'ring-4 ring-offset-2 ring-yellow-400' : ''}
      `}
      onClick={onClick}
      aria-label={label}
    >
      <Icon className="h-10 w-10 sm:h-12 sm:w-12 mb-2" />
      <span className="text-sm sm:text-base text-center px-2">{label}</span>
    </Link>
  );
}