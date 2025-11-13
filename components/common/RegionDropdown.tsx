import React, { useState, useRef, useEffect } from "react";

interface RegionDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
}

interface StateOption {
  name: string;
  code: string;
}

export const US_STATES: StateOption[] = [
  { name: "Alabama", code: "AL" },
  { name: "Alaska", code: "AK" },
  { name: "Arizona", code: "AZ" },
  { name: "Arkansas", code: "AR" },
  { name: "California", code: "CA" },
  { name: "Colorado", code: "CO" },
  { name: "Connecticut", code: "CT" },
  { name: "Delaware", code: "DE" },
  { name: "Florida", code: "FL" },
  { name: "Georgia", code: "GA" },
  { name: "Hawaii", code: "HI" },
  { name: "Idaho", code: "ID" },
  { name: "Illinois", code: "IL" },
  { name: "Indiana", code: "IN" },
  { name: "Iowa", code: "IA" },
  { name: "Kansas", code: "KS" },
  { name: "Kentucky", code: "KY" },
  { name: "Louisiana", code: "LA" },
  { name: "Maine", code: "ME" },
  { name: "Maryland", code: "MD" },
  { name: "Massachusetts", code: "MA" },
  { name: "Michigan", code: "MI" },
  { name: "Minnesota", code: "MN" },
  { name: "Mississippi", code: "MS" },
  { name: "Missouri", code: "MO" },
  { name: "Montana", code: "MT" },
  { name: "Nebraska", code: "NE" },
  { name: "Nevada", code: "NV" },
  { name: "New Hampshire", code: "NH" },
  { name: "New Jersey", code: "NJ" },
  { name: "New Mexico", code: "NM" },
  { name: "New York", code: "NY" },
  { name: "North Carolina", code: "NC" },
  { name: "North Dakota", code: "ND" },
  { name: "Ohio", code: "OH" },
  { name: "Oklahoma", code: "OK" },
  { name: "Oregon", code: "OR" },
  { name: "Pennsylvania", code: "PA" },
  { name: "Rhode Island", code: "RI" },
  { name: "South Carolina", code: "SC" },
  { name: "South Dakota", code: "SD" },
  { name: "Tennessee", code: "TN" },
  { name: "Texas", code: "TX" },
  { name: "Utah", code: "UT" },
  { name: "Vermont", code: "VT" },
  { name: "Virginia", code: "VA" },
  { name: "Washington", code: "WA" },
  { name: "West Virginia", code: "WV" },
  { name: "Wisconsin", code: "WI" },
  { name: "Wyoming", code: "WY" },
  { name: "District of Columbia", code: "DC" },
];

const RegionDropdown: React.FC<RegionDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select state",
  disabled = false,
  name,
}) => {
  // Initialize searchTerm from value if provided
  const getInitialSearchTerm = () => {
    if (value) {
      const matchingState = US_STATES.find(
        (state) => state.code.toUpperCase() === value.toUpperCase()
      );
      return matchingState ? matchingState.name : "";
    }
    return "";
  };

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(getInitialSearchTerm);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const normalizedTerm = searchTerm.trim().toLowerCase();

  // Always show all states, but sort matching ones to the top when searching
  const filteredRegions = US_STATES.filter((state) => {
    const name = state.name.toLowerCase();
    const code = state.code.toLowerCase();
    return name.includes(normalizedTerm) || code.includes(normalizedTerm);
  });

  // Sync searchTerm with value prop when value changes from outside
  useEffect(() => {
    if (value) {
      const matchingState = US_STATES.find(
        (state) => state.code.toUpperCase() === value.toUpperCase()
      );
      if (matchingState) {
        setSearchTerm((prev) => {
          // Only update if different to avoid unnecessary re-renders
          return prev !== matchingState.name ? matchingState.name : prev;
        });
      }
    } else {
      // Clear searchTerm when value is cleared
      setSearchTerm("");
    }
  }, [value]); // Only depend on value, not searchTerm to avoid loops

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectRegion = (region: StateOption) => {
    onChange(region.code);
    setSearchTerm(region.name);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredRegions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredRegions.length - 1
        );
        break;
      case "Enter":
        event.preventDefault();
        if (highlightedIndex >= 0 && filteredRegions[highlightedIndex]) {
          selectRegion(filteredRegions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);

    if (!term) {
      onChange("");
    }
  };

  return (
    <div ref={dropdownRef} className="space-y-3 relative">
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={searchTerm}
        placeholder="Search states..."
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 bg-white shadow-sm border-neutral-200 focus:border-[#00A896] focus:ring-4 focus:ring-[#00A896]/8 outline-none disabled:bg-neutral-100 text-neutral-900"
      />

      {/* Always show the list */}
      {isOpen && filteredRegions.length > 0 && (
        <div className="absolute top-11 left-0 w-full bg-white border-2 border-neutral-200 rounded-xl max-h-60 overflow-y-auto z-50">
          {filteredRegions.map((region, index) => {
            const isSelected = value === region.code;
            return (
              <button
                type="button"
                key={region.code}
                onClick={() => selectRegion(region)}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between ${
                  isSelected
                    ? "bg-[#E0F5F3] text-[#00A896] border-[#00A896]"
                    : index === highlightedIndex
                    ? "bg-[#E0F5F3] text-[#00A896]"
                    : "hover:bg-stone-100"
                }`}
              >
                <span
                  className={`font-medium ${
                    isSelected ? "text-[#00A896]" : "text-[#2D3436]"
                  }`}
                >
                  {region.name}
                </span>
                <span
                  className={`text-sm ${
                    isSelected ? "text-[#00A896]" : "text-[#666666]"
                  }`}
                >
                  {region.code}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RegionDropdown;
