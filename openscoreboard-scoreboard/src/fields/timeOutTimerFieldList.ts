type TimeOutTimerNode = HTMLElement & {
    __openScoreboardTimeoutInterval?: number;
};

const defaultTimeOutDurationSeconds = 60;

function getDurationSeconds(matchNode: HTMLElement) {
    const duration = Number(matchNode.dataset.timeoutDuration);

    if (Number.isFinite(duration) && duration > 0) {
        return duration;
    }

    return defaultTimeOutDurationSeconds;
}

function getSecondsLeft(startTime: string, durationSeconds: number) {
    const startTimeMs = new Date(startTime).getTime();

    if (!Number.isFinite(startTimeMs)) {
        return durationSeconds;
    }

    const secondsElapsed = Math.floor((Date.now() - startTimeMs) / 1000);
    return Math.max(durationSeconds - secondsElapsed, 0);
}

function hasValidStartTime(startTime: string) {
    return Number.isFinite(new Date(startTime).getTime());
}

function clearTimeOutTimer(matchNode: TimeOutTimerNode) {
    if (matchNode.__openScoreboardTimeoutInterval !== undefined) {
        window.clearInterval(matchNode.__openScoreboardTimeoutInterval);
        matchNode.__openScoreboardTimeoutInterval = undefined;
    }
}

function updateTimeOutTimerText(matchNode: HTMLElement, startTime: string, durationSeconds: number) {
    matchNode.innerText = `${getSecondsLeft(startTime, durationSeconds)}`;
}

function setTimerHidden(matchNode: TimeOutTimerNode) {
    clearTimeOutTimer(matchNode);
    matchNode.innerText = "0";
    const currentDisplay = window.getComputedStyle(matchNode).display;
    if (currentDisplay && currentDisplay !== "none") {
        matchNode.dataset.osbVisibleDisplay = currentDisplay;
    }

    matchNode.style.display = "none";
    matchNode.style.opacity = "0";
}

function runTimeOutTimer(matchNode: HTMLElement, isActive: boolean, startTime: string) {
    const timerNode = matchNode as TimeOutTimerNode;

    clearTimeOutTimer(timerNode);

    if (!isActive) {
        setTimerHidden(timerNode);
        return;
    }

    const durationSeconds = getDurationSeconds(matchNode);
    matchNode.style.display = matchNode.dataset.osbVisibleDisplay || "flex";
    matchNode.style.opacity = "1";
    matchNode.style.visibility = "visible";
    updateTimeOutTimerText(matchNode, startTime, durationSeconds);

    if (!hasValidStartTime(startTime)) {
        return;
    }

    timerNode.__openScoreboardTimeoutInterval = window.setInterval(() => {
        updateTimeOutTimerText(matchNode, startTime, durationSeconds);

        if (getSecondsLeft(startTime, durationSeconds) === 0) {
            clearTimeOutTimer(timerNode);
        }
    }, 1000);
}

function getCombinedTimeOutSettings(currentMatchSettings) {
    if (currentMatchSettings.isATimeOutActive) {
        return {
            isActive: true,
            startTime: currentMatchSettings.timeOutStartTimeA,
        };
    }

    if (currentMatchSettings.isBTimeOutActive) {
        return {
            isActive: true,
            startTime: currentMatchSettings.timeOutStartTimeB,
        };
    }

    return {
        isActive: false,
        startTime: "",
    };
}

export const timeOutTimerFieldList = [
    {
        field: "timeOutTimerA",
        label: "Time Out Timer A",
        category: "Time Outs",
        sample: "60",
        justify: "center",
        requiredFields: ["isATimeOutActive", "timeOutStartTimeA"],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            runTimeOutTimer(
                matchNode,
                currentMatchSettings.isATimeOutActive === true,
                currentMatchSettings.timeOutStartTimeA,
            );
        }
    },
    {
        field: "timeOutTimerB",
        label: "Time Out Timer B",
        category: "Time Outs",
        sample: "60",
        justify: "center",
        requiredFields: ["isBTimeOutActive", "timeOutStartTimeB"],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            runTimeOutTimer(
                matchNode,
                currentMatchSettings.isBTimeOutActive === true,
                currentMatchSettings.timeOutStartTimeB,
            );
        }
    },
    {
        field: "timeOutTimer",
        label: "Time Out Timer",
        category: "Time Outs",
        sample: "60",
        justify: "center",
        requiredFields: [
            "isATimeOutActive",
            "isBTimeOutActive",
            "timeOutStartTimeA",
            "timeOutStartTimeB",
        ],
        action: (matchNode: HTMLElement, value, currentMatchSettings) => {
            const timerSettings = getCombinedTimeOutSettings(currentMatchSettings);
            runTimeOutTimer(matchNode, timerSettings.isActive, timerSettings.startTime);
        }
    },
];
