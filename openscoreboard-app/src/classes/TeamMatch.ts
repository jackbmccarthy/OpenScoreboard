export const TEAM_MATCH_MODES = {
    STRUCTURED: "structured",
    TEAM_SCORE_ONLY: "teamScoreOnly",
};

export function getTeamMatchMode(teamMatch: any = {}) {
    return teamMatch?.teamMatchMode === TEAM_MATCH_MODES.TEAM_SCORE_ONLY ?
        TEAM_MATCH_MODES.TEAM_SCORE_ONLY :
        TEAM_MATCH_MODES.STRUCTURED;
}

export function isTeamScoreOnlyTeamMatch(teamMatch: any = {}) {
    return getTeamMatchMode(teamMatch) === TEAM_MATCH_MODES.TEAM_SCORE_ONLY;
}

export function newTeamMatch(teamAID, teamBID, startTime, sportName, scoringType, options: any = {}) {
    const teamMatchMode = options.teamMatchMode === TEAM_MATCH_MODES.TEAM_SCORE_ONLY ?
        TEAM_MATCH_MODES.TEAM_SCORE_ONLY :
        TEAM_MATCH_MODES.STRUCTURED;
    const timestamp = new Date().toISOString();

    return {
        teamAID: teamAID,
        teamBID: teamBID,
        createdOn: timestamp,
        updatedOn: timestamp,
        teamMatchMode,
        startTime: startTime,
        teamAScore: 0,
        teamBScore: 0,
        currentMatches: teamMatchMode === TEAM_MATCH_MODES.TEAM_SCORE_ONLY ? {} : { 1: "" },
        archivedMatches: {},
        scheduledMatches: {},
        sportName: sportName,
        scoringType: scoringType
    }
}
