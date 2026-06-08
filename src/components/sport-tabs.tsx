"use client";

import { Dumbbell, Goal } from "lucide-react";

import type { Sport } from "@/lib/types";

type SportTabsProps = {
  activeSport: Sport;
  onSportChange: (sport: Sport) => void;
};

const sports: Array<{ value: Sport; label: string; icon: typeof Goal }> = [
  { value: "football", label: "Football", icon: Goal },
  { value: "basketball", label: "Basketball", icon: Dumbbell },
];

export function SportTabs({ activeSport, onSportChange }: SportTabsProps) {
  return (
    <div className="inline-flex rounded-full border border-white/80 bg-white/72 p-1 shadow-sm backdrop-blur">
      {sports.map(({ value, label, icon: Icon }) => {
        const isActive = activeSport === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSportChange(value)}
            className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-medium transition duration-200 ${
              isActive
                ? "bg-[#101513] text-white shadow-sm"
                : "text-[#69736d] hover:bg-white hover:text-[#101513]"
            }`}
          >
            <Icon aria-hidden className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
