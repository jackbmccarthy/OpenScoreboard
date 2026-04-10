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
        tournamentID: "",
        eventID: "",
        roundID: "",
        currentMatches: { 1: "" },
        archivedMatches: {},
        scheduledMatches: {},
        auditTrail: {},
        context: {
            tournamentID: "",
            eventID: "",
            roundID: "",
            matchRound: "",
            eventName: "",
        },
        sportName: sportName,
        scoringType: scoringType
    }

    return {
        ...teamMatch,
        ...buildTeamMatchSchemaPatch(teamMatch),
    }
}
