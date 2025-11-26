"use client";

/**
 * Test component to verify theme is working
 * Add this to any dashboard page to test
 */
export function ThemeTest() {
  return (
    <div className="p-4 space-y-4 border rounded-lg">
      <h3 className="font-bold">Theme Test</h3>
      <div className="space-y-2">
        <div className="p-4 bg-primary text-primary-foreground rounded">
          Primary Background with Primary Foreground Text
        </div>
        <div className="p-4 border-2 border-primary rounded">
          Primary Border
        </div>
        <div className="p-4 bg-primary/10 text-primary rounded">
          Primary/10 Background with Primary Text
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
          Primary Button
        </button>
      </div>
    </div>
  );
}
