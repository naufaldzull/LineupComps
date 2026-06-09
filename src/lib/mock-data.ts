import type { Matchup, ScheduleGame, Sport, TeamMetric, TeamSummary } from "./types";

const footballTeams: [TeamSummary, TeamSummary] = [
  {
    id: "real-madrid",
    name: "Real Madrid",
    logoUrl: "https://media.api-sports.io/football/teams/541.png",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    logoUrl: "https://media.api-sports.io/football/teams/529.png",
  },
];

const basketballTeams: [TeamSummary, TeamSummary] = [
  {
    id: "lakers",
    name: "Los Angeles Lakers",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg",
  },
  {
    id: "celtics",
    name: "Boston Celtics",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg",
  },
];

const metricsBySport: Record<Sport, [TeamMetric[], TeamMetric[]]> = {
  football: [
    [
      { label: "Goals For", value: 2.1, displayValue: "2.1/game" },
      { label: "Clean Sheets", value: 42, displayValue: "42%" },
      { label: "Possession", value: 58, displayValue: "58%" },
    ],
    [
      { label: "Goals For", value: 2.4, displayValue: "2.4/game" },
      { label: "Clean Sheets", value: 39, displayValue: "39%" },
      { label: "Possession", value: 61, displayValue: "61%" },
    ],
  ],
  basketball: [
    [
      { label: "PTS", value: 118.2, displayValue: "118.2" },
      { label: "AST", value: 26.4, displayValue: "26.4" },
      { label: "REB", value: 46.3, displayValue: "46.3" },
      { label: "FT%", value: 78.4, displayValue: "78.4%" },
      { label: "FG%", value: 48.9, displayValue: "48.9%" },
      { label: "3FG%", value: 37.6, displayValue: "37.6%" },
      { label: "STL", value: 7.8, displayValue: "7.8" },
      { label: "BLK", value: 5.1, displayValue: "5.1" },
    ],
    [
      { label: "PTS", value: 114.8, displayValue: "114.8" },
      { label: "AST", value: 27.9, displayValue: "27.9" },
      { label: "REB", value: 44.7, displayValue: "44.7" },
      { label: "FT%", value: 81.2, displayValue: "81.2%" },
      { label: "FG%", value: 47.3, displayValue: "47.3%" },
      { label: "3FG%", value: 38.8, displayValue: "38.8%" },
      { label: "STL", value: 6.9, displayValue: "6.9" },
      { label: "BLK", value: 4.7, displayValue: "4.7" },
    ],
  ],
};

export function getMockSchedule(sport: Sport): ScheduleGame[] {
  const [homeTeam, awayTeam] =
    sport === "football" ? footballTeams : basketballTeams;

  return [
    {
      id: `${sport}-demo-1`,
      sport,
      league: sport === "football" ? "Premier League" : "NBA",
      startsAt: "2026-06-14T19:00:00+00:00",
      homeTeam,
      awayTeam,
      status: "Not Started",
    },
  ];
}

export function getMockMatchup(sport: Sport, gameId: string): Matchup {
  const [game] = getMockSchedule(sport);
  const [homeMetrics, awayMetrics] = metricsBySport[sport];

  return {
    game: { ...game, id: gameId },
    home: {
      ...game.homeTeam,
      recentForm: ["W", "W", "L", "W", "D"],
      metrics: homeMetrics,
    },
    away: {
      ...game.awayTeam,
      recentForm: ["W", "L", "W", "W", "W"],
      metrics: awayMetrics,
    },
  };
}
