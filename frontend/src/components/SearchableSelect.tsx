import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
  suffix?: string;
}

interface Props {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  clearable?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  clearable = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      inputRef.current?.focus();
    }
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all outline-none focus:ring-2 focus:ring-nebula-500 dark:border-white/10 dark:bg-space-800/60 dark:text-white"
      >
        <span className={selected ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
          {selected ? `${selected.suffix ? `${selected.suffix} ` : ""}${selected.label}` : placeholder}
        </span>
        <span className="flex items-center gap-2">
          {clearable && selected && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4 text-gray-400" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-space-800">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">No results</div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-white/5 ${
                    option.value === value ? "bg-amber-50 text-amber-900 dark:bg-star-400/10 dark:text-star-300" : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {option.suffix && <span className="mr-2">{option.suffix}</span>}
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
