/**
 * TypeScript interfaces for OpenScoreboard match schemas
 * v3 maintains backwards compatibility with main branch Firebase paths
 */

// ============================================
// Player
// ============================================
export interface Player {
  firstName: string;
  lastName: string;
  imageURL: string;
  country: string;
  clubName: string;
  jerseyColor: string;
  firstNameInitial: boolean;
  lastNameInitial: boolean;
  isImported: boolean;
}

// ============================================
// Match Settings
// ============================================
export interface MatchSettings {
  // Pregame settings
  isActive: boolean;
  isWarmUpStarted: boolean;
  isWarmUpFinished: boolean;
  warmUpStartTime: string;
  isMatchStarted: boolean;
  matchStartTime: string;
  isInBetweenGames: boolean;

  showGameWonConfirmationModal: boolean;
  showInBetweenGamesModal: boolean;
  showMatchSetupWizard: boolean;
  showEndOfMatchOptions: boolean;

  // Timeout related fields
  isATimeOutUsed: boolean;
  isBTimeOutUsed: boolean;
  isATimeOutActive: boolean;
  isBTimeOutActive: boolean;
  timeOutStartTimeA: string;
  timeOutStartTimeB: string;

  // Service fields
  isAInitialServer: boolean;
  isInitialServerSelected: boolean;
  isACurrentlyServing: boolean;
  isManualServiceMode: boolean;
  enforceGameScore: boolean;
  changeServeEveryXPoints: number;
  pointsToWinGame: number;

  // Pickleball
  isSecondServer: boolean;
  scoringType: string;

  // Team Fields for Table Only.
  isTeamMatch: boolean;
  teamNameA: string;
  teamNameB: string;
  teamMatchID: string;

  isSwitched: boolean;
  matchRound: string;
  eventName: string;
  isCourtSideScoreboardFlipped: boolean;
  isDoubles: boolean;
  significantPoints: Record<string, number>;

  // Final Point Flags
  isGamePoint: boolean;
  isMatchPoint: boolean;

  // Penalty Flags
  isAYellowCarded: boolean;
  isBYellowCarded: boolean;
  isARedCarded: boolean;
  isBRedCarded: boolean;

  // Experimental expedited settings
  isExpeditedMode: boolean;
  isAInitialExpeditedServer: boolean;

  // Injury Time Out
  isInjuryTimeOutActiveA: boolean;
  isInjuryTimeOutActiveB: boolean;
  injuryTimeOutStartTimeA: string;
  injuryTimeOutStartTimeB: string;

  // Game states
  isGame1Started: boolean;
  isGame2Started: boolean;
  isGame3Started: boolean;
  isGame4Started: boolean;
  isGame5Started: boolean;
  isGame6Started: boolean;
  isGame7Started: boolean;
  isGame8Started: boolean;
  isGame9Started: boolean;

  game1StartTime: string;
  game2StartTime: string;
  game3StartTime: string;
  game4StartTime: string;
  game5StartTime: string;
  game6StartTime: string;
  game7StartTime: string;
  game8StartTime: string;
  game9StartTime: string;

  game1EndTime: string;
  game2EndTime: string;
  game3EndTime: string;
  game4EndTime: string;
  game5EndTime: string;
  game6EndTime: string;
  game7EndTime: string;
  game8EndTime: string;
  game9EndTime: string;

  isGame1Finished: boolean;
  isGame2Finished: boolean;
  isGame3Finished: boolean;
  isGame4Finished: boolean;
  isGame5Finished: boolean;
  isGame6Finished: boolean;
  isGame7Finished: boolean;
  isGame8Finished: boolean;
  isGame9Finished: boolean;

  game1AScore: number;
  game1BScore: number;
  game2AScore: number;
  game2BScore: number;
  game3AScore: number;
  game3BScore: number;
  game4AScore: number;
  game4BScore: number;
  game5AScore: number;
  game5BScore: number;
  game6AScore: number;
  game6BScore: number;
  game7AScore: number;
  game7BScore: number;
  game8AScore: number;
  game8BScore: number;
  game9AScore: number;
  game9BScore: number;
  bestOf: number;

  playerA: Player;
  playerB: Player;
  playerA2: Player;
  playerB2: Player;

  sportName: string;
}

// ============================================
// Match (extends MatchSettings for full match object)
// ============================================
export interface Match extends MatchSettings {
  // Additional computed/optional fields
  cursor?: string;
}

// ============================================
// Team
// ============================================
export interface Team {
  id?: string;
  teamName: string;
  teamLogoURL?: string;
  players?: Record<string, Player>;
}

// ============================================
// Team Match
// ============================================
export interface TeamMatch {
  teamAID: string;
  teamBID: string;
  teamAScore: number;
  teamBScore: number;
  startTime: string;
  sportName: string;
  scoringType: string;
  currentMatches: Record<string, string>;
  archivedMatches: Record<string, string>;
  scheduledMatches: Record<string, string>;
}

// ============================================
// Table
// ============================================
export interface Table {
  id?: string;
  tableName: string;
  sportName?: string;
  scoringType?: string;
  password?: string;
  currentMatch?: string;
  playerListID?: string;
  pointsToWinGame?: number;
  archivedMatches?: Record<string, string>;
  scheduledMatches?: Record<string, ScheduledMatch>;
}

export interface ScheduledMatch {
  id?: string;
  startTime?: string;
  matchID?: string;
  teamAID?: string;
  teamBID?: string;
  [key: string]: any;
}

// ============================================
// Scoreboard
// ============================================
export interface Scoreboard {
  id?: string;
  name?: string;
  alwaysShow?: boolean;
  showDuringActiveMatch?: boolean;
  showDuringTimeOuts?: boolean;
  showInBetweenGames?: boolean;
  config?: string;
  web?: ScoreboardWeb;
  createdAt?: string;
}

export interface ScoreboardWeb {
  html?: string;
  css?: string;
  javascript?: string;
}

// ============================================
// Player List
// ============================================
export interface PlayerList {
  id?: string;
  playerListName: string;
  players: Record<string, Player>;
  password?: string;
}

// ============================================
// Dynamic URL
// ============================================
export interface DynamicURL {
  id?: string;
  dynamicURLName?: string;
  tableID?: string;
  teamMatchID?: string;
  tableNumber?: string;
  scoreboardID?: string;
}

// ============================================
// Field Lists (for GrapesJS editor)
// ============================================
export interface FieldListItem {
  field: string;
  label: string;
  category: string;
  sample: string | number;
  justify: string;
}

export interface TextFieldList extends Array<FieldListItem> {}
export interface CurrentGameFieldList extends Array<FieldListItem> {}

// ============================================
// Auth Types
// ============================================
export interface AuthResult {
  error: boolean;
  success: boolean;
  errorMessage: string;
  user: firebase.User | null;
  isEmailVerified: boolean;
}

// ============================================
// Database Result Types
// ============================================
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}