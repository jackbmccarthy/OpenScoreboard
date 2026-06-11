import db, { getUserPath } from '../../database';
import { v4 as uuidv4 } from 'uuid';

export const SCOREKEEPER_SESSION_ACTIVE_MS = 45000;
export const SCOREKEEPER_SESSION_EXPIRE_MS = 60000;
const SCOREKEEPER_HEARTBEAT_MS = 10000;
const SCOREKEEPER_DEVICE_STORAGE_KEY = "open-scoreboard-scorekeeper-device";

export type ScorekeeperTarget = {
    commandPath: string;
    label?: string;
    ownerID: string;
    sessionPath: string;
    tableNumber?: string;
    targetID: string;
    targetPath: string;
    targetKind: "table" | "teamMatch";
    type: "table" | "teamMatchTable";
};

function getNowISO() {
    return new Date().toISOString();
}

function getStorageKey(target: ScorekeeperTarget) {
    return `open-scoreboard-scorekeeper-session:${target.sessionPath}`;
}

function getStoredID(storageKey: string) {
    if (typeof window === "undefined" || !window.localStorage) {
        return uuidv4();
    }

    try {
        const existingID = window.localStorage.getItem(storageKey);

        if (existingID) {
            return existingID;
        }

        const nextID = uuidv4();
        window.localStorage.setItem(storageKey, nextID);
        return nextID;
    }
    catch (err) {
        console.warn("[scorekeeperSessions] local storage unavailable for scorekeeper id", err);
        return uuidv4();
    }
}

function getDeviceID() {
    return getStoredID(SCOREKEEPER_DEVICE_STORAGE_KEY);
}

function getSessionID(target: ScorekeeperTarget) {
    return getStoredID(getStorageKey(target));
}

function getBrowserLabel() {
    if (typeof navigator === "undefined") {
        return "Unknown device";
    }

    const userAgent = navigator.userAgent || "";
    const browserName = getBrowserName(userAgent);
    const osName = getOSName(userAgent);

    return `${browserName} on ${osName}`;
}

function getBrowserName(userAgent = "") {
    if (userAgent.includes("Edg/")) {
        return "Edge";
    }

    if (userAgent.includes("OPR/") || userAgent.includes("Opera")) {
        return "Opera";
    }

    if (userAgent.includes("CriOS") || userAgent.includes("Chrome")) {
        return "Chrome";
    }

    if (userAgent.includes("FxiOS") || userAgent.includes("Firefox")) {
        return "Firefox";
    }

    if (userAgent.includes("Safari")) {
        return "Safari";
    }

    return "Browser";
}

function getOSName(userAgent = "") {
    if (userAgent.includes("iPad")) {
        return "iPadOS";
    }

    if (userAgent.includes("iPhone")) {
        return "iOS";
    }

    if (userAgent.includes("Android")) {
        return "Android";
    }

    if (userAgent.includes("Windows")) {
        return "Windows";
    }

    if (userAgent.includes("Mac")) {
        return "macOS";
    }

    if (userAgent.includes("Linux")) {
        return "Linux";
    }

    return "Unknown OS";
}

function getScreenSize() {
    if (typeof screen === "undefined") {
        return "";
    }

    return `${screen.width}x${screen.height}`;
}

function getViewportSize() {
    if (typeof window === "undefined") {
        return "";
    }

    return `${window.innerWidth}x${window.innerHeight}`;
}

function getScorekeeperDeviceDetails() {
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";

    return {
        browserName: getBrowserName(userAgent),
        language: typeof navigator !== "undefined" ? navigator.language || "" : "",
        osName: getOSName(userAgent),
        platform: typeof navigator !== "undefined" ? navigator.platform || "" : "",
        screenSize: getScreenSize(),
        timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "" : "",
        viewportSize: getViewportSize(),
    };
}

function getOwnerID(ownerID = "") {
    return ownerID || getUserPath() || "";
}

function getUserTargetPath(ownerID: string, targetKind: "table" | "teamMatch", targetID: string, tableNumber = "") {
    if (targetKind === "teamMatch") {
        return `users/${ownerID}/scorekeeperTargets/teamMatches/${targetID}/tables/${tableNumber || "1"}`;
    }

    return `users/${ownerID}/scorekeeperTargets/tables/${targetID}`;
}

