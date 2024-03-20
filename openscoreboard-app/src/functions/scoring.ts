import db from '../../database';
import Match from '../classes/Match';
import { getNewPlayer } from '../classes/Player';
import { getCombinedPlayerNames } from './players';



export async function AddPoint(matchID, gameNumber, AorB) {

    let pointUpdateRef = db.ref(`matches/${matchID}/game${gameNumber}${AorB}Score`)
    let currentPointSnapShot = await pointUpdateRef.get()
    let newScore = parseInt(currentPointSnapShot.val()) + 1
    pointUpdateRef.set(newScore)
    return newScore
}

export async function MinusPoint(matchID, gameNumber, AorB) {

    let pointUpdateRef = db.ref(`matches/${matchID}/game${gameNumber}${AorB}Score`)
    let currentPointSnapShot = await pointUpdateRef.get()
    let newScore = parseInt(currentPointSnapShot.val()) - 1
    if (newScore >= 0) {
        pointUpdateRef.set(newScore)
    }
    return newScore < 0 ? 0 : newScore

}

export async function updateService(matchID, isAInitialServer, gameNumber, combinedPoints, changeServeEveryXPoints, pointsToWinGame, sportName, scoringType=null) {

    switch (sportName) {
        case "tableTennis":
                db.ref(`matches/${matchID}/isACurrentlyServing`).set(isAServing(isAInitialServer, gameNumber, combinedPoints, changeServeEveryXPoints, pointsToWinGame))

            break;
            case "pickleball":
                //This function is not used in pickleball, only when creating a new game. 
                // Also setting this to isSecondServer:true
                db.ref(`matches/${matchID}/isACurrentlyServing`).set(isAServing(isAInitialServer, gameNumber, combinedPoints, changeServeEveryXPoints, pointsToWinGame))
                db.ref(`matches/${matchID}/isSecondServer`).set(true)
            break;
        default:
            db.ref(`matches/${matchID}/isACurrentlyServing`).set(isAServing(isAInitialServer, gameNumber, combinedPoints, changeServeEveryXPoints, pointsToWinGame))

            break;
    }
    


}

export function getCurrentGameNumber(match) {
    if (match) {
        if (match.isInBetweenGames) {

            for (let gameN = 1; gameN <= 9; gameN++) {
                if (match[`isGame${gameN}Started`] === true && match[`isGame${gameN}Finished`] === true) {
                    //Do Nothing
                }
                else {
                    return gameN
                }
            }
        }
        let gameScoreFieldsOnly = {}
        Object.entries(match).filter((field) => {
            if (field[0].match(/game[1-9][A-B]Score/g)) {
                return true
            }
        }).map((gameField) => {
            gameScoreFieldsOnly[gameField[0]] = gameField[1]
        })
        for (let gameN = 1; gameN <= 9; gameN++) {
            if (match[`isGame${gameN}Started`] === true && match[`isGame${gameN}Finished`] === false) {
                return gameN
            }
        }
        return 1
    }
}

export function getCurrentGameScore(match) {
    if (match) {
        
        for (let gameN = 1; gameN <= 9; gameN++) {
            if (match[`isGame${gameN}Started`] === true && match[`isGame${gameN}Finished`] === false) {
                return {
                    a: match[`game${gameN}AScore`],
                    b: match[`game${gameN}BScore`]
                }
            }
        }
        return {
            a: match[`game1AScore`],
            b: match[`game1BScore`]
        }

    }
}

export function hasActiveGame(match) {
    for (let gameN = 1; gameN <= 9; gameN++) {
        if (match[`isGame${gameN}Started`] === true && match[`isGame${gameN}Finished`] === false) {
            return true
        }
    }
    return false
}

export function getActiveGameNumber(match) {
    for (let gameN = 1; gameN <= 9; gameN++) {
        if (match[`isGame${gameN}Started`] === true && match[`isGame${gameN}Finished`] === false) {
            return gameN
        }
    }
    return false
}

export async function getMatchData(matchID) {

    let matchRef = db.ref(`matches/${matchID}/`)
    let matchSnapShot = await matchRef.get()
    return matchSnapShot.val()

}

