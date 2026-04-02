
export function getCurrentGameScore(match:MatchSettings) {
    if (match) {
        console.log(match)
        if (match.isInBetweenGames) {

            for (let gameN = 1; gameN <= 9; gameN++) {
                if (match[`isGame${gameN}Started`] === true && match[`isGame${gameN}Finished`] === true) {
                    //Do Nothing
                }
                else {
                    return {
                        a: match[`game${gameN}AScore`],
                        b: match[`game${gameN}BScore`]
                    };
                }
            }
        }
        for (let gameN = 1; gameN <= 9; gameN++) {
            if (match[`isGame${gameN}Started`] === true && match[`isGame${gameN}Finished`] === false) {
                return {
                    a: match[`game${gameN}AScore`],
                    b: match[`game${gameN}BScore`]
                };
            }
        }
        return {
            a: match[`game1AScore`],
            b: match[`game1BScore`]
        };

    }
}

export function getMatchScore(match:MatchSettings) {
    let gameScore = { a: 0, b: 0 };
    for (let gameN = 1; gameN <= 9; gameN++) {
        if (match[`isGame${gameN}Finished`] === true) {
            if (match[`game${gameN}AScore`] > match[`game${gameN}BScore`]) {
                gameScore.a++;
            }
            else {
                gameScore.b++;
            }
        }

    }
    //console.log(gameScore)
    return gameScore;
}