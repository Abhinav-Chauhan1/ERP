"use client";

import { useState } from "react";
import { AchievementCard } from "./achievement-card";
import { AchievementExport } from "./achievement-export";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

type Achievement = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  date: Date;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
};

type AchievementListProps = {
  achievements: Achievement[];
};

const CATEGORY_LABELS = {
  AWARD: "Award",
  CERTIFICATION: "Certification",
  PROFESSIONAL_DEVELOPMENT: "Professional Development",
  PUBLICATION: "Publication",
  RECOGNITION: "Recognition",
  OTHER: "Other",
};

export function AchievementList({ achievements }: AchievementListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showExport, setShowExport] = useState(false);

  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  // Filter achievements based on selected category
  const filteredAchievements = selectedCategory === "ALL" 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[250px]" aria-label="Filter by category">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          onClick={() => setShowExport(true)}
          disabled={achievements.length === 0}
          aria-label="Export achievements"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {selectedCategory === "ALL" ? (
        // Show grouped by category
        <div className="space-y-8">
          {Object.entries(groupedAchievements).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-xl font-semibold">
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Show filtered list
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No achievements found in this category.
        </div>
      )}

      {showExport && (
        <AchievementExport 
          achievements={achievements} 
          onClose={() => setShowExport(false)} 
        />
      )}
    </div>
  );
}