export async function subscribeToAllMatchFields(matchID, callback) {
    let match = await getMatchData(matchID)
    let offList = []
    for (const key in match) {
        let matchRef = db.ref(`matches/${matchID}/${key}`)
        matchRef.on("value", (snapShot) => {
            if(typeof snapShot.val()["value"] !== "undefined"){
                callback(snapShot.val()["value"], key)
            }
            else{
                callback(snapShot.val(), key)
            }
           

        })
        offList.push(()=>{
            matchRef.off()})
    }
    return offList
}

export async function unsubscribeToAllMatchFields(matchID, match) {
    for (const key in match) {
        let matchRef = db.ref(`matches/${matchID}/${key}`)
        matchRef.off("value", () => {
        })
    }
}

export async function createNewMatch(tableID, sportName, previousMatchObj=null, isTeamMatch=null, scoringType=null) {
    let newMatch = await db.ref(`matches`).push(new Match().createNew(sportName,previousMatchObj,isTeamMatch, scoringType))
    let currentMatchKey = await db.ref(`tables/${tableID}/currentMatch`).set(newMatch.key)
    return newMatch.key
}

export async function createNewScheduledMatch( sportName) {
    let newMatch = await db.ref(`matches`).push(new Match().createNew(sportName))
    return newMatch.key
}



export async function getCurrentMatchForTable(tableID) {
    let currentMatchSnapShot = await db.ref(`tables/${tableID}/currentMatch`).get()
    return currentMatchSnapShot.val()

}
export async function unassignedCurrentMatchForTable(tableID) {
    await db.ref(`tables/${tableID}/currentMatch`).set("")
}

export async function archiveMatchForTable(tableID, matchID, matchSettings = null) {
    let match
    if (matchSettings) {
        match = matchSettings
    }
    else {
        match = await getMatchData(matchID)
    }

    let matchScores = getMatchScore(match)

    let archivedMatch = {
        matchID: matchID,
        playerA: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).a,
        playerB: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).b,
        AScore: matchScores.a,
        BScore: matchScores.b,
        archivedOn: new Date().toISOString(),
        startTime: match["matchStartTime"]
    }

    let currentMatchSnapShot = await db.ref(`tables/${tableID}/archivedMatches`).push(archivedMatch)
    return currentMatchSnapShot.key

}



export async function getArchivedMatchesForTable(tableID) {



    let currentMatchSnapShot = await db.ref(`tables/${tableID}/archivedMatches`).get()
    let val = currentMatchSnapShot.val()
    if(val){
       return Object.entries(currentMatchSnapShot.val()) 
    }
    else{
        return []
    }
    

}
export async function getArchivedMatchesForTeamMatch(teamMatchID) {
    let currentMatchSnapShot = await db.ref(`teamMatches/${teamMatchID}/archivedMatches`).get()
    let val = currentMatchSnapShot.val()
    if(val){
       return Object.entries(currentMatchSnapShot.val()) 
    }
    else{
        return []
    }
}

export async function addScheduledMatch(tableID, matchID, startTime) {
    let match = await getMatchData(matchID)
    let matchScores = getMatchScore(match)

    let matchSummary = {
        matchID: matchID,
        playerA: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).a,
        playerB: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).b,
        AScore: matchScores.a,
        BScore: matchScores.b,
        scheduledOn: new Date().toISOString(),
        startTime: startTime
    }
    let currentMatchSnapShot = await db.ref(`tables/${tableID}/scheduledMatches`).push(matchSummary)
    return currentMatchSnapShot.key
}

export async function updateScheduledMatch(tableID, scheduledMatchID, matchID, startTime) {
    let match = await getMatchData(matchID)
    let matchScores = getMatchScore(match)
    let matchSummary = {
        matchID: matchID,
        playerA: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).a,
        playerB: getCombinedPlayerNames(match["playerA"], match["playerB"], match["playerA2"], match["playerB2"]).b,
        AScore: matchScores.a,
        BScore: matchScores.b,
        scheduledOn: new Date().toISOString(),
        startTime: startTime
    }
    let currentMatchSnapShot = await db.ref(`tables/${tableID}/scheduledMatches/${scheduledMatchID}`).set(matchSummary)
    return matchSummary
}

