"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, FileText, Bell, User, Users, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDebouncedCallback } from "@/hooks/use-debounce";

interface SearchResult {
  id: string;
  type: "student" | "teacher" | "parent" | "document" | "announcement";
  title: string;
  subtitle?: string;
  url: string;
  avatar?: string;
}

interface GroupedResults {
  students: SearchResult[];
  teachers: SearchResult[];
  parents: SearchResult[];
  documents: SearchResult[];
  announcements: SearchResult[];
}

interface SearchResponse {
  results: GroupedResults;
  totalCount: number;
  counts: {
    students: number;
    teachers: number;
    parents: number;
    documents: number;
    announcements: number;
  };
}

/**
 * Global Search Component
 * 
 * Provides search functionality across the entire system
 * Requirements: 23.1, 23.2, 23.3, 23.4, 23.5
 * 
 * Features:
 * - Searches across students, teachers, parents, documents, and announcements (23.1)
 * - Groups results by category with result count (23.2)
 * - Provides autocomplete suggestions after 3 characters (23.3)
 * - Navigates to relevant detail page on selection (23.4)
 * - Uses debounced input to prevent excessive queries (23.5)
 */
export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GroupedResults>({
    students: [],
    teachers: [],
    parents: [],
    documents: [],
    announcements: [],
  });
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    parents: 0,
    documents: 0,
    announcements: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Requirement 23.5: Use debounced input to prevent excessive queries
  const debouncedSearch = useDebouncedCallback(
    async (searchQuery: string) => {
      // Requirement 23.3: Provide autocomplete suggestions after 3 characters
      if (searchQuery.length < 3) {
        setResults({
          students: [],
          teachers: [],
          parents: [],
          documents: [],
          announcements: [],
        });
        setCounts({
          students: 0,
          teachers: 0,
          parents: 0,
          documents: 0,
          announcements: 0,
        });
        setTotalCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        
        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data: SearchResponse = await response.json();
        
        // Requirement 23.2: Group results by category with result count
        setResults(data.results);
        setCounts(data.counts);
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error("Search error:", error);
        setResults({
          students: [],
          teachers: [],
          parents: [],
          documents: [],
          announcements: [],
        });
      } finally {
        setLoading(false);
      }
    },
    300 // 300ms debounce delay
  );

  const handleChange = (value: string) => {
    setQuery(value);
    setIsOpen(value.length >= 3);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    setResults({
      students: [],
      teachers: [],
      parents: [],
      documents: [],
      announcements: [],
    });
    setCounts({
      students: 0,
      teachers: 0,
      parents: 0,
      documents: 0,
      announcements: 0,
    });
    setTotalCount(0);
  };

  // Requirement 23.4: Navigate directly to the relevant detail page
  const handleSelect = (result: SearchResult) => {
    router.push(result.url);
    handleClear();
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
        const target = event.target as HTMLElement;
        // Only trigger if not already in an input
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          inputRef.current?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "student":
        return <GraduationCap className="h-4 w-4" />;
      case "teacher":
        return <User className="h-4 w-4" />;
      case "parent":
        return <Users className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "announcement":
        return <Bell className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case "students":
        return "Students";
      case "teachers":
        return "Teachers";
      case "parents":
        return "Parents";
      case "documents":
        return "Documents";
      case "announcements":
        return "Announcements";
      default:
        return type;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search... (Press / to focus)"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.length >= 3 && setIsOpen(true)}
          className="pl-9 pr-9"
          aria-label="Global search"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-autocomplete="list"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : query ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>
          ) : null}
        </div>
      </div>

      {query.length > 0 && query.length < 3 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Type at least 3 characters to search
        </p>
      )}

      {isOpen && query.length >= 3 && (
        <div
          id="search-results"
          className="absolute top-full z-50 mt-2 w-full rounded-md border bg-popover shadow-lg"
          role="listbox"
        >
          <Command className="rounded-md">
            <CommandList className="max-h-[400px] overflow-y-auto">
              {totalCount === 0 && !loading && (
                <CommandEmpty>No results found for &quot;{query}&quot;</CommandEmpty>
              )}

              {/* Students */}
              {results.students.length > 0 && (
                <CommandGroup
                  heading={
                    <div className="flex items-center justify-between">
                      <span>{getCategoryLabel("students")}</span>
                      <Badge variant="secondary" className="ml-2">
                        {counts.students}
                      </Badge>
                    </div>
                  }
                >
                  {results.students.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={result.avatar} alt={result.title} />
                        <AvatarFallback>
                          {result.title.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getIcon(result.type)}
                          <span className="font-medium truncate">{result.title}</span>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Teachers */}
              {results.teachers.length > 0 && (
                <CommandGroup
                  heading={
                    <div className="flex items-center justify-between">
                      <span>{getCategoryLabel("teachers")}</span>
                      <Badge variant="secondary" className="ml-2">
                        {counts.teachers}
                      </Badge>
                    </div>
                  }
                >
                  {results.teachers.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={result.avatar} alt={result.title} />
                        <AvatarFallback>
                          {result.title.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getIcon(result.type)}
                          <span className="font-medium truncate">{result.title}</span>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Parents */}
              {results.parents.length > 0 && (
                <CommandGroup
                  heading={
                    <div className="flex items-center justify-between">
                      <span>{getCategoryLabel("parents")}</span>
                      <Badge variant="secondary" className="ml-2">
                        {counts.parents}
                      </Badge>
                    </div>
                  }
                >
                  {results.parents.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={result.avatar} alt={result.title} />
                        <AvatarFallback>
                          {result.title.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getIcon(result.type)}
                          <span className="font-medium truncate">{result.title}</span>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Documents */}
              {results.documents.length > 0 && (
                <CommandGroup
                  heading={
                    <div className="flex items-center justify-between">
                      <span>{getCategoryLabel("documents")}</span>
                      <Badge variant="secondary" className="ml-2">
                        {counts.documents}
                      </Badge>
                    </div>
                  }
                >
                  {results.documents.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                        {getIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{result.title}</span>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Announcements */}
              {results.announcements.length > 0 && (
                <CommandGroup
                  heading={
                    <div className="flex items-center justify-between">
                      <span>{getCategoryLabel("announcements")}</span>
                      <Badge variant="secondary" className="ml-2">
                        {counts.announcements}
                      </Badge>
                    </div>
                  }
                >
                  {results.announcements.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                        {getIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{result.title}</span>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
