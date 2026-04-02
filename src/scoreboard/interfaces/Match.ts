interface MatchSettings {
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
    scoringType: any; // Define the type for scoringTypeDefault

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
    significantPoints: Record<string, any>;

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
