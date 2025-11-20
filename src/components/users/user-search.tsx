"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UserSearchProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function UserSearch({ onSearch, placeholder = "Search users..." }: UserSearchProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="relative flex-1">
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="w-full pl-8"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}
