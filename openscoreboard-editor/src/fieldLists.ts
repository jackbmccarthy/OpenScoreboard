const playerMetadataTextFields = [
    {
        field: "genderA",
        label: "Player A Gender",
        category: "Player Details",
        sample: "M",
        justify: "center"
    },
    {
        field: "genderB",
        label: "Player B Gender",
        category: "Player Details",
        sample: "F",
        justify: "center"
    },
    {
        field: "genderA2",
        label: "Player A2 Gender",
        category: "Player Details",
        sample: "M",
        justify: "center"
    },
    {
        field: "genderB2",
        label: "Player B2 Gender",
        category: "Player Details",
        sample: "F",
        justify: "center"
    },
    {
        field: "ratingA",
        label: "Player A Rating",
        category: "Player Details",
        sample: 2000,
        justify: "center"
    },
    {
        field: "ratingB",
        label: "Player B Rating",
        category: "Player Details",
        sample: 1950,
        justify: "center"
    },
    {
        field: "ratingA2",
        label: "Player A2 Rating",
        category: "Player Details",
        sample: 1850,
        justify: "center"
    },
    {
        field: "ratingB2",
        label: "Player B2 Rating",
        category: "Player Details",
        sample: 1800,
        justify: "center"
    },
    {
        field: "rankingA",
        label: "Player A Ranking",
        category: "Player Details",
        sample: 1,
        justify: "center"
    },
    {
        field: "rankingB",
        label: "Player B Ranking",
        category: "Player Details",
        sample: 2,
        justify: "center"
    },
    {
        field: "rankingA2",
        label: "Player A2 Ranking",
        category: "Player Details",
        sample: 3,
        justify: "center"
    },
    {
        field: "rankingB2",
        label: "Player B2 Ranking",
        category: "Player Details",
        sample: 4,
        justify: "center"
    },
];

const playerNameFormatTextFields = [
    {
        field: "playerAFirstInitialLastName",
        label: "Player A First Initial + Last Name",
        category: "Player Names",
        sample: "A Smith",
        justify: "flex-start"
    },
    {
        field: "playerBFirstInitialLastName",
        label: "Player B First Initial + Last Name",
        category: "Player Names",
        sample: "B Jones",
        justify: "flex-start"
    },
    {
        field: "playerA2FirstInitialLastName",
        label: "Player A2 First Initial + Last Name",
        category: "Player Names",
        sample: "C Brown",
        justify: "flex-start"
    },
    {
        field: "playerB2FirstInitialLastName",
        label: "Player B2 First Initial + Last Name",
        category: "Player Names",
        sample: "D Wilson",
        justify: "flex-start"
    },
    {
        field: "playerAFirstNameLastInitial",
        label: "Player A First Name + Last Initial",
        category: "Player Names",
        sample: "Alex S",
        justify: "flex-start"
    },
    {
        field: "playerBFirstNameLastInitial",
        label: "Player B First Name + Last Initial",
        category: "Player Names",
        sample: "Blake J",
        justify: "flex-start"
    },
    {
        field: "playerA2FirstNameLastInitial",
        label: "Player A2 First Name + Last Initial",
        category: "Player Names",
        sample: "Casey B",
        justify: "flex-start"
    },
    {
        field: "playerB2FirstNameLastInitial",
        label: "Player B2 First Name + Last Initial",
        category: "Player Names",
        sample: "Drew W",
        justify: "flex-start"
    },
    {
        field: "playerANameWithRating",
        label: "Player A Name + Rating",
        category: "Player Names",
        sample: "Alex Smith (2000)",
        justify: "flex-start"
    },
    {
        field: "playerBNameWithRating",
        label: "Player B Name + Rating",
        category: "Player Names",
        sample: "Blake Jones (1950)",
        justify: "flex-start"
    },
    {
        field: "playerA2NameWithRating",
        label: "Player A2 Name + Rating",
        category: "Player Names",
        sample: "Casey Brown (1850)",
        justify: "flex-start"
    },
    {
        field: "playerB2NameWithRating",
        label: "Player B2 Name + Rating",
        category: "Player Names",
        sample: "Drew Wilson (1800)",
        justify: "flex-start"
    },
];

