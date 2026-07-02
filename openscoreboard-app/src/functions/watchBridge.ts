export type WatchScoringMatchStatus = "setup" | "inGame" | "gameOver" | "matchOver";
export type WatchScoringPromptType =
    | "confirmGame"
    | "confirmMatch"
    | "selectPlayers"
    | "setupMatch"
    | "startGame"
    | "startNextGame"
    | "setupNewMatch";
export type WatchScoringPlayerSlot = "a1" | "a2" | "b1" | "b2";

export type WatchScoringPlayer = {
    id: string;
    name: string;
    subtitle?: string;
    team?: "A" | "B";
};

export type WatchScoringMatchSettings = {
    doubles?: boolean;
    bestOf?: number;
    pointsToWin?: number;
    winBy?: number;
    serveEvery?: number;
};

export type WatchScoringMatchSettingOptions = {
    doubles?: boolean[];
    bestOf?: number[];
    pointsToWin?: number[];
    winBy?: number[];
    serveEvery?: number[];
};

export type WatchScoringState = {
    matchStatus: WatchScoringMatchStatus;
    players: WatchScoringPlayer[];
    selectedPlayers: Partial<Record<WatchScoringPlayerSlot, string>>;
    sideALabel?: string;
    sideBLabel?: string;
    matchSettings?: WatchScoringMatchSettings;
    matchSettingOptions?: WatchScoringMatchSettingOptions;
    score?: {
        a: number;
        b: number;
        gameA?: number;
        gameB?: number;
    };
    lastCompletedGame?: {
        a: number;
        b: number;
    };
    availableActions: string[];
    prompt?: {
        type: WatchScoringPromptType;
        title: string;
        message?: string;
    };
};

export type WatchAction =
    | { action: "rallyWon"; side: "A" | "B"; source?: "appleWatch"; sentAt?: string; [key: string]: any }
    | { action: "selectPlayer"; slot: WatchScoringPlayerSlot; playerId: string; source?: "appleWatch"; sentAt?: string; [key: string]: any }
    | { action: "startMatch"; source?: "appleWatch"; sentAt?: string; [key: string]: any }
    | { action: "confirmGame"; source?: "appleWatch"; sentAt?: string; [key: string]: any }
    | { action: "startNextGame"; source?: "appleWatch"; sentAt?: string; [key: string]: any }
    | { action: "confirmMatch"; source?: "appleWatch"; sentAt?: string; [key: string]: any }
    | { action: "createNewMatch"; source?: "appleWatch"; sentAt?: string; [key: string]: any }
    | { action: "setupNewMatch"; source?: "appleWatch"; sentAt?: string; [key: string]: any }
    | { action: "setMatchFormat"; payload: Record<string, unknown>; source?: "appleWatch"; sentAt?: string; [key: string]: any }
    | { action: "scoringAction"; name: string; payload?: Record<string, unknown>; source?: "appleWatch"; sentAt?: string; [key: string]: any };

declare global {
    interface Window {
        OpenScoreboardWatchBridge?: {
            publishState(state: WatchScoringState): void;
            publishStatus(status: string): void;
            receiveWatchAction?(detail: WatchAction): void;
        };
    }
}

function getSearchParams() {
    if (typeof window === "undefined") {
        return new URLSearchParams();
    }

    return new URLSearchParams(window.location.search);
}

export function isEmbeddedScoringPage() {
    return getSearchParams().get("embedded") === "1";
}

export function isCompactScoringPage() {
    return getSearchParams().get("compact") === "1";
}

export function isOpenScoreboardLiveSource() {
    return getSearchParams().get("source") === "openscoreboard-live";
}

export function isWatchBridgeEnabled() {
    return getSearchParams().get("watchRemote") === "1";
}

export function publishWatchState(state: WatchScoringState) {
    if (typeof window === "undefined") {
        return;
    }

    window.OpenScoreboardWatchBridge?.publishState(state);
}

export function publishWatchStatus(status: string) {
    if (typeof window === "undefined") {
        return;
    }

    window.OpenScoreboardWatchBridge?.publishStatus(status);
}

export function subscribeToWatchActions(handler: (action: WatchAction) => void) {
    if (typeof window === "undefined") {
        return () => {};
    }

    const listener = (event: Event) => {
        handler((event as CustomEvent<WatchAction>).detail);
    };

    window.addEventListener("openscoreboard-watch-action", listener);
    return () => window.removeEventListener("openscoreboard-watch-action", listener);
}

export function publishWhenBridgeReady(getState: () => WatchScoringState) {
    if (typeof window === "undefined") {
        return () => {};
    }

    const publish = () => publishWatchState(getState());

    publish();
    window.addEventListener("openscoreboard-watch-bridge-ready", publish);
    return () => window.removeEventListener("openscoreboard-watch-bridge-ready", publish);
}
