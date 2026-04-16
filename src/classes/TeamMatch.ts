import { MATCH_SCHEMA_VERSION, buildTeamMatchSchemaPatch } from "../functions/matchSchema"

export function newTeamMatch(teamAID: string, teamBID: string, startTime: string, sportName: string, scoringType: string, ownerID = "") {
    const teamMatch = {
        schemaVersion: MATCH_SCHEMA_VERSION,
        ownerID,
        teamAID: teamAID,
        teamBID: teamBID,
        startTime: startTime,
        teamAScore: 0,
        teamBScore: 0,
        teamMatchID: "",
        tournamentID: "",
        eventID: "",
        roundID: "",
        matchRound: "",
        eventName: "",
        currentMatches: { 1: "" },
        archivedMatches: {},
        scheduledMatches: {},
        auditTrail: {},
        context: {
            tournamentID: "",
            eventID: "",
            roundID: "",
            teamMatchID: "",
            matchRound: "",
            eventName: "",
            refs: {
                tournamentID: "",
                eventID: "",
                roundID: "",
                teamMatchID: "",
            },
            labels: {
                matchRound: "",
                eventName: "",
            },
            metadata: {},
        },
        sportName: sportName,
        scoringType: scoringType
    }

    return {
        ...teamMatch,
        ...buildTeamMatchSchemaPatch(teamMatch),
    }
}
