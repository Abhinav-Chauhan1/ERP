"use client";

import { useState, useEffect } from "react";
import { FilterPreset, FilterValue } from "@/components/shared/advanced-filters";

export function useFilterPresets(storageKey: string) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load filter presets:", error);
    }
  }, [storageKey]);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(presets));
    } catch (error) {
      console.error("Failed to save filter presets:", error);
    }
  }, [presets, storageKey]);

  const savePreset = (name: string, filters: FilterValue) => {
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      filters,
    };
    setPresets((prev) => [...prev, newPreset]);
  };

  const deletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const loadPreset = (preset: FilterPreset) => {
    return preset.filters;
  };

  return {
    presets,
    savePreset,
    deletePreset,
    loadPreset,
  };
}
