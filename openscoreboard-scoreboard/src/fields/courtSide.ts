type CourtSide = "A" | "B";
type MatchSide = "A" | "B";

let cachedReverseParameter: boolean | null = null;

export function isCourtSideReverseEnabled() {
    if (cachedReverseParameter !== null) {
        return cachedReverseParameter;
    }

    if (typeof window === "undefined") {
        cachedReverseParameter = false;
        return cachedReverseParameter;
    }

    cachedReverseParameter = new URLSearchParams(window.location.search).get("reverse") === "1";
    return cachedReverseParameter;
}

export function getEffectiveCourtSideScoreboardFlipped(currentMatchSettings) {
    const isFlipped = Boolean(currentMatchSettings?.isCourtSideScoreboardFlipped);
    return isCourtSideReverseEnabled() ? !isFlipped : isFlipped;
}

export function isAOnCourtSideA(currentMatchSettings) {
    return getEffectiveCourtSideScoreboardFlipped(currentMatchSettings) === Boolean(currentMatchSettings?.isSwitched);
}

export function resolveCourtSide(courtSide: CourtSide, currentMatchSettings): MatchSide {
    const aOnCourtSideA = isAOnCourtSideA(currentMatchSettings);

    if (courtSide === "A") {
        return aOnCourtSideA ? "A" : "B";
    }

    return aOnCourtSideA ? "B" : "A";
}

export function isCourtSideServing(courtSide: CourtSide, currentMatchSettings) {
    const side = resolveCourtSide(courtSide, currentMatchSettings);

    return side === "A"
        ? currentMatchSettings?.isACurrentlyServing === true
        : currentMatchSettings?.isACurrentlyServing === false;
}
