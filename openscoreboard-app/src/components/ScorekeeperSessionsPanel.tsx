import React, { useEffect, useMemo, useState } from 'react';
import { Button, Spinner, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openScoreboardButtonTextColor, openScoreboardColor } from '../../openscoreboardtheme';
import {
    blockScorekeeperSession,
    getScorekeeperSessionAgeSeconds,
    isScorekeeperSessionActive,
    isScorekeeperSessionExpired,
    registerScorekeeperTargetMetadata,
    removeScorekeeperBlock,
    removeScorekeeperSession,
    sendScorekeeperCommand,
    watchAllScorekeeperBlocks,
    watchAllScorekeeperSessions,
    watchScorekeeperBlocks,
    watchScorekeeperSessions,
} from '../functions/scorekeeperSessions';

function SessionAction({ children, isDanger = false, isLoading = false, onPress }) {
    return (
        <Button
            backgroundColor={isDanger ? "red.50" : "white"}
            borderColor={isDanger ? "red.200" : "blue.100"}
            borderRadius={8}
            borderWidth={1}
            isDisabled={isLoading}
            marginLeft={2}
            marginTop={2}
            onPress={onPress}
            paddingX={3}
            variant={"outline"}
        >
            {isLoading ? (
                <Spinner color={isDanger ? "red.700" : openScoreboardColor} size={"sm"} />
            ) : (
                <Text color={isDanger ? "red.700" : "blue.700"} fontSize={"xs"} fontWeight={"bold"}>
                    {children}
                </Text>
            )}
        </Button>
    );
}

function getSessionLabel(session) {
    return session.deviceLabel || `Scorekeeper ${String(session.sessionID || "").slice(0, 6)}`;
}

function getBlockLabel(block) {
    return block.deviceLabel || `Blocked device ${String(block.deviceID || block.blockID || "").slice(0, 6)}`;
}

function getShortID(value = "") {
    const nextValue = String(value || "");

    if (!nextValue) {
        return "Unknown";
    }

    if (nextValue.length <= 14) {
        return nextValue;
    }

    return `${nextValue.slice(0, 8)}...${nextValue.slice(-4)}`;
}

function getDateTimeLabel(value = "") {
    const valueMs = Date.parse(value || "");

    if (Number.isNaN(valueMs)) {
        return "Unknown";
    }

    return new Date(valueMs).toLocaleString();
}

function getDisplaySizeLabel(session) {
    if (session.viewportSize && session.screenSize) {
        return `${session.viewportSize} viewport / ${session.screenSize} screen`;
    }

    return session.viewportSize || session.screenSize || "";
}

function SessionDetail({ label, value }) {
    if (!value) {
        return null;
    }

    return (
        <View marginRight={5} marginTop={2} minWidth={120}>
            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                {label}
            </Text>
            <Text color={"gray.900"} fontSize={"xs"} fontWeight={"semibold"}>
                {value}
            </Text>
        </View>
    );
}

function getMatchLabel(session) {
    const matchID = session.currentMatchID || session.matchID;

    if (matchID) {
        return `Match ${String(matchID).slice(0, 8)}`;
    }

    return "No match loaded";
}

function getTargetLabel(session) {
    if (session.targetLabel) {
        return session.targetLabel;
    }

    if (session.targetKind === "teamMatch" && session.tableNumber) {
        return `Team match table ${session.tableNumber}`;
    }

    return "Scorekeeping target";
}

function getStatusLabel(session, isActive) {
    if (session.status === "blocked") {
        return "Blocked";
    }

    if (session.status === "disconnected") {
        return "Disconnected";
    }

    return isActive ? "Active" : "Stale";
}

function getTargetForSession(target, session) {
    return session?.scorekeeperTarget || target;
}

export function ScorekeeperSessionsPanel({ description = "", ownerID = "", target = null, title = "Scorekeeper sessions" }) {
    const [sessions, setSessions] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [nowMs, setNowMs] = useState(Date.now());
    const [loadingAction, setLoadingAction] = useState("");

    useEffect(() => {
        if (target?.targetPath) {
            registerScorekeeperTargetMetadata(target).catch((err) => {
                console.warn("[scorekeeperSessions] failed to register target metadata", err);
            });
        }
    }, [target?.targetPath]);

    useEffect(() => {
        if (ownerID && !target) {
            return watchAllScorekeeperSessions(ownerID, setSessions);
        }

        if (!target?.sessionPath) {
            setSessions([]);
            return () => {};
        }

        return watchScorekeeperSessions(target, setSessions);
    }, [ownerID, target?.sessionPath]);

    useEffect(() => {
        if (ownerID && !target) {
            return watchAllScorekeeperBlocks(ownerID, setBlocks);
        }

        if (!target?.targetPath) {
            setBlocks([]);
            return () => {};
        }

        return watchScorekeeperBlocks(target, setBlocks);
    }, [ownerID, target?.targetPath]);

    useEffect(() => {
        const intervalID = setInterval(() => {
            setNowMs(Date.now());
        }, 5000);

        return () => {
            clearInterval(intervalID);
        };
    }, []);

    const sortedSessions = useMemo(() => {
        return [...sessions].sort((a, b) => {
            const aActive = isScorekeeperSessionActive(a, nowMs);
            const bActive = isScorekeeperSessionActive(b, nowMs);

            if (aActive !== bActive) {
                return aActive ? -1 : 1;
            }

            return Date.parse(b.lastSeenAt || "") - Date.parse(a.lastSeenAt || "");
        });
    }, [sessions, nowMs]);

    const activeSessions = sortedSessions.filter((session) => isScorekeeperSessionActive(session, nowMs));
    const sortedBlocks = useMemo(() => {
        return [...blocks].sort((a, b) => Date.parse(b.blockedAt || "") - Date.parse(a.blockedAt || ""));
    }, [blocks]);

    useEffect(() => {
        const expiredSessions = sortedSessions.filter((session) => isScorekeeperSessionExpired(session, nowMs));

        if (expiredSessions.length === 0) {
            return;
        }

        expiredSessions.forEach((session) => {
            const sessionTarget = getTargetForSession(target, session);

            removeScorekeeperSession(sessionTarget, session.sessionID).catch((err) => {
                console.warn("[scorekeeperSessions] failed to remove expired session", {
                    error: err,
                    sessionID: session.sessionID,
                });
            });
        });
    }, [nowMs, sortedSessions, target]);

    async function runSessionCommand(session, type) {
        const sessionTarget = getTargetForSession(target, session);
        const sessionID = session?.sessionID;
        const actionKey = `${sessionID}:${type}`;
        setLoadingAction(actionKey);

        try {
            await sendScorekeeperCommand(sessionTarget, sessionID, type);
        }
        finally {
            setLoadingAction("");
        }
    }

    async function blockSession(session) {
        const sessionTarget = getTargetForSession(target, session);
        const sessionID = session?.sessionID;
        const actionKey = `${sessionID}:block`;
        const reason = "Blocked by manager";
        setLoadingAction(actionKey);

        try {
            await blockScorekeeperSession(sessionTarget, session, reason);
            await sendScorekeeperCommand(sessionTarget, sessionID, "blocked", { reason });
        }
        finally {
            setLoadingAction("");
        }
    }

    async function unblockDevice(block) {
        const blockTarget = getTargetForSession(target, block);
        const blockID = block?.deviceID || block?.blockID || block?.sessionID;
        const actionKey = `${blockID}:unblock`;
        setLoadingAction(actionKey);

        try {
            await removeScorekeeperBlock(blockTarget, block);
        }
        finally {
            setLoadingAction("");
        }
    }

    async function refreshAll() {
        setLoadingAction("all:refresh");

        try {
            await Promise.all(activeSessions.map((session) => sendScorekeeperCommand(getTargetForSession(target, session), session.sessionID, "reload")));
        }
        finally {
            setLoadingAction("");
        }
    }

    async function clearStale(session) {
        const sessionTarget = getTargetForSession(target, session);
        const sessionID = session?.sessionID;
        const actionKey = `${sessionID}:clear`;
        setLoadingAction(actionKey);

        try {
            await removeScorekeeperSession(sessionTarget, sessionID);
        }
        finally {
            setLoadingAction("");
        }
    }

    return (
        <View>
            <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"}>
                <View flex={1} paddingRight={3}>
                    {title ? (
                        <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>{title}</Text>
                    ) : null}
                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                        {description || `${activeSessions.length} active ${activeSessions.length === 1 ? "scorekeeper" : "scorekeepers"} connected.`}
                    </Text>
                </View>
                <Button
                    backgroundColor={openScoreboardColor}
                    borderRadius={8}
                    isDisabled={activeSessions.length === 0 || loadingAction === "all:refresh"}
                    onPress={refreshAll}
                >
                    {loadingAction === "all:refresh" ? (
                        <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                    ) : (
                        <Text color={openScoreboardButtonTextColor} fontSize={"sm"} fontWeight={"bold"}>Refresh All</Text>
                    )}
                </Button>
            </View>

            {activeSessions.length > 1 ? (
                <View backgroundColor={"amber.50"} borderColor={"amber.200"} borderRadius={8} borderWidth={1} marginTop={3} padding={3}>
                    <Text color={"amber.900"} fontSize={"sm"} fontWeight={"bold"}>Multiple scorekeepers are connected.</Text>
                    <Text color={"amber.900"} fontSize={"xs"} marginTop={1}>
                        Two people editing the same match can overwrite each other. Use the device details below to block any kiosk that should not be scoring.
                    </Text>
                </View>
            ) : null}

            {sortedSessions.length === 0 ? (
                <View alignItems={"center"} backgroundColor={"gray.50"} borderColor={"gray.200"} borderRadius={8} borderStyle={"dashed"} borderWidth={1} marginTop={3} padding={5}>
                    <MaterialCommunityIcons name="monitor-off" size={24} color={"#6B7280"} />
                    <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginTop={2}>No scorekeepers connected</Text>
                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1} textAlign={"center"}>
                        Active scorekeeping links will appear here while they are open.
                    </Text>
                </View>
            ) : (
                sortedSessions.map((session) => {
                    const isActive = isScorekeeperSessionActive(session, nowMs);
                    const ageSeconds = getScorekeeperSessionAgeSeconds(session, nowMs);
                    const statusLabel = getStatusLabel(session, isActive);
                    const displaySizeLabel = getDisplaySizeLabel(session);

                    return (
                        <View
                            key={session.sessionID}
                            backgroundColor={isActive ? "white" : "gray.50"}
                            borderColor={isActive ? "green.200" : "gray.200"}
                            borderRadius={8}
                            borderWidth={1}
                            marginTop={3}
                            padding={3}
                        >
                            <View alignItems={"center"} flexDirection={"row"}>
                                <View
                                    backgroundColor={isActive ? "green.500" : "gray.400"}
                                    borderRadius={999}
                                    height={10}
                                    marginRight={2}
                                    width={10}
                                />
                                <View flex={1}>
                                    <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>{getSessionLabel(session)}</Text>
                                    <Text color={"gray.600"} fontSize={"xs"} marginTop={0.5}>
                                        {statusLabel} - {getTargetLabel(session)} - last seen {ageSeconds === null ? "unknown" : `${ageSeconds}s ago`} - {getMatchLabel(session)}
                                    </Text>
                                </View>
                            </View>

                            <View borderColor={"gray.100"} borderTopWidth={1} flexDirection={"row"} flexWrap={"wrap"} marginTop={3} paddingTop={1}>
                                <SessionDetail label={"Device ID"} value={getShortID(session.deviceID)} />
                                <SessionDetail label={"Session ID"} value={getShortID(session.sessionID)} />
                                <SessionDetail label={"Connected"} value={getDateTimeLabel(session.connectedAt)} />
                                <SessionDetail label={"Browser"} value={session.browserName && session.osName ? `${session.browserName} on ${session.osName}` : session.deviceLabel} />
                                <SessionDetail label={"Display"} value={displaySizeLabel} />
                                <SessionDetail label={"Timezone"} value={session.timezone} />
                                <SessionDetail label={"Language"} value={session.language} />
                                <SessionDetail label={"Platform"} value={session.platform} />
                            </View>

                            {session.userAgent ? (
                                <Text color={"gray.500"} fontSize={"2xs"} marginTop={2} numberOfLines={1}>
                                    User agent: {session.userAgent}
                                </Text>
                            ) : null}

                            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"flex-end"}>
                                {isActive ? (
                                    <>
                                        <SessionAction
                                            isLoading={loadingAction === `${session.sessionID}:reload`}
                                            onPress={() => runSessionCommand(session, "reload")}
                                        >
                                            Reload Match
                                        </SessionAction>
                                        <SessionAction
                                            isDanger
                                            isLoading={loadingAction === `${session.sessionID}:block`}
                                            onPress={() => blockSession(session)}
                                        >
                                            Block Device
                                        </SessionAction>
                                    </>
                                ) : (
                                    <SessionAction
                                        isLoading={loadingAction === `${session.sessionID}:clear`}
                                        onPress={() => clearStale(session)}
                                    >
                                        Clear
                                    </SessionAction>
                                )}
                            </View>
                        </View>
                    );
                })
            )}

            {sortedBlocks.length > 0 ? (
                <View marginTop={5}>
                    <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>Blocked devices</Text>
                    <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                        These browsers cannot use the scoring link for the listed target until they are unblocked.
                    </Text>
                    {sortedBlocks.map((block) => {
                        const blockID = block.deviceID || block.blockID || block.sessionID;
                        const blockedAtMs = Date.parse(block.blockedAt || "");
                        const blockedAtLabel = Number.isNaN(blockedAtMs) ? "unknown time" : new Date(blockedAtMs).toLocaleString();
                        const displaySizeLabel = getDisplaySizeLabel(block);

                        return (
                            <View
                                key={`${blockID}-${block.sessionID || ""}`}
                                backgroundColor={"red.50"}
                                borderColor={"red.200"}
                                borderRadius={8}
                                borderWidth={1}
                                marginTop={3}
                                padding={3}
                            >
                                <View alignItems={"center"} flexDirection={"row"}>
                                    <View
                                        backgroundColor={"red.500"}
                                        borderRadius={999}
                                        height={10}
                                        marginRight={2}
                                        width={10}
                                    />
                                    <View flex={1}>
                                        <Text color={"red.950"} fontSize={"md"} fontWeight={"bold"}>{getBlockLabel(block)}</Text>
                                        <Text color={"red.800"} fontSize={"xs"} marginTop={0.5}>
                                            {getTargetLabel(block)} - blocked {blockedAtLabel}
                                        </Text>
                                    </View>
                                </View>
                                <View borderColor={"red.100"} borderTopWidth={1} flexDirection={"row"} flexWrap={"wrap"} marginTop={3} paddingTop={1}>
                                    <SessionDetail label={"Device ID"} value={getShortID(block.deviceID || block.blockID)} />
                                    <SessionDetail label={"Session ID"} value={getShortID(block.sessionID)} />
                                    <SessionDetail label={"Browser"} value={block.browserName && block.osName ? `${block.browserName} on ${block.osName}` : block.deviceLabel} />
                                    <SessionDetail label={"Display"} value={displaySizeLabel} />
                                    <SessionDetail label={"Timezone"} value={block.timezone} />
                                </View>
                                <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"flex-end"}>
                                    <SessionAction
                                        isLoading={loadingAction === `${blockID}:unblock`}
                                        onPress={() => unblockDevice(block)}
                                    >
                                        Unblock
                                    </SessionAction>
                                </View>
                            </View>
                        );
                    })}
                </View>
            ) : null}
        </View>
    );
}
