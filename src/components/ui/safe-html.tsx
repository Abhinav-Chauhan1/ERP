/**
 * SafeHtml Component
 * 
 * A secure wrapper for rendering HTML content with automatic sanitization.
 * This component provides a safe alternative to dangerouslySetInnerHTML.
 * 
 * Security Features:
 * - Automatic DOMPurify sanitization
 * - XSS protection
 * - Configurable sanitization options
 * - TypeScript type safety
 * 
 * Usage:
 * <SafeHtml content={htmlString} className="prose" />
 */

'use client';

import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import type { Config as DOMPurifyConfig } from 'dompurify';

export interface SafeHtmlProps {
  /** HTML content to render (will be sanitized) */
  content: string;
  /** Optional CSS class names */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** DOMPurify configuration options */
  sanitizeOptions?: DOMPurifyConfig;
  /** Whether to preserve line breaks (converts \n to <br/>) */
  preserveLineBreaks?: boolean;
  /** Wrapper element type (default: 'div') */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Default DOMPurify configuration
 * Allows safe HTML tags while removing dangerous attributes and scripts
 */
const DEFAULT_SANITIZE_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'div', 'span',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id',
  ],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * SafeHtml Component
 * 
 * Renders HTML content with automatic XSS protection via DOMPurify
 * 
 * @example
 * ```tsx
 * <SafeHtml 
 *   content="<p>Hello <strong>World</strong></p>" 
 *   className="prose"
 * />
 * ```
 */
export const SafeHtml: React.FC<SafeHtmlProps> = ({
  content,
  className,
  style,
  sanitizeOptions,
  preserveLineBreaks = false,
  as: Component = 'div',
}) => {
  // Sanitize the HTML content
  const sanitizedContent = React.useMemo(() => {
    if (!content) return '';
    
    let processedContent = content;
    
    // Optionally convert line breaks to <br/> tags
    if (preserveLineBreaks) {
      processedContent = processedContent.replace(/\n/g, '<br/>');
    }
    
    // Sanitize with DOMPurify
    return DOMPurify.sanitize(processedContent, {
      ...DEFAULT_SANITIZE_CONFIG,
      ...sanitizeOptions,
    });
  }, [content, preserveLineBreaks, sanitizeOptions]);

  // Render the sanitized content
  return (
    <Component
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

/**
 * SafeHtmlStrict Component
 * 
 * More restrictive version that only allows basic formatting
 * Use for user-generated content where you want minimal HTML
 */
export const SafeHtmlStrict: React.FC<SafeHtmlProps> = (props) => {
  const strictConfig: DOMPurifyConfig = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  };

  return <SafeHtml {...props} sanitizeOptions={strictConfig} />;
};

/**
 * SafeHtmlRich Component
 * 
 * Less restrictive version for rich content like lessons and articles
 * Allows more HTML tags including images, tables, and code blocks
 */
export const SafeHtmlRich: React.FC<SafeHtmlProps> = (props) => {
  const richConfig: DOMPurifyConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'div', 'span', 'hr',
      'iframe', // For embedded content (videos, etc.)
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id',
      'width', 'height', 'frameborder', 'allowfullscreen',
    ],
    ALLOW_DATA_ATTR: false,
  };

  return <SafeHtml {...props} sanitizeOptions={richConfig} />;
};

export default SafeHtml;
