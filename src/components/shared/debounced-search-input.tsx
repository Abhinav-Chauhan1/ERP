"use client";

import { useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { DEBOUNCE_PRESETS } from "@/lib/utils/debounce";

interface DebouncedSearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number;
  minLength?: number;
  loading?: boolean;
  className?: string;
}

/**
 * Debounced search input component
 * Automatically debounces search queries to prevent excessive API calls
 * 
 * @example
 * <DebouncedSearchInput
 *   onSearch={(query) => fetchResults(query)}
 *   placeholder="Search users..."
 *   delay={300}
 *   minLength={2}
 *   loading={isLoading}
 * />
 */
export function DebouncedSearchInput({
  onSearch,
  placeholder = "Search...",
  delay = DEBOUNCE_PRESETS.SEARCH,
  minLength = 2,
  loading = false,
  className = "",
}: DebouncedSearchInputProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounced search callback
  const debouncedSearch = useDebouncedCallback(
    (searchQuery: string) => {
      if (searchQuery.length >= minLength) {
        onSearch(searchQuery);
      } else if (searchQuery.length === 0) {
        // Clear results when query is empty
        onSearch("");
      }
      setIsSearching(false);
    },
    delay
  );
  
  const handleChange = (value: string) => {
    setQuery(value);
    setIsSearching(value.length >= minLength);
    debouncedSearch(value);
  };
  
  const handleClear = () => {
    setQuery("");
    setIsSearching(false);
    onSearch("");
  };
  
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-9 pr-9"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {(loading || isSearching) ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : query ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto p-0 hover:bg-transparent"
            onClick={handleClear}
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        ) : null}
      </div>
      {query.length > 0 && query.length < minLength && (
        <p className="mt-1 text-xs text-muted-foreground">
          Type at least {minLength} characters to search
        </p>
      )}
    </div>
  );
}

/**
 * Example usage in a page:
 * 
 * 'use client';
 * 
 * import { useState } from 'react';
 * import { DebouncedSearchInput } from '@/components/shared/debounced-search-input';
 * 
 * export function UsersPage() {
 *   const [results, setResults] = useState([]);
 *   const [loading, setLoading] = useState(false);
 * 
 *   const handleSearch = async (query: string) => {
 *     if (!query) {
 *       setResults([]);
 *       return;
 *     }
 * 
 *     setLoading(true);
 *     try {
 *       const response = await fetch(`/api/users?q=${query}`);
 *       const data = await response.json();
 *       setResults(data);
 *     } catch (error) {
 *       console.error('Search failed:', error);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <DebouncedSearchInput
 *         onSearch={handleSearch}
 *         placeholder="Search users..."
 *         loading={loading}
 *       />
 *       <div className="mt-4">
 *         {results.map(user => (
 *           <div key={user.id}>{user.name}</div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 */
