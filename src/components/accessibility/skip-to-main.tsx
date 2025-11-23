"use client";

/**
 * Skip to Main Content Link
 * 
 * Provides keyboard users with a way to skip repetitive navigation
 * and jump directly to the main content area.
 * 
 * WCAG 2.1 Success Criterion 2.4.1 (Level A): Bypass Blocks
 * 
 * @see Requirements 5.4 - Skip-to-main-content link
 */
export function SkipToMain() {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="skip-to-main"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}
