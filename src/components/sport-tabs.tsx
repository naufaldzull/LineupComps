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
    <div className="inline-flex rounded-lg border border-border bg-white p-1 shadow-sm">
      {sports.map(({ value, label, icon: Icon }) => {
        const isActive = activeSport === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSportChange(value)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-medium transition ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