const combinedNameFormatTextFields = [
    {
        field: "combinedAFirstInitialLastName",
        label: "Combined A First Initial + Last Name",
        category: "Player Names",
        sample: "A Smith / C Brown",
        justify: "flex-start"
    },
    {
        field: "combinedBFirstInitialLastName",
        label: "Combined B First Initial + Last Name",
        category: "Player Names",
        sample: "B Jones / D Wilson",
        justify: "flex-start"
    },
    {
        field: "combinedAFirstNameLastInitial",
        label: "Combined A First Name + Last Initial",
        category: "Player Names",
        sample: "Alex S / Casey B",
        justify: "flex-start"
    },
    {
        field: "combinedBFirstNameLastInitial",
        label: "Combined B First Name + Last Initial",
        category: "Player Names",
        sample: "Blake J / Drew W",
        justify: "flex-start"
    },
    {
        field: "combinedANameWithRating",
        label: "Combined A Name + Rating",
        category: "Player Names",
        sample: "Smith (2000) / Brown (1850)",
        justify: "flex-start"
    },
    {
        field: "combinedBNameWithRating",
        label: "Combined B Name + Rating",
        category: "Player Names",
        sample: "Jones (1950) / Wilson (1800)",
        justify: "flex-start"
    },
];

const courtSideCombinedNameFormatTextFields = [
    {
        field: "courtSideCombinedAFirstInitialLastName",
        label: "Court Side A First Initial + Last Name",
        category: "Court Side",
        sample: "A Smith / C Brown",
        justify: "flex-start"
    },
    {
        field: "courtSideCombinedBFirstInitialLastName",
        label: "Court Side B First Initial + Last Name",
        category: "Court Side",
        sample: "B Jones / D Wilson",
        justify: "flex-start"
    },
    {
        field: "courtSideCombinedAFirstNameLastInitial",
        label: "Court Side A First Name + Last Initial",
        category: "Court Side",
        sample: "Alex S / Casey B",
        justify: "flex-start"
    },
    {
        field: "courtSideCombinedBFirstNameLastInitial",
        label: "Court Side B First Name + Last Initial",
        category: "Court Side",
        sample: "Blake J / Drew W",
        justify: "flex-start"
    },
    {
        field: "courtSideCombinedANameWithRating",
        label: "Court Side A Name + Rating",
        category: "Court Side",
        sample: "Smith (2000) / Brown (1850)",
        justify: "flex-start"
    },
    {
        field: "courtSideCombinedBNameWithRating",
        label: "Court Side B Name + Rating",
        category: "Court Side",
        sample: "Jones (1950) / Wilson (1800)",
        justify: "flex-start"
    },
];

