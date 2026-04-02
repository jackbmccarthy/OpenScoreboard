export function newTeamMatch(teamAID: string, teamBID: string, startTime: string, sportName: string, scoringType: string) {

    return {
        teamAID: teamAID,
        teamBID: teamBID,
        startTime: startTime,
        teamAScore: 0,
        teamBScore: 0,
        currentMatches: { 1: "" },
        archivedMatches: {},
        scheduledMatches: {},
        sportName: sportName,
        scoringType: scoringType
    }
}