export async function deleteScheduledTableMatch(tableID, scheduledMatchID){
    await db.ref(`tables/${tableID}/scheduledMatches/${scheduledMatchID}`).remove()
}


export async function getTableInfo(tableID) {
    let currentMatchSnapShot = await db.ref(`tables/${tableID}`).get()
    return currentMatchSnapShot.val()

}

export async function switchSides(matchID) {
    let currentSwitchedValueSnapshot = await db.ref(`matches/${matchID}/isSwitched`).get()
    let currentSwitchedValue = currentSwitchedValueSnapshot.val()
    let newIsSwitched = currentSwitchedValue ? false : true
    await db.ref(`matches/${matchID}/isSwitched`).set(newIsSwitched)
    return newIsSwitched
}



export async function updateCurrentPlayer(currentMatchID, player, playerSettings) {
    let updatePlayer = await db.ref(`matches/${currentMatchID}/${player}/`).set(playerSettings)

}

export function getMatchScore(match) {
    let gameScore = { a: 0, b: 0 }
    for (let gameN = 1; gameN <= 9; gameN++) {
        if (match[`isGame${gameN}Finished`] === true) {
            if (match[`game${gameN}AScore`] > match[`game${gameN}BScore`]) {
                gameScore.a++
            }
            else {
                gameScore.b++
            }
        }

    }
    return gameScore
}

export async function resetMatchScores(matchID) {
    for (let gameN = 1; gameN <= 9; gameN++) {
        await Promise.all([
            db.ref(`matches/${matchID}/isGame${gameN}Finished`).set(false),
            db.ref(`matches/${matchID}/game${gameN}AScore`).set(0),
            db.ref(`matches/${matchID}/game${gameN}BScore`).set(0),
            db.ref(`matches/${matchID}/isGame${gameN}Started`).set(false),
            db.ref(`matches/${matchID}/game${gameN}StartTime`).set(""),
            db.ref(`matches/${matchID}/game${gameN}EndTime`).set(""),
        ])


    }


}

function isInitialServerServingGame(combinedPoints, serveChangePoints) {
    let serveChangedCount = Math.floor(combinedPoints / serveChangePoints)
    if (serveChangedCount % 2 === 0) {
        return true
    }
    else {
        return false
    }
}

export function isAServing(initialMatchServerIsA, gameNumber, combinedScore, serveChangePoints, pointsToWinGame) {
    const pointsAtDeuce = (pointsToWinGame - 1) * 2
    const gameIndex = gameNumber - 1
    if (combinedScore >= pointsAtDeuce) {
        if (combinedScore % 2 === 0) {
            return gameIndex % 2 === 0 ? (initialMatchServerIsA ? true : false) : (initialMatchServerIsA ? false : true)
        }
        else {
            return gameIndex % 2 === 0 ? (initialMatchServerIsA ? false : true) : (initialMatchServerIsA ? true : false)

        }
    }
    else {
        if (gameIndex % 2 === 0) {
            return isInitialServerServingGame(combinedScore, serveChangePoints) ? (initialMatchServerIsA ? true : false) : (initialMatchServerIsA ? false : true)
        }
        else {
            return isInitialServerServingGame(combinedScore, serveChangePoints) ? (initialMatchServerIsA ? false : true) : (initialMatchServerIsA ? true : false)
        }
    }

}

export function isGameFinished(enforceGameScore, playerAScore, playerBScore, pointsToWinGame) {

    if (enforceGameScore) {
        if (playerAScore >= pointsToWinGame && playerBScore <= playerAScore - 2) {
            return true
        }
        else if (playerBScore >= pointsToWinGame && playerAScore <= playerBScore - 2) {
            return true
        }
        else {
            return false
        }

    }
    else {
        return false
    }
}