export const textFieldList = [
    {
        field: "playerA",
        label: "Player A",
        category: "Player Names",
        sample: "Player A",
        justify: "flex-start"
    },
    {
        field: "playerB",
        label: "Player B",
        category: "Player Names",
        sample: "Player B",
        justify: "flex-start"
    },
    {
        field: "playerB2",
        label: "Player B2",
        category: "Player Names",
        sample: "Player B2",
        justify: "flex-start"
    },
    {
        field: "playerA2",
        label: "Player A2",
        category: "Player Names",
        sample: "Player A2",
        justify: "flex-start"
    },
    ...playerNameFormatTextFields,
    ...playerMetadataTextFields,
    {
        field: "game1AScore",
        label: "Player A G1 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game1BScore",
        label: "Player B G1 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game2AScore",
        label: "Player A G2 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game2BScore",
        label: "Player B G2 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game3AScore",
        label: "Player A G3 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game3BScore",
        label: "Player B G3 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game4AScore",
        label: "Player A G4 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game4BScore",
        label: "Player B G4 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game5AScore",
        label: "Player A G5 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game5BScore",
        label: "Player B G5 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game6AScore",
        label: "Player A G6 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game6BScore",
        label: "Player B G6 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game7AScore",
        label: "Player A G7 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game7BScore",
        label: "Player B G7 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },

    {
        field: "game8AScore",
        label: "Player A G8 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game8BScore",
        label: "Player B G8 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },

    {
        field: "game9AScore",
        label: "Player A G9 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "game9BScore",
        label: "Player B G9 Score",
        category: "Game Scores",
        sample: 0,
        justify: "center"
    },
    {
        field: "eventName",
        label: "Event Name",
        category: "Match",
        sample: "Open Singles",
        justify: "center"
    },
    {
        field: "matchRound",
        label: "Round",
        category: "Match",
        sample: "Quarter Final",
        justify: "center"
    },
    {
        field: "teamAName",
        label: "Team A Name",
        category: "Teams",
        sample: "Team A",
        justify: "flex-start"
    },
    {
        field: "teamBName",
        label: "Team B Name",
        category: "Teams",
        sample: "Team B",
        justify: "flex-start"
    },
];
export const currentGameFieldList = [
    {
        field: "currentAGameScore",
        label: "A Game Score",
        category: "Current Game",
        sample: "0",
        justify: "center"
    },
    {
        field: "currentBGameScore",
        label: "B Game Score",
        category: "Current Game",
        sample: "0",
        justify: "center"
    },
    {
        field: "currentAMatchScore",
        label: "A Match Score",
        category: "Current Game",
        sample: "0",
        justify: "center"
    },
    {
        field: "currentBMatchScore",
        label: "B Match Score",
        category: "Current Game",
        sample: "0",
        justify: "center"
    },
    //combinedAName
    {
        field: "combinedAName",
        label: "Combined A Name",
        category: "Player Names",
        sample: "Combined Player A",
        justify: "flex-start"
    },
    {
        field: "combinedBName",
        label: "Combined B Name",
        category: "Player Names",
        sample: "Combined Player B",
        justify: "flex-start"
    },
    ...combinedNameFormatTextFields,
];
export const teamFieldList = [
    {
        field: "teamAScore",
        label: "Team A Score",
        category: "Teams",
        sample: "0",
        justify: "center"
    },
    {
        field: "teamBScore",
        label: "Team B Score",
        category: "Teams",
        sample: "0",
        justify: "center"
    },
    {
        field: "teamAName",
        label: "Team A Name",
        category: "Teams",
        sample: "Team A",
        justify: "flex-start"
    },
    {
        field: "teamBName",
        label: "Team B Name",
        category: "Teams",
        sample: "Team B",
        justify: "flex-start"
    },
];
export const conditionalShowFieldList = [
    {
        field: "isACurrentlyServing",
    },
    {
        field: "isGamePoint",
    },
    {
        field: "isMatchPoint",
    },
    {
        field: "isATimeOutActive",
    },
    {
        field: "isBTimeOutActive",
    },
    {
        field: "isTimeOutActive",
    },
    {
        field: "isATimeOutUsed",
    },
    {
        field: "isBTimeOutUsed",
    },
];
export const solidColorFieldList = [
    {
        field: "jerseyColorA",
        label: "Jersey Color A",
        category: "Jersey Color",
        sample: "red",
    },
    {
        field: "jerseyColorB",
        label: "Jersey Color B",
        category: "Jersey Color",
        sample: "blue",
    },
    {
        field: "teamJerseyColorA",
        label: "Team A Jersey Color",
        category: "Jersey Color",
        sample: "#0055FF",
    },
    {
        field: "teamJerseyColorB",
        label: "Team B Jersey Color",
        category: "Jersey Color",
        sample: "#D62828",
    },
];

export const imageFieldList = [
    {
        field: "countryA",
        label: "Country Flag A",
        category: "Flags",
        sample: "us.png",
       // justify: "center"
    },
    {
        field: "countryB",
        label: "Country Flag B",
        category: "Flags",
        sample: "us.png",
       // justify: "center"
    },
    {
        field: "imageURLA",
        label: "Player Image A",
        category: "Player Images",
        sample: "",
       // justify: "center"
    },
    {
        field: "imageURLB",
        label: "Player Image B",
        category: "Player Images",
        sample: "",
       // justify: "center"
    },
    {
        field: "teamLogoURLA",
        label: "Team A Logo URL",
        category: "Teams",
        sample: "",
       // justify: "center"
    },
    {
        field: "teamLogoURLB",
        label: "Team B Logo URL",
        category: "Teams",
        sample: "",
       // justify: "center"
    },

]


export const courtSideGameFieldList = [
    {
        field: "courtSideAGameScore",
        label: "A Game Score",
        category: "Court Side",
        sample: "0",
        justify: "center"
    },
    {
        field: "courtSideBGameScore",
        label: "B Game Score",
        category: "Court Side",
        sample: "0",
        justify: "center"
    },
    {
        field: "courtSideAMatchScore",
        label: "A Match Score",
        category: "Court Side",
        sample: "0",
        justify: "center"
    },
    {
        field: "courtSideBMatchScore",
        label: "B Match Score",
        category: "Court Side",
        sample: "0",
        justify: "center"
    },
    //combinedAName
    {
        field: "courtSideCombinedAName",
        label: "Combined A Name",
        category: "Court Side",
        sample: "Combined Player A",
       // justify: "flex-start"
    },
    {
        field: "courtSideCombinedBName",
        label: "Combined B Name",
        category: "Court Side",
        sample: "Combined Player B",
       // justify: "flex-start"
    },
    ...courtSideCombinedNameFormatTextFields,

];
