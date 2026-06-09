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
  score?: {
    home: number;
    away: number;
  };
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
  metricsSource?: "game" | "projected" | "season";
};

export type BasketballPlayerEvidence = {
  id: string;
  name: string;
  teamId: string;
  statLine: string;
  baseline?: string;
};

export type BasketballGameEvidence = {
  id: string;
  opponent: string;
  result: string;
  score: string;
  startsAt: string;
};

export type BasketballReportTeamContext = {
  id: string;
  name: string;
  recentGames: BasketballGameEvidence[];
  headToHead: BasketballGameEvidence[];
  players: BasketballPlayerEvidence[];
};

export type BasketballReportContext = {
  mode: "post-game" | "pre-game";
  home: BasketballReportTeamContext;
  away: BasketballReportTeamContext;
};

export type PlayerReportItem = {
  name: string;
  reason: string;
  statLine?: string;
};

export type TeamScoutReport = {
  teamId: string;
  teamName: string;
  strengths: string[];
  weaknesses: string[];
  recentReview: string[];
  headToHeadReview: string[];
  shiningPlayers: PlayerReportItem[];
  strugglingPlayers: PlayerReportItem[];
  underperformedExpectations: PlayerReportItem[];
  exceededExpectations: PlayerReportItem[];
  summary: string;
};

export type StructuredScoutReport = {
  mode: BasketballReportContext["mode"];
  home: TeamScoutReport;
  away: TeamScoutReport;
  matchupSummary: string;
};