export function isValidGameScore(enforceGameScore, playerAScore, playerBScore, pointsToWinGame) {

    if (enforceGameScore) {
        if (playerAScore >= pointsToWinGame && playerBScore <= playerAScore - 2) {
            if (playerBScore >= pointsToWinGame - 1 && Math.abs(playerAScore - playerBScore) === 2) {
                return true
            }
            if (playerAScore === pointsToWinGame && playerBScore < pointsToWinGame - 1) {
                return true
            }
            else {

                return false
            }

        }
        else if (playerBScore >= pointsToWinGame && playerAScore <= playerBScore - 2) {
            if (playerAScore >= pointsToWinGame - 1 && Math.abs(playerAScore - playerBScore) === 2) {
                return true
            }
            if (playerBScore === pointsToWinGame && playerAScore < pointsToWinGame - 1) {
                return true
            }
            else {
                return false
            }
        }
        else {
            return false
        }

    }
    else {
        return false
    }
}

export async function endGame(matchID, gameNumber) {
    await Promise.all([
           db.ref(`matches/${matchID}/isGame${gameNumber}Finished`).set(true),
    db.ref(`matches/${matchID}/game${gameNumber}EndTime`).set(new Date().toISOString()),
    db.ref(`matches/${matchID}/isInBetweenGames`).set(true),
    ])


    return {
        [`isGame${gameNumber}Finished`]: true,
        [`game${gameNumber}EndTime`]: new Date().toISOString(),
        isInBetweenGames: true
    }
}

export async function startGame(matchID, gameNumber) {
    await Promise.all([
            
   db.ref(`matches/${matchID}/isMatchStarted`).set(true),
     db.ref(`matches/${matchID}/matchStartTime`).set(new Date().toISOString()),
   db.ref(`matches/${matchID}/isGame${gameNumber}Started`).set(true),
  db.ref(`matches/${matchID}/game${gameNumber}StartTime`).set(new Date().toISOString()),
  db.ref(`matches/${matchID}/isInBetweenGames`).set(false),
    ])



}



export async function setInitialMatchServer(matchID, isAInitialServer) {
    await db.ref(`matches/${matchID}/isInitialServerSelected`).set(true)
    await db.ref(`matches/${matchID}/isAInitialServer`).set(isAInitialServer)
}

export function isGamePoint(match) {
    let { pointsToWinGame, } = match

    let currentScore = getCurrentGameScore(match)

    if (currentScore.a === pointsToWinGame - 1 && currentScore.b < pointsToWinGame - 1) {
        return true
    }
    else if (currentScore.b === pointsToWinGame - 1 && currentScore.a < pointsToWinGame - 1) {
        return true
    }
    else if (currentScore.a >= pointsToWinGame - 1 && currentScore.b >= pointsToWinGame - 1) {
        if (currentScore.a === currentScore.b) {
            return false
        }
        else if (Math.abs(currentScore.a - currentScore.b) === 1) {
            return true
        }
        else {
            return false
        }
    }
    else {
        return false
    }

}
//This is used with isGamePoint to determine if it is match point.
export function isFinalGame(match){
    let matchScores = getMatchScore(match)
    const gameScore = getCurrentGameScore(match)
    if((match.bestOf-1)/2 === matchScores.a && gameScore.a > gameScore.b ){
        return true
    }

    else if ((match.bestOf-1)/2 === matchScores.b && gameScore.b > gameScore.a ){

        return true
    }
    else{
        return false
    }
}

export async function setIsGamePoint(matchID, isGamePoint) {
    await db.ref(`matches/${matchID}/isGamePoint`).set(isGamePoint)
}
export async function setIsMatchPoint(matchID, isGamePoint) {
    await db.ref(`matches/${matchID}/isMatchPoint`).set(isGamePoint)
}

export async function setRoundName(matchID, roundName) {
    await db.ref(`matches/${matchID}/matchRound`).set(roundName)
}

export async function addSignificantPoint(matchID, gameNumber, playerAScore, playerBScore) {
    await db.ref(`matches/${matchID}/significantPoints`).push({
        playerAScore: playerAScore,
        playerBScore: playerBScore,
        gameNumber: gameNumber
    })
}

export async function getSignificantPoints(matchID) {
    let sigPointsSnap = await db.ref(`matches/${matchID}/significantPoints`).get()
    let sigPoints = sigPointsSnap.val()
    if(sigPoints){
        return Object.entries(sigPoints)
    }
    else {
        return []
    }
}

export async function setIsDoubles(matchID, isDoubles) {
    await db.ref(`matches/${matchID}/isDoubles`).set(isDoubles)
}

