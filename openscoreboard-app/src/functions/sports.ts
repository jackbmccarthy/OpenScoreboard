


export const supportedSports = {
    tableTennis: {
        displayName: "Table Tennis",
        hasScoringTypes: false,
        defaults: {
            bestOf: 5,
            isDoubles: false,
            pointsToWinGame: 11
        }
    },
    pickleball: {
        displayName: "Pickleball",
        hasScoringTypes: true,
        defaults: {
            bestOf: 1,
            isDoubles: true,
            pointsToWinGame: 11,
        },
        scoringTypes: {
            normal: {
                displayName: "Normal"
            },
            rally: {
                displayName: "Rally Scoring",
                defaults: {
                    pointsToWinGame: 21
                }
            }
        }
    }
}

