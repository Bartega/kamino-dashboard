"use client";

interface ArchiveFiltersProps {
  handles: string[];
  selectedHandle: string;
  onHandleChange: (handle: string) => void;
  sortBy: "date" | "engagement";
  onSortChange: (sort: "date" | "engagement") => void;
  searchText: string;
  onSearchChange: (text: string) => void;
}

export function ArchiveFilters({
  handles,
  selectedHandle,
  onHandleChange,
  sortBy,
  onSortChange,
  searchText,
  onSearchChange,
}: ArchiveFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-border rounded-lg p-3">
      <select
        value={selectedHandle}
        onChange={(e) => onHandleChange(e.target.value)}
        className="text-sm border border-border rounded px-2 py-1.5 bg-background text-foreground"
      >
        <option value="">All competitors</option>
        {handles.map((h) => (
          <option key={h} value={h}>
            @{h}
          </option>
        ))}
      </select>

      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as "date" | "engagement")}
        className="text-sm border border-border rounded px-2 py-1.5 bg-background text-foreground"
      >
        <option value="date">Sort by date</option>
        <option value="engagement">Sort by engagement</option>
      </select>

      <input
        type="text"
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search tweets..."
        className="text-sm border border-border rounded px-2 py-1.5 bg-background text-foreground flex-1 min-w-[150px]"
      />
    </div>
  );
}