export async function setYellowFlag(matchID, AorB, isFlagged) {
    await db.ref(`matches/${matchID}/is${AorB}YellowCarded`).set(isFlagged)
}
export async function setRedFlag(matchID, AorB, isFlagged) {
    await db.ref(`matches/${matchID}/is${AorB}RedCarded`).set(isFlagged)
}

export async function setisManualMode(matchID, isManual) {
    await db.ref(`matches/${matchID}/isManualServiceMode`).set(isManual)
}

export async function flipScoreboard(matchID) {
    let currentFlipSnap = await db.ref(`matches/${matchID}/isCourtSideScoreboardFlipped`).get()
    let currentFlip = currentFlipSnap.val()
    await db.ref(`matches/${matchID}/isCourtSideScoreboardFlipped`).set(currentFlip ? false : true)
}

export async function setUsedTimeOut(matchID, AorB) {
    await db.ref(`matches/${matchID}/is${AorB}TimeOutUsed`).set(true)
    await db.ref(`matches/${matchID}/is${AorB}TimeOutActive`).set(false)
}
export async function resetUsedTimeOut(matchID, AorB) {
   await Promise.all(
        [
          db.ref(`matches/${matchID}/is${AorB}TimeOutUsed`).set(false),
    db.ref(`matches/${matchID}/is${AorB}TimeOutActive`).set(false)   
        ]
    )
   
}

export async function startTimeOut(matchID, AorB) {
    await db.ref(`matches/${matchID}/timeOutStartTime${AorB}`).set(new Date().toISOString())
    await db.ref(`matches/${matchID}/is${AorB}TimeOutActive`).set(true)
}

export async function setServerManually(matchID, isAServing) {
    await db.ref(`matches/${matchID}/isACurrentlyServing`).set(isAServing)
}

export function isMatchFinished(match) {
    let matchScores = getMatchScore(match)
    let winningGameScore = Math.floor(match.bestOf / 2) + 1
    if (winningGameScore === matchScores.a || winningGameScore === matchScores.b) {
        return true
    }
    else {
        return false
    }
}

export async function clearPlayer(matchID, player) {
    await db.ref(`matches/${matchID}/${player}`).set(getNewPlayer())
}

export async function start2MinuteWarmUp(matchID,) {
    await Promise.all([
        db.ref(`matches/${matchID}/isWarmUpStarted`).set(true),
        db.ref(`matches/${matchID}/warmUpStartTime`).set(new Date().toISOString())
    ])

}

export async function stop2MinuteWarmUp(matchID,) {
    await Promise.all([
        db.ref(`matches/${matchID}/isWarmUpFinished`).set(true),
    ])

}

export async function setBestOf(matchID, maxGames) {
    await Promise.all([
        db.ref(`matches/${matchID}/bestOf`).set(maxGames),
    ])
}
export async function setGamePointsToWinGame(matchID, pointsToWin) {
    await Promise.all([
        db.ref(`matches/${matchID}/pointsToWinGame`).set(pointsToWin),
    ])
}

export async function setChangeServiceEveryXPoints(matchID, changeEveryPoints) {
    await Promise.all([
        db.ref(`matches/${matchID}/changeServeEveryXPoints`).set(changeEveryPoints),
    ])
}

export async function manuallySetGameScore(matchID, gameNumber, AScore, BScore) {
    await Promise.all([
        db.ref(`matches/${matchID}/game${gameNumber}AScore`).set(AScore),
        db.ref(`matches/${matchID}/game${gameNumber}BScore`).set(BScore),
    ])
}

export function watchForPasswordChange(tableID, callback){
    let tableRef = db.ref(`tables/${tableID}/password`)
    tableRef.on("value", (passwordRef)=>{
        if(typeof passwordRef.val() ==="string"){
            callback(passwordRef.val())
        }
    })
    return ()=>{tableRef.off()}
}


export async function syncShowGameWonConfirmationModal(matchID, show){
   await db.ref(`matches/${matchID}/showGameWonConfirmationModal`).set(show)
}