export function getTableScorekeeperTarget(tableID: string, tableName = "", ownerID = ""): ScorekeeperTarget {
    const resolvedOwnerID = getOwnerID(ownerID);
    const targetPath = getUserTargetPath(resolvedOwnerID, "table", tableID);

    return {
        commandPath: `${targetPath}/commands`,
        label: tableName || "Table/Court",
        ownerID: resolvedOwnerID,
        sessionPath: `${targetPath}/sessions`,
        targetID: tableID,
        targetPath,
        targetKind: "table",
        type: "table",
    };
}

export function getTeamMatchScorekeeperTarget(teamMatchID: string, tableNumber: string, label = "", ownerID = ""): ScorekeeperTarget {
    const resolvedOwnerID = getOwnerID(ownerID);
    const targetPath = getUserTargetPath(resolvedOwnerID, "teamMatch", teamMatchID, tableNumber);

    return {
        commandPath: `${targetPath}/commands`,
        label: label || `Table ${tableNumber}`,
        ownerID: resolvedOwnerID,
        sessionPath: `${targetPath}/sessions`,
        tableNumber,
        targetID: teamMatchID,
        targetPath,
        targetKind: "teamMatch",
        type: "teamMatchTable",
    };
}

export async function getScorekeeperTargetFromRoute(routeParams): Promise<ScorekeeperTarget | null> {
    if (routeParams?.isTeamMatch === true || routeParams?.isTeamMatch === "true") {
        if (!routeParams.teamMatchID || !routeParams.tableNumber) {
            return null;
        }

        let ownerID = routeParams.ownerID || "";

        if (!ownerID) {
            const teamMatchSnap = await db.ref(`teamMatches/${routeParams.teamMatchID}/ownerID`).get();
            ownerID = teamMatchSnap.val() || "";
        }

        if (!ownerID) {
            return null;
        }

        return getTeamMatchScorekeeperTarget(routeParams.teamMatchID, routeParams.tableNumber, routeParams.name, ownerID);
    }

    if (!routeParams?.tableID) {
        return null;
    }

    let ownerID = routeParams.ownerID || "";

    if (!ownerID) {
        const tableSnap = await db.ref(`tables/${routeParams.tableID}/creatorID`).get();
        ownerID = tableSnap.val() || "";
    }

    if (!ownerID) {
        return null;
    }

    return getTableScorekeeperTarget(routeParams.tableID, routeParams.name, ownerID);
}

export function isScorekeeperSessionActive(session, nowMs = Date.now()) {
    if (session?.status === "blocked" || session?.status === "disconnected") {
        return false;
    }

    const lastSeenMs = Date.parse(session?.lastSeenAt || "");

    if (Number.isNaN(lastSeenMs)) {
        return false;
    }

    return nowMs - lastSeenMs <= SCOREKEEPER_SESSION_ACTIVE_MS;
}

export function isScorekeeperSessionExpired(session, nowMs = Date.now()) {
    const lastSeenMs = Date.parse(session?.lastSeenAt || "");

    if (Number.isNaN(lastSeenMs)) {
        return false;
    }

    return nowMs - lastSeenMs > SCOREKEEPER_SESSION_EXPIRE_MS;
}

export function getScorekeeperSessionAgeSeconds(session, nowMs = Date.now()) {
    const lastSeenMs = Date.parse(session?.lastSeenAt || "");

    if (Number.isNaN(lastSeenMs)) {
        return null;
    }

    return Math.max(0, Math.round((nowMs - lastSeenMs) / 1000));
}

export function watchScorekeeperSessions(target: ScorekeeperTarget, callback) {
    if (!target?.sessionPath) {
        callback([]);
        return () => {};
    }

    const sessionsRef = db.ref(target.sessionPath);
    sessionsRef.on("value", (snapshot) => {
        const sessions = snapshot.val() || {};
        const nextSessions = Object.entries(sessions).map(([sessionID, session]) => ({
            ...(typeof session === "object" && session !== null ? session : {}),
            sessionID,
        }));

        callback(nextSessions);
    });

    return () => {
        sessionsRef.off();
    };
}

