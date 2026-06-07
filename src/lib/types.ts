export type Sport = "basketball" | "football";

export type TeamSummary = {
  id: string;
  name: string;
  logoUrl?: string;
};

export type ScheduleGame = {
  id: string;
  sport: Sport;
  league: string;
  startsAt: string;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  status?: string;
};

export type TeamMetric = {
  label: string;
  value: number;
  displayValue?: string;
};

export type TeamProfile = TeamSummary & {
  recentForm?: string[];
  metrics: TeamMetric[];
};

export type Matchup = {
  game: ScheduleGame;
  home: TeamProfile;
  away: TeamProfile;
};
