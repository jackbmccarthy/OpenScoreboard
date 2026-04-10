/**
 * TypeScript interfaces for OpenScoreboard match schemas
 * v3 maintains backwards compatibility with main branch Firebase paths
 */

import firebase from 'firebase/app';

export type FirebaseUser = ReturnType<typeof firebase.auth> extends {
  currentUser: infer TUser;
}
  ? TUser
  : any;

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
  schemaVersion?: number;

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
  tournamentID?: string;
  eventID?: string;
  roundID?: string;
  bracketNodeID?: string;
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

  games?: Record<string, {
    gameNumber: number;
    status: string;
    startedAt: string;
    endedAt: string;
    winner: string | null;
    scoreA: number;
    scoreB: number;
    rules: {
      sportName: string;
      scoringType: string | null;
      pointsToWinGame: number;
      changeServeEveryXPoints: number;
      enforceGameScore: boolean;
      isManualServiceMode: boolean;
      isDoubles: boolean;
    };
    metadata: {
      significantPoints: Record<string, number>;
    };
  }>;
  pointHistory?: Record<string, Record<string, unknown>>;
  auditTrail?: Record<string, Record<string, unknown>>;
  isJudgePaused?: boolean;
  judgePauseReason?: string;
  isDisputed?: boolean;
  latestJudgeNote?: string;
  latestJudgeNoteAt?: string;
  tournamentContext?: {
    tournamentID: string;
    eventID: string;
    roundID: string;
    bracketNodeID: string;
    teamMatchID: string;
    matchRound: string;
    eventName: string;
    metadata: Record<string, unknown>;
  };
  context?: {
    tournamentID: string;
    eventID: string;
    roundID: string;
    bracketNodeID?: string;
    teamMatchID?: string;
    matchRound: string;
    eventName: string;
    metadata?: Record<string, unknown>;
  };
  scheduling?: {
    tableID: string;
    teamMatchID: string;
    tableNumber: string;
    queueItemID?: string;
    scheduledMatchID?: string;
    scheduledStartTime?: string;
    matchStartTime?: string;
    sourceType: string;
    sourceID?: string;
    metadata?: Record<string, unknown>;
  };
  scoringRules?: {
    sportName: string;
    scoringType: string | null;
    bestOf: number;
    pointsToWinGame: number;
    changeServeEveryXPoints: number;
    enforceGameScore: boolean;
    isManualServiceMode: boolean;
    isDoubles: boolean;
  };
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
  schemaVersion?: number;
  teamAID: string;
  teamBID: string;
  teamAScore: number;
  teamBScore: number;
  tournamentID?: string;
  eventID?: string;
  roundID?: string;
  startTime: string;
  sportName: string;
  scoringType: string;
  currentMatches: Record<string, string>;
  archivedMatches: Record<string, string>;
  scheduledMatches: Record<string, string>;
  auditTrail?: Record<string, Record<string, unknown>>;
  tournamentContext?: {
    tournamentID: string;
    eventID: string;
    roundID: string;
    matchRound: string;
    eventName: string;
    metadata: Record<string, unknown>;
  };
  context?: {
    tournamentID: string;
    eventID: string;
    roundID: string;
    matchRound: string;
    eventName: string;
    metadata?: Record<string, unknown>;
  };
  scheduling?: {
    scheduledMatches: Record<string, string>;
    currentMatches: Record<string, string>;
    startTime: string;
    teamMatchID?: string;
    metadata?: Record<string, unknown>;
  };
}

// ============================================
// Table
// ============================================
export interface Table {
  id?: string;
  tableName: string;
  sportName?: string;
  scoringType?: string;
  autoAdvanceMode?: 'manual' | 'prompt' | 'automatic';
  autoAdvanceDelaySeconds?: number;
  password?: string;
  passwordHash?: string;
  passwordUpdatedAt?: string;
  accessVersion?: number;
  currentMatch?: string;
  playerListID?: string;
  pointsToWinGame?: number;
  archivedMatches?: Record<string, string>;
  scheduledMatches?: Record<string, ScheduledMatch>;
}

export type ScheduledMatchStatus =
  | 'scheduled'
  | 'queued'
  | 'called'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'archived';

export interface ScheduledMatch {
  id?: string;
  startTime?: string;
  matchID?: string;
  tournamentID?: string;
  eventID?: string;
  roundID?: string;
  eventName?: string;
  matchRound?: string;
  teamAID?: string;
  teamBID?: string;
  status?: ScheduledMatchStatus;
  queueOrder?: number;
  scheduledOn?: string;
  updatedAt?: string;
  promotedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  archivedAt?: string;
  sourceType?: string;
  sourceID?: string;
  operatorNotes?: string;
  assignedScorerID?: string;
  promotionSource?: string;
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
  passwordHash?: string;
  passwordUpdatedAt?: string;
  accessVersion?: number;
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
  user: FirebaseUser;
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
