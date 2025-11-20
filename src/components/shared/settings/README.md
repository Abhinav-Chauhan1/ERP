# Appearance Settings Component

This component provides a unified appearance settings interface for all user roles (Admin, Teacher, Student, Parent).

## Features

- **Theme Mode Selection**: Light, Dark, or System (follows OS preference)
- **Color Theme Selection**: 6 color themes (Blue, Red, Green, Purple, Orange, Teal)
- **Language Selection**: 6 languages (English, Hindi, Spanish, French, Arabic, Chinese)
- **Persistent Settings**: Saves preferences to localStorage and optionally to database

## Usage

### Basic Usage (Client-side only)

```tsx
import { AppearanceSettings } from "@/components/shared/settings/appearance-settings";

export default function SettingsPage() {
  return (
    <div className="p-6">
      <AppearanceSettings />
    </div>
  );
}
```

### Advanced Usage (With Server-side Persistence)

```tsx
"use client";

import { AppearanceSettings } from "@/components/shared/settings/appearance-settings";
import { updateUserSettings } from "@/lib/actions/settings-actions";

export default function SettingsPage() {
  const handleSave = async (settings: { theme: string; colorTheme: string; language: string }) => {
    // Save to database via server action
    await updateUserSettings({
      theme: settings.theme,
      colorTheme: settings.colorTheme,
      language: settings.language,
    });
  };

  return (
    <div className="p-6">
      <AppearanceSettings onSave={handleSave} />
    </div>
  );
}
```

## Theme System Architecture

### 1. CSS Variables (globals.css)

All color themes are defined using CSS custom properties with proper contrast ratios for accessibility (WCAG 2.1 AA compliance).

### 2. Theme Provider (next-themes)

Handles light/dark mode switching with system preference detection.

### 3. Color Theme Context (theme-context.tsx)

Manages color theme selection and applies theme classes to the document element.

### 4. Appearance Settings Component

User-facing interface for customizing all appearance preferences.

## Color Themes

- **Blue** (Default): Professional and trustworthy
- **Red**: Energetic and bold
- **Green**: Natural and calming
- **Purple**: Creative and sophisticated
- **Orange**: Warm and friendly
- **Teal**: Modern and balanced

## Integration with User Settings

To persist theme preferences to the database, update your user settings models:

```prisma
model TeacherSettings {
  // ... other fields
  theme         String @default("LIGHT") // LIGHT, DARK, SYSTEM
  colorTheme    String @default("blue")  // blue, red, green, purple, orange, teal
  language      String @default("en")
}
```

## Accessibility

- All color themes maintain minimum 4.5:1 contrast ratio for text
- Keyboard navigation fully supported
- Screen reader compatible with proper ARIA labels
- Focus indicators visible on all interactive elements
