// Sports configuration
// Kept minimal - only what's needed by other modules

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
  },
  tennis: {
    displayName: "Tennis",
    hasScoringTypes: true,
    defaults: {
      bestOf: 3,
      isDoubles: false,
      pointsToWinGame: 4
    }
  },
  badminton: {
    displayName: "Badminton",
    hasScoringTypes: true,
    defaults: {
      bestOf: 3,
      isDoubles: false,
      pointsToWinGame: 21
    }
  }
};
