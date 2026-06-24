import { getCurrentGameScore, getMatchScore } from "../match";
import { getCombinedPlayersFormatted } from "../players";
import { hasPairedPlayerImages, setOptionalImageSource } from "./optionalImage";
import { hasPairedCountryFlags, setCountryFlagSource } from "./countryFlag";

type CourtSide = "A" | "B";
type MatchSide = "A" | "B";

const gameFields = Array.from({ length: 9 }, (_, index) => {
    const game = index + 1;

    return [
        `isGame${game}Started`,
        `isGame${game}Finished`,
        `game${game}AScore`,
        `game${game}BScore`,
    ];
}).flat();

const courtSideViewListenerFields = [
    "isCourtSideScoreboardFlipped",
    "isSwitched",
    "isInBetweenGames",
    "playerA",
    "playerA2",
    "playerB",
    "playerB2",
    "isACurrentlyServing",
    "isAYellowCarded",
    "isBYellowCarded",
    "isARedCarded",
    "isBRedCarded",
    ...gameFields,
];

function isAOnCourtSideA(currentMatchSettings) {
    return Boolean(currentMatchSettings?.isCourtSideScoreboardFlipped) === Boolean(currentMatchSettings?.isSwitched);
}

function resolveCourtSide(courtSide: CourtSide, currentMatchSettings): MatchSide {
    const aOnCourtSideA = isAOnCourtSideA(currentMatchSettings);

    if (courtSide === "A") {
        return aOnCourtSideA ? "A" : "B";
    }

    return aOnCourtSideA ? "B" : "A";
}

function getPlayer(currentMatchSettings, side: MatchSide, doublesPlayer = false) {
    return currentMatchSettings?.[`player${side}${doublesPlayer ? "2" : ""}`] || {};
}

function getPlayerName(player) {
    return player?.firstName || player?.lastName || "";
}

function setText(view: HTMLElement, selector: string, value) {
    view.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        element.innerText = value?.toString?.() || "";
    });
}

function setVisible(view: HTMLElement, selector: string, isVisible: boolean) {
    view.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        if (isVisible) {
            element.style.opacity = "1";
            element.style.visibility = "visible";
        }
        else {
            element.style.opacity = "0";
            element.style.visibility = "hidden";
        }
    });
}

function setImage(view: HTMLElement, selector: string, src: string) {
    view.querySelectorAll<HTMLImageElement>(selector).forEach((element) => {
        setOptionalImageSource(element, src);
    });
}

function updatePlayerFields(view: HTMLElement, currentMatchSettings, side: MatchSide) {
    const player = getPlayer(currentMatchSettings, side);
    const doublesPlayer = getPlayer(currentMatchSettings, side, true);
    const country = player?.country?.toLowerCase?.() || "";
    const imageURL = player?.imageURL || "";
    const shouldShowCountry = hasPairedCountryFlags(currentMatchSettings?.playerA, currentMatchSettings?.playerB);
    const shouldShowImage = hasPairedPlayerImages(currentMatchSettings?.playerA, currentMatchSettings?.playerB);

    setText(view, ".playerA, .playerB", getPlayerName(player));
    setText(view, ".playerA2, .playerB2", getPlayerName(doublesPlayer));
    setText(
        view,
        ".combinedAName, .combinedBName, .courtSideCombinedAName, .courtSideCombinedBName",
        getCombinedPlayersFormatted(player, doublesPlayer),
    );

    view.querySelectorAll<HTMLElement>(".jerseyColorA, .jerseyColorB").forEach((element) => {
        element.style.backgroundColor = player?.jerseyColor || "transparent";
    });

    view.querySelectorAll<HTMLImageElement>(".countryA, .countryB").forEach((element) => {
        setCountryFlagSource(element, shouldShowCountry ? country : "");
    });
    setImage(view, ".imageURLA, .imageURLB", shouldShowImage ? imageURL : "");
}

function updateScoreFields(view: HTMLElement, currentMatchSettings, side: MatchSide) {
    const scoreKey = side.toLowerCase();
    const currentGameScore = getCurrentGameScore(currentMatchSettings)?.[scoreKey] || 0;
    const matchScore = getMatchScore(currentMatchSettings)?.[scoreKey] || 0;

    setText(view, ".currentAGameScore, .currentBGameScore, .courtSideAGameScore, .courtSideBGameScore", currentGameScore);
    setText(view, ".currentAMatchScore, .currentBMatchScore, .courtSideAMatchScore, .courtSideBMatchScore", matchScore);

    for (let game = 1; game <= 9; game++) {
        setText(view, `.game${game}AScore, .game${game}BScore`, currentMatchSettings?.[`game${game}${side}Score`] || 0);
    }
}

function updateStatusFields(view: HTMLElement, currentMatchSettings, side: MatchSide) {
    const isServing = side === "A"
        ? currentMatchSettings?.isACurrentlyServing === true
        : currentMatchSettings?.isACurrentlyServing === false;

    setVisible(view, ".isACurrentlyServing, .courtSideIsACurrentlyServing, .courtSideIsBCurrentlyServing", isServing);
    setVisible(view, ".isAYellowCarded, .isBYellowCarded", currentMatchSettings?.[`is${side}YellowCarded`] === true);
    setVisible(view, ".isARedCarded, .isBRedCarded", currentMatchSettings?.[`is${side}RedCarded`] === true);
}

function updateCourtSideView(view: HTMLElement, courtSide: CourtSide, currentMatchSettings) {
    const side = resolveCourtSide(courtSide, currentMatchSettings);

    view.dataset.osbResolvedCourtSide = side;
    updatePlayerFields(view, currentMatchSettings, side);
    updateScoreFields(view, currentMatchSettings, side);
    updateStatusFields(view, currentMatchSettings, side);
}

export const courtSideViewFieldList = [
    {
        field: "courtSideAView",
        listenerFields: courtSideViewListenerFields,
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            updateCourtSideView(matchNode, "A", currentMatchSettings);
        },
    },
    {
        field: "courtSideBView",
        listenerFields: courtSideViewListenerFields,
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            updateCourtSideView(matchNode, "B", currentMatchSettings);
        },
    },
];