export async function  syncShowInBetweenGamesModal(matchID, show){
    await db.ref(`matches/${matchID}/showInBetweenGamesModal`).set(show)
 }

 // Non table tennis related scoring functions
 export async function getScoringTypeForTable(tableID) {
    let currentMatchSnapShot = await db.ref(`tables/${tableID}/scoringType`).get()
    return currentMatchSnapShot.val()

}
export async function setScoringType(matchID, value) {
    let currentMatchSnapShot = await db.ref(`matches/${matchID}/scoringType`).set(value)
    

}

export async function getPointsToWinGameForTable(tableID) {
    let currentMatchSnapShot = await db.ref(`tables/${tableID}/pointsToWinGame`).get()
    return currentMatchSnapShot.val()

}


export async function BWonRally_PB(matchID, gameNumber, isACurrentlyServing, isSecondServer, isDoubles, isRallyScoring=false, pointsToWin, BScore){
    if(isRallyScoring){
        if(pointsToWin-1 === parseInt(BScore) && isACurrentlyServing){
            db.ref(`matches/${matchID}/isACurrentlyServing`).set(false)
            if(isDoubles){
                db.ref(`matches/${matchID}/isSecondServer`).set(BScore%2 === 0 ? false : true)

            }
            else{
                db.ref(`matches/${matchID}/isSecondServer`).set(false)

            }
            return BScore
        }
        else {

            db.ref(`matches/${matchID}/isACurrentlyServing`).set(false)
            let newScoreB = await AddPoint(matchID, gameNumber, "B")
            if(isDoubles){
                if(newScoreB%2 === 0){
                db.ref(`matches/${matchID}/isSecondServer`).set(false)
            }
            else{
                db.ref(`matches/${matchID}/isSecondServer`).set(true)
            }
            }
            else{
                db.ref(`matches/${matchID}/isSecondServer`).set(false)

            }
            
            return newScoreB
        }
     } else{
        if(!isACurrentlyServing){
     return await AddPoint(matchID, gameNumber, "B")
    }
     
     else{
        if(isDoubles){
              if(isSecondServer){
             db.ref(`matches/${matchID}/isACurrentlyServing`).set(false)
             db.ref(`matches/${matchID}/isSecondServer`).set(false)

         }
         else{
             db.ref(`matches/${matchID}/isSecondServer`).set(true)
         }
        }
        else{
            db.ref(`matches/${matchID}/isACurrentlyServing`).set(false)
        }

     }

     }
     return false
}

export async function AWonRally_PB(matchID, gameNumber, isACurrentlyServing, isSecondServer, isDoubles, isRallyScoring=false, pointsToWin, AScore){
    if(isRallyScoring){
        if(pointsToWin-1 === parseInt(AScore) && !isACurrentlyServing){
            db.ref(`matches/${matchID}/isACurrentlyServing`).set(true)
                            if(isDoubles){
                               db.ref(`matches/${matchID}/isSecondServer`).set(AScore%2 === 0  ? false : true) 
                            }
                            else{
                                db.ref(`matches/${matchID}/isSecondServer`).set(false) 
                            }
                            
            return AScore
        }
        else {

            db.ref(`matches/${matchID}/isACurrentlyServing`).set(true)
            let newScoreA = await AddPoint(matchID, gameNumber, "A")
            if(isDoubles){
                if(newScoreA%2 === 0){
                db.ref(`matches/${matchID}/isSecondServer`).set(false)
            }
            else{
                db.ref(`matches/${matchID}/isSecondServer`).set(true)
            }
            }
            else{
                db.ref(`matches/${matchID}/isSecondServer`).set(false)
            }
            
            return newScoreA
        }
        

      
    }
    else{
        if(isACurrentlyServing){
     return await AddPoint(matchID, gameNumber, "A")
    }
    else{
        if(isDoubles){
            if(isSecondServer){
            db.ref(`matches/${matchID}/isACurrentlyServing`).set(true)
            db.ref(`matches/${matchID}/isSecondServer`).set(false)

        }
        else{
            db.ref(`matches/${matchID}/isSecondServer`).set(true)
        }
        }
        else{
            db.ref(`matches/${matchID}/isACurrentlyServing`).set(true)
        }

    }

    }
    return false

}