export function watchAllScorekeeperSessions(ownerID: string, callback) {
    if (!ownerID) {
        callback([]);
        return () => {};
    }

    const targetsRef = db.ref(`users/${ownerID}/scorekeeperTargets`);
    targetsRef.on("value", (snapshot) => {
        const targets = snapshot.val() || {};
        const sessions = [];

        Object.entries(targets.tables || {}).forEach(([tableID, tableTarget]) => {
            const tableTargetValue: any = typeof tableTarget === "object" && tableTarget !== null ? tableTarget : {};
            const scorekeeperTarget = getTableScorekeeperTarget(tableID, tableTargetValue?.label || "Table/Court", ownerID);

            Object.entries(tableTargetValue?.sessions || {}).forEach(([sessionID, session]) => {
                sessions.push({
                    ...(typeof session === "object" && session !== null ? session : {}),
                    scorekeeperTarget,
                    sessionID,
                });
            });
        });

        Object.entries(targets.teamMatches || {}).forEach(([teamMatchID, teamMatchTarget]) => {
            const teamMatchTargetValue: any = typeof teamMatchTarget === "object" && teamMatchTarget !== null ? teamMatchTarget : {};

            Object.entries(teamMatchTargetValue?.tables || {}).forEach(([tableNumber, tableTarget]) => {
                const tableTargetValue: any = typeof tableTarget === "object" && tableTarget !== null ? tableTarget : {};
                const scorekeeperTarget = getTeamMatchScorekeeperTarget(teamMatchID, tableNumber, tableTargetValue?.label || `Table ${tableNumber}`, ownerID);

                Object.entries(tableTargetValue?.sessions || {}).forEach(([sessionID, session]) => {
                    sessions.push({
                        ...(typeof session === "object" && session !== null ? session : {}),
                        scorekeeperTarget,
                        sessionID,
                    });
                });
            });
        });

        callback(sessions);
    });

    return () => {
        targetsRef.off();
    };
}

function getBlockPaths(target: ScorekeeperTarget, sessionID = "", deviceID = "") {
    return {
        devicePath: target?.targetPath && deviceID ? `${target.targetPath}/blockedDevices/${deviceID}` : "",
        sessionPath: target?.targetPath && sessionID ? `${target.targetPath}/blockedSessions/${sessionID}` : "",
    };
}

async function getRefValue(path = "") {
    if (!path) {
        return null;
    }

    const snapshot = await db.ref(path).get();
    return snapshot.val();
}

function buildBlockValue(target: ScorekeeperTarget, session, reason = "Blocked by manager") {
    return {
        blockedAt: getNowISO(),
        blockedReason: reason,
        currentMatchID: session?.currentMatchID || session?.matchID || "",
        deviceID: session?.deviceID || "",
        deviceLabel: session?.deviceLabel || "Scorekeeper",
        browserName: session?.browserName || "",
        language: session?.language || "",
        osName: session?.osName || "",
        platform: session?.platform || "",
        screenSize: session?.screenSize || "",
        scorekeeperName: session?.scoringName || "",
        sessionID: session?.sessionID || "",
        tableNumber: session?.tableNumber || target?.tableNumber || "",
        targetID: target?.targetID || session?.targetID || "",
        targetKind: target?.targetKind || session?.targetKind || "",
        targetLabel: session?.targetLabel || target?.label || "",
        targetType: target?.type || session?.targetType || "",
        timezone: session?.timezone || "",
        userAgent: session?.userAgent || "",
        viewportSize: session?.viewportSize || "",
    };
}

export async function getScorekeeperBlock(target: ScorekeeperTarget, sessionID = "", deviceID = "") {
    if (!target?.targetPath) {
        return null;
    }

    const { devicePath, sessionPath } = getBlockPaths(target, sessionID, deviceID);
    const [deviceBlock, sessionBlock] = await Promise.all([
        getRefValue(devicePath),
        getRefValue(sessionPath),
    ]);

    return deviceBlock || sessionBlock || null;
}

export async function blockScorekeeperSession(target: ScorekeeperTarget, session, reason = "Blocked by manager") {
    if (!target?.targetPath) {
        return;
    }

    const sessionID = session?.sessionID || "";
    const deviceID = session?.deviceID || "";

    if (!sessionID && !deviceID) {
        return;
    }

    const blockValue = buildBlockValue(target, session, reason);
    const updates = {};

    if (deviceID) {
        updates[`blockedDevices/${deviceID}`] = {
            ...blockValue,
            deviceID,
        };
    }

    if (sessionID) {
        updates[`blockedSessions/${sessionID}`] = {
            ...blockValue,
            sessionID,
        };
    }

    await db.ref(target.targetPath).update(updates);
}

export async function removeScorekeeperBlock(target: ScorekeeperTarget, block) {
    if (!target?.targetPath) {
        return;
    }

    const sessionID = block?.sessionID || "";
    const deviceID = block?.deviceID || block?.blockID || "";
    const { devicePath, sessionPath } = getBlockPaths(target, sessionID, deviceID);
    const removals = [];

    if (devicePath) {
        removals.push(db.ref(devicePath).remove());
    }

    if (sessionPath) {
        removals.push(db.ref(sessionPath).remove());
    }

    await Promise.all(removals);
}

function mapBlocks(blocks, scorekeeperTarget) {
    return Object.entries(blocks || {}).map(([blockID, block]) => ({
        ...(typeof block === "object" && block !== null ? block : {}),
        blockID,
        scorekeeperTarget,
    }));
}

export function watchScorekeeperBlocks(target: ScorekeeperTarget, callback) {
    if (!target?.targetPath) {
        callback([]);
        return () => {};
    }

    const blocksRef = db.ref(`${target.targetPath}/blockedDevices`);
    blocksRef.on("value", (snapshot) => {
        callback(mapBlocks(snapshot.val() || {}, target));
    });

    return () => {
        blocksRef.off();
    };
}

export function watchAllScorekeeperBlocks(ownerID: string, callback) {
    if (!ownerID) {
        callback([]);
        return () => {};
    }

    const targetsRef = db.ref(`users/${ownerID}/scorekeeperTargets`);
    targetsRef.on("value", (snapshot) => {
        const targets = snapshot.val() || {};
        const blocks = [];

        Object.entries(targets.tables || {}).forEach(([tableID, tableTarget]) => {
            const tableTargetValue: any = typeof tableTarget === "object" && tableTarget !== null ? tableTarget : {};
            const scorekeeperTarget = getTableScorekeeperTarget(tableID, tableTargetValue?.label || "Table/Court", ownerID);

            blocks.push(...mapBlocks(tableTargetValue?.blockedDevices || {}, scorekeeperTarget));
        });

        Object.entries(targets.teamMatches || {}).forEach(([teamMatchID, teamMatchTarget]) => {
            const teamMatchTargetValue: any = typeof teamMatchTarget === "object" && teamMatchTarget !== null ? teamMatchTarget : {};

            Object.entries(teamMatchTargetValue?.tables || {}).forEach(([tableNumber, tableTarget]) => {
                const tableTargetValue: any = typeof tableTarget === "object" && tableTarget !== null ? tableTarget : {};
                const scorekeeperTarget = getTeamMatchScorekeeperTarget(teamMatchID, tableNumber, tableTargetValue?.label || `Table ${tableNumber}`, ownerID);

                blocks.push(...mapBlocks(tableTargetValue?.blockedDevices || {}, scorekeeperTarget));
            });
        });

        callback(blocks);
    });

    return () => {
        targetsRef.off();
    };
}

export async function sendScorekeeperCommand(target: ScorekeeperTarget, sessionID: string, type: string, payload = {}) {
    if (!target?.commandPath || !sessionID) {
        return;
    }

    await db.ref(`${target.commandPath}/${sessionID}/current`).set({
        createdAt: getNowISO(),
        id: uuidv4(),
        payload,
        type,
    });
}

export async function removeScorekeeperSession(target: ScorekeeperTarget, sessionID: string) {
    if (!target?.sessionPath || !sessionID) {
        return;
    }

    await db.ref(`${target.sessionPath}/${sessionID}`).remove();
}

export async function registerScorekeeperTargetMetadata(target: ScorekeeperTarget) {
    if (!target?.targetPath) {
        return;
    }

    await db.ref(target.targetPath).update({
        label: target.label || "",
        ownerID: target.ownerID,
        tableNumber: target.tableNumber || "",
        targetID: target.targetID,
        targetKind: target.targetKind,
        type: target.type,
    });
}

export async function startScorekeeperSession(target: ScorekeeperTarget, getSnapshot, onCommand) {
    if (!target?.sessionPath || !target?.commandPath) {
        return () => {};
    }

    const sessionID = getSessionID(target);
    const deviceID = getDeviceID();
    const connectedAt = getNowISO();
    const connectedAtMs = Date.parse(connectedAt);
    const sessionRef = db.ref(`${target.sessionPath}/${sessionID}`);
    const commandRef = db.ref(`${target.commandPath}/${sessionID}/current`);
    let lastCommandID = "";
    let blockNotified = false;
    let heartbeatID: any = null;

    if (typeof console !== "undefined") {
        console.info("[scorekeeperSessions] starting session", {
            commandPath: `${target.commandPath}/${sessionID}/current`,
            deviceID,
            sessionID,
            sessionPath: `${target.sessionPath}/${sessionID}`,
            targetType: target.type,
        });
    }

    const notifyBlocked = (block) => {
        if (blockNotified) {
            return;
        }

        blockNotified = true;

        if (typeof onCommand === "function") {
            onCommand({
                createdAt: getNowISO(),
                id: uuidv4(),
                payload: {
                    block,
                    reason: block?.blockedReason || "Blocked by manager",
                },
                type: "blocked",
            });
        }
    };

    const writeSession = async (status = "active") => {
        const snapshot = typeof getSnapshot === "function" ? getSnapshot() : {};
        const existingBlock = status === "active" ? await getScorekeeperBlock(target, sessionID, deviceID) : null;
        const nextStatus = existingBlock ? "blocked" : status;
        const deviceDetails = getScorekeeperDeviceDetails();

        try {
            await sessionRef.set({
                blockedAt: existingBlock?.blockedAt || "",
                blockedReason: existingBlock?.blockedReason || "",
                connectedAt,
                deviceID,
                deviceLabel: getBrowserLabel(),
                lastSeenAt: getNowISO(),
                sessionID,
                status: nextStatus,
                targetID: target.targetID,
                targetKind: target.targetKind,
                targetLabel: target.label || "",
                targetType: target.type,
                tableNumber: target.tableNumber || "",
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
                ...deviceDetails,
                ...snapshot,
            });
        }
        catch (err) {
            console.error("[scorekeeperSessions] failed to write session", {
                error: err,
                sessionPath: `${target.sessionPath}/${sessionID}`,
                status: nextStatus,
            });
            throw err;
        }

        if (existingBlock) {
            notifyBlocked(existingBlock);
            return false;
        }

        return true;
    };

    const sessionStarted = await writeSession();

    if (!sessionStarted) {
        return async () => {};
    }

    heartbeatID = setInterval(() => {
        writeSession().then((sessionStillAllowed) => {
            if (!sessionStillAllowed) {
                clearInterval(heartbeatID);
                commandRef.off();
            }
        }).catch(() => {});
    }, SCOREKEEPER_HEARTBEAT_MS);

    commandRef.on("value", async (snapshot) => {
        const command = snapshot.val();

        if (!command?.id || command.id === lastCommandID) {
            return;
        }

        const commandCreatedAtMs = Date.parse(command.createdAt || "");
        if (!Number.isNaN(commandCreatedAtMs) && commandCreatedAtMs < connectedAtMs) {
            lastCommandID = command.id;
            return;
        }

        lastCommandID = command.id;

        if (typeof onCommand === "function") {
            onCommand(command);
        }

        commandRef.remove().catch((err) => {
            console.warn("[scorekeeperSessions] command cleanup failed", {
                commandPath: `${target.commandPath}/${sessionID}/current`,
                error: err,
            });
        });
    });

    return async () => {
        if (heartbeatID) {
            clearInterval(heartbeatID);
        }
        commandRef.off();
        await writeSession("disconnected").catch(() => {});
    };
}
