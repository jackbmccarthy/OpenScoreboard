import { supportedSports } from "../functions/sports"
import { MATCH_SCHEMA_VERSION, buildMatchSchemaPatch } from "../functions/matchSchema"
import { getNewPlayer } from "./Player"



export default class Match {

    constructor(match: any = null) {
        if (typeof match === "object") {
            for (const key in match) {
                (this as any)[key] = (match as any)[key]
            }
        }
    }

    getDefaultMatchSettings(sportName: string, previousMatchObj: any = null, isTeamMatch = false, scoringTypeDefault: string | null = "normal") {

        let matchSettings: Record<string, any> = {
            //Pregame settings
            isActive: false,
            isWarmUpStarted: false,
            isWarmUpFinished: false,
            warmUpStartTime: "",
            warmupDurationSeconds: 120,
            isMatchStarted: false,
            matchStartTime: "",
            isInBetweenGames: false,

            showGameWonConfirmationModal: false,
            showInBetweenGamesModal: false,
            showMatchSetupWizard: true,
            showEndOfMatchOptions: false,


            // Timeout related fields
            isATimeOutUsed: false,
            isBTimeOutUsed: false,
            isATimeOutActive: false,
            isBTimeOutActive: false,
            timeOutStartTimeA: "",
            timeOutStartTimeB: "",

            //Service fields
            isAInitialServer: false,
            isInitialServerSelected: false,
            isACurrentlyServing: false,
            isManualServiceMode: false,
            enforceGameScore: true,
            changeServeEveryXPoints: 2,
            pointsToWinGame: 11,

            //Pickleball
            isSecondServer: true,
            scoringType: scoringTypeDefault,

            //Team Fields for Table Only.
            isTeamMatch: isTeamMatch,
            //includeTeamName: false,
            teamNameA: "",
            teamNameB: "",
            teamMatchID: "",
            aJerseyColor: "",
            bJerseyColor: "",
            aPlayerName: "",
            bPlayerName: "",


            isSwitched: false,

            tournamentID: "",
            eventID: "",
            roundID: "",
            bracketNodeID: "",
            matchRound: "",
            eventName: "",
            isCourtSideScoreboardFlipped: false,
            isDoubles: false,
            significantPoints: {},
            isJudgePaused: false,
            judgePauseReason: "",
            isDisputed: false,
            latestJudgeNote: "",
            latestJudgeNoteAt: "",


            //Final Point Flags
            isGamePoint: false,
            isMatchPoint: false,


            //Penalty Flags
            isAYellowCarded: false,
            isBYellowCarded: false,
            isARedCarded: false,
            isBRedCarded: false,

            //experimental expedited settings
            isExpeditedMode: false,
            isAInitialExpeditedServer: false,

            // Injury Time Out
            isInjuryTimeOutActiveA: false,
            isInjuryTimeOutActiveB: false,
            injuryTimeOutStartTimeA: "",
            injuryTimeOutStartTimeB: "",

            isGame1Started: false,
            isGame2Started: false,
            isGame3Started: false,
            isGame4Started: false,
            isGame5Started: false,
            isGame6Started: false,
            isGame7Started: false,
            isGame8Started: false,
            isGame9Started: false,

            game1StartTime: "",
            game2StartTime: "",
            game3StartTime: "",
            game4StartTime: "",
            game5StartTime: "",
            game6StartTime: "",
            game7StartTime: "",
            game8StartTime: "",
            game9StartTime: "",

            game1EndTime: "",
            game2EndTime: "",
            game3EndTime: "",
            game4EndTime: "",
            game5EndTime: "",
            game6EndTime: "",
            game7EndTime: "",
            game8EndTime: "",
            game9EndTime: "",


            isGame1Finished: false,
            isGame2Finished: false,
            isGame3Finished: false,
            isGame4Finished: false,
            isGame5Finished: false,
            isGame6Finished: false,
            isGame7Finished: false,
            isGame8Finished: false,
            isGame9Finished: false,

            game1AScore: 0,
            game1BScore: 0,
            game2AScore: 0,
            game2BScore: 0,
            game3AScore: 0,
            game3BScore: 0,
            game4AScore: 0,
            game4BScore: 0,
            game5AScore: 0,
            game5BScore: 0,
            game6AScore: 0,
            game6BScore: 0,
            game7AScore: 0,
            game7BScore: 0,
            game8AScore: 0,
            game8BScore: 0,
            game9AScore: 0,
            game9BScore: 0,
            bestOf: 5,

            playerA: getNewPlayer(),
            playerB: getNewPlayer(),
            playerA2: getNewPlayer(),
            playerB2: getNewPlayer(),

            sportName: sportName
            ,
            schemaVersion: MATCH_SCHEMA_VERSION,
            games: {},
            pointHistory: {},
            auditTrail: {},
            context: {
                tournamentID: "",
                eventID: "",
                roundID: "",
                matchRound: "",
                eventName: "",
            },
            scheduling: {
                tableID: "",
                teamMatchID: "",
                tableNumber: "",
                scheduledMatchID: "",
                sourceType: "",
            }

        }
        if (previousMatchObj) {

            const {
                bestOf,
                pointsToWinGame,
                isDoubles,
                isManualServiceMode,
                changeServeEveryXPoints,
                enforceGameScore,
                scoringType,
                warmupDurationSeconds,
                tournamentID,
                eventID,
                roundID,
                bracketNodeID,
                matchRound,
                eventName,
            } = previousMatchObj
            matchSettings = {
                ...matchSettings,
                bestOf: bestOf,
                pointsToWinGame: pointsToWinGame,
                isDoubles: isDoubles,
                isManualServiceMode: isManualServiceMode,
                changeServeEveryXPoints: changeServeEveryXPoints,
                enforceGameScore: enforceGameScore,
                sportName: sportName,
                scoringType: scoringType ? scoringType : (scoringTypeDefault || "normal"),
                warmupDurationSeconds: warmupDurationSeconds || 120,
                tournamentID: tournamentID || "",
                eventID: eventID || "",
                roundID: roundID || "",
                bracketNodeID: bracketNodeID || "",
                matchRound: matchRound || "",
                eventName: eventName || "",
            }
        }
        else {
            const defaultOptions = supportedSports[sportName]?.defaults
            const scoringTypeKey = scoringTypeDefault || "normal"
            const scoringTypeSettings = supportedSports[sportName]?.scoringTypes ? supportedSports[sportName]?.scoringTypes[scoringTypeKey] : null
            if (scoringTypeSettings && scoringTypeSettings.defaults) {
                matchSettings = { ...matchSettings, ...defaultOptions, ...scoringTypeSettings.defaults }
            }
            else {
                matchSettings = { ...matchSettings, ...defaultOptions }
            }

        }
        return {
            ...matchSettings,
            ...buildMatchSchemaPatch(matchSettings),
        }
    }
    createNew(sportName: string, previousMatchObj: object | null = null, isTeamMatch = false, scoringType: string | null = "normal") {
        // createNew(bestOf, isTeamMatch=false, pointsToWinGame=11, isDoubles=false) {
        let newMatch = this.getDefaultMatchSettings(sportName, previousMatchObj, isTeamMatch, scoringType)
        return newMatch
    }




}
