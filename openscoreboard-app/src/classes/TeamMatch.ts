export function newTeamMatch(teamAID, teamBID, startTime, sportName, scoringType ){

    return {
        teamAID:teamAID,
        teamBID:teamBID,
        startTime: startTime,
        teamAScore: 0,
        teamBScore: 0,
        currentMatches:{1:""},
        archivedMatches: {},
        scheduledMatches: {},
        sportName : sportName,
        scoringType : scoringType
    }
}