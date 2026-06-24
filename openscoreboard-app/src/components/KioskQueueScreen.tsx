import React from 'react';
import { Spinner, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openScoreboardButtonTextColor, openScoreboardColor } from '../../openscoreboardtheme';
import { ScoringGradientButton } from './ScoringGradientButton';

function getPlayerLabel(value, fallback) {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export function KioskQueueScreen({ isStarting, nextMatch, onContinue, queueCount, statusMessage, tableName }) {
    const scheduledMatch = nextMatch?.[1] || null;
    const playerA = getPlayerLabel(scheduledMatch?.playerA, "Waiting for Player A");
    const playerB = getPlayerLabel(scheduledMatch?.playerB, "Waiting for Player B");
    const hasPlayers = !!scheduledMatch?.playerA?.trim() && !!scheduledMatch?.playerB?.trim();

    return (
        <View alignItems={"center"} backgroundColor={"gray.950"} flex={1} justifyContent={"center"} padding={5}>
            <View alignItems={"center"} maxWidth={620} width={"100%"}>
                <View
                    alignItems={"center"}
                    backgroundColor={scheduledMatch ? "blue.50" : "gray.900"}
                    borderColor={scheduledMatch ? "blue.200" : "gray.700"}
                    borderRadius={8}
                    borderWidth={1}
                    padding={6}
                    width={"100%"}
                >
                    <MaterialCommunityIcons
                        name={scheduledMatch ? "calendar-check-outline" : "monitor-lock"}
                        size={44}
                        color={scheduledMatch ? openScoreboardColor : "#D1D5DB"}
                    />
                    <Text
                        color={scheduledMatch ? "gray.900" : "white"}
                        fontSize={"2xl"}
                        fontWeight={"bold"}
                        marginTop={3}
                        textAlign={"center"}
                    >
                        {scheduledMatch ? "Next match ready" : "Waiting for a match"}
                    </Text>
                    <Text
                        color={scheduledMatch ? "gray.600" : "gray.300"}
                        fontSize={"sm"}
                        marginTop={1}
                        textAlign={"center"}
                    >
                        {tableName || "Kiosk table"}
                    </Text>

                    {scheduledMatch ? (
                        <View marginTop={5} width={"100%"}>
                            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textAlign={"center"} textTransform={"uppercase"}>
                                {scheduledMatch.matchRound || scheduledMatch.eventName || "Scheduled match"}
                            </Text>
                            <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"} marginTop={2} textAlign={"center"}>
                                {playerA}
                            </Text>
                            <Text color={"gray.400"} fontSize={"xs"} fontWeight={"bold"} marginY={1} textAlign={"center"}>VS</Text>
                            <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"} textAlign={"center"}>
                                {playerB}
                            </Text>
                            <Text color={"gray.600"} fontSize={"xs"} marginTop={3} textAlign={"center"}>
                                Best of {scheduledMatch.bestOf || 5}
                                {queueCount > 1 ? ` · ${queueCount - 1} more queued` : ""}
                            </Text>

                            {!hasPlayers ? (
                                <View backgroundColor={"amber.50"} borderColor={"amber.200"} borderRadius={8} borderWidth={1} marginTop={4} padding={3}>
                                    <Text color={"amber.900"} fontSize={"sm"} fontWeight={"bold"} textAlign={"center"}>
                                        Waiting for player selections
                                    </Text>
                                    <Text color={"amber.800"} fontSize={"xs"} marginTop={1} textAlign={"center"}>
                                        The organizer or teams must finish this matchup before scoring can begin.
                                    </Text>
                                </View>
                            ) : (
                                <View marginTop={5}>
                                    {statusMessage ? (
                                        <View backgroundColor={"red.50"} borderColor={"red.200"} borderRadius={8} borderWidth={1} marginBottom={3} padding={3}>
                                            <Text color={"red.800"} fontSize={"xs"} fontWeight={"bold"} textAlign={"center"}>
                                                {statusMessage}
                                            </Text>
                                        </View>
                                    ) : null}
                                    <ScoringGradientButton
                                        disabled={isStarting}
                                        onPress={onContinue}
                                        style={{ minHeight: 52, width: "100%" }}
                                    >
                                        {isStarting ? (
                                            <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                        ) : (
                                            <Text color={openScoreboardButtonTextColor} fontSize={"md"} fontWeight={"bold"}>
                                                Continue to match setup
                                            </Text>
                                        )}
                                    </ScoringGradientButton>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View alignItems={"center"} marginTop={5}>
                            <Spinner color={"gray.300"} />
                            <Text color={"gray.300"} fontSize={"sm"} marginTop={3} textAlign={"center"}>
                                An administrator will send the next scheduled match to this table.
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}
