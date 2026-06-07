import type { Matchup, ScheduleGame, Sport, TeamMetric, TeamSummary } from "./types";

const footballTeams: [TeamSummary, TeamSummary] = [
  {
    id: "arsenal",
    name: "Arsenal",
    logoUrl: "https://media.api-sports.io/football/teams/42.png",
  },
  {
    id: "man-city",
    name: "Manchester City",
    logoUrl: "https://media.api-sports.io/football/teams/50.png",
  },
];

const basketballTeams: [TeamSummary, TeamSummary] = [
  {
    id: "celtics",
    name: "Boston Celtics",
    logoUrl: "https://media.api-sports.io/basketball/teams/133.png",
  },
  {
    id: "lakers",
    name: "Los Angeles Lakers",
    logoUrl: "https://media.api-sports.io/basketball/teams/145.png",
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
      { label: "Points", value: 118.2, displayValue: "118.2/game" },
      { label: "Rebounds", value: 46.3, displayValue: "46.3/game" },
      { label: "3P Rate", value: 39.1, displayValue: "39.1%" },
    ],
    [
      { label: "Points", value: 114.8, displayValue: "114.8/game" },
      { label: "Rebounds", value: 44.7, displayValue: "44.7/game" },
      { label: "3P Rate", value: 36.8, displayValue: "36.8%" },
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
