import React, { useEffect, useState } from 'react';
import { View, Modal, Text } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { getCurrentGameNumber, getCurrentGameScore, setGame2InitialReceiverPlayerField, setGame2InitialServerPlayerField, setInitialMatchServer, setInitialReceiverPlayerField, setInitialServerPlayerField, setisManualMode, updateService } from '../functions/scoring';
import { getCombinedPlayerNames, getPlayerFormatted } from '../functions/players';
import i18n from '../translations/translate';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScoringChoiceButton, ScoringModalHeader, ScoringModalSection } from '../components/ScoringModalComponents';

export function ServiceSettingsModal(props) {
    const { playerA, playerB, playerA2, playerB2, isAInitialServer } = props;

    let [isManual, setIsManual] = useState(props.isManualServiceMode);
    let [selectedInitialServerIsA, setSelectedInitialServerIsA] = useState(isAInitialServer === true);
    let [selectedInitialServerPlayerField, setSelectedInitialServerPlayerField] = useState(getInitialServerPlayerSelection(isAInitialServer === true));
    let [selectedInitialReceiverPlayerField, setSelectedInitialReceiverPlayerField] = useState(getInitialReceiverPlayerSelection(isAInitialServer === true));
    let [selectedGame2ServerPlayerField, setSelectedGame2ServerPlayerField] = useState(getGame2ServerPlayerSelection(isAInitialServer === true));
    let [selectedGame2ReceiverPlayerField, setSelectedGame2ReceiverPlayerField] = useState(getGame2ReceiverPlayerSelection(isAInitialServer === true));
    let [loadingServicePlayerOrder, setLoadingServicePlayerOrder] = useState(false);
    useEffect(() => {
        setIsManual(props.isManualServiceMode);
    }, [props.isManualServiceMode]);

    useEffect(() => {
        setSelectedInitialServerIsA(isAInitialServer === true);
    }, [isAInitialServer]);

    useEffect(() => {
        setSelectedInitialServerPlayerField(getInitialServerPlayerSelection(selectedInitialServerIsA));
    }, [props.initialServerPlayerField, props.currentServerPlayerField, selectedInitialServerIsA]);

    useEffect(() => {
        setSelectedInitialReceiverPlayerField(getInitialReceiverPlayerSelection(selectedInitialServerIsA));
    }, [props.initialReceiverPlayerField, props.currentReceiverPlayerField, selectedInitialServerIsA]);

    useEffect(() => {
        setSelectedGame2ServerPlayerField(getGame2ServerPlayerSelection(selectedInitialServerIsA));
    }, [props.game2InitialServerPlayerField, selectedInitialServerIsA]);

    useEffect(() => {
        setSelectedGame2ReceiverPlayerField(getGame2ReceiverPlayerSelection(selectedInitialServerIsA));
    }, [props.game2InitialReceiverPlayerField, selectedInitialServerIsA]);

    let [loadingMatchServer, setLoadingMatchServer] = useState(false);
    const playerNames = getCombinedPlayerNames(playerA, playerB, playerA2, playerB2);
    const canEditGame2OpeningOrder = props.sportName === "tableTennis" && props.isDoubles === true;

    function getDoublesPlayerFieldsForSide(isASide) {
        return isASide ? ["playerA", "playerA2"] : ["playerB", "playerB2"];
    }

    function isPlayerFieldOnSide(playerField, isASide) {
        return getDoublesPlayerFieldsForSide(isASide).includes(playerField);
    }

    function getInitialServerPlayerSelection(initialServerSideIsA) {
        const candidate = props.initialServerPlayerField || props.currentServerPlayerField || "";
        return isPlayerFieldOnSide(candidate, initialServerSideIsA) ? candidate : getDoublesPlayerFieldsForSide(initialServerSideIsA)[0];
    }

    function getInitialReceiverPlayerSelection(initialServerSideIsA) {
        const candidate = props.initialReceiverPlayerField || props.currentReceiverPlayerField || "";
        return isPlayerFieldOnSide(candidate, !initialServerSideIsA) ? candidate : getDoublesPlayerFieldsForSide(!initialServerSideIsA)[0];
    }

    function getGame2ServerPlayerSelection(initialServerSideIsA) {
        const candidate = props.game2InitialServerPlayerField || "";
        return isPlayerFieldOnSide(candidate, !initialServerSideIsA) ? candidate : getDoublesPlayerFieldsForSide(!initialServerSideIsA)[0];
    }

    function getGame2ReceiverPlayerSelection(initialServerSideIsA) {
        const candidate = props.game2InitialReceiverPlayerField || "";
        return isPlayerFieldOnSide(candidate, initialServerSideIsA) ? candidate : getDoublesPlayerFieldsForSide(initialServerSideIsA)[0];
    }

    function getPlayerFieldLabel(playerField) {
        switch (playerField) {
            case "playerA":
                return "Player 1A";
            case "playerA2":
                return "Player 2A";
            case "playerB":
                return "Player 1B";
            case "playerB2":
                return "Player 2B";
            default:
                return "Player";
        }
    }

    function getPlayerNameForField(playerField) {
        return getPlayerFormatted(props[playerField]) || getPlayerFieldLabel(playerField);
    }

    function getCurrentCombinedScore() {
        const currentScore = getCurrentGameScore(props) || { a: 0, b: 0 };
        return Number(currentScore.a || 0) + Number(currentScore.b || 0);
    }

    async function recalculateService(initialServerSideIsA = selectedInitialServerIsA) {
        await updateService(props.matchID, initialServerSideIsA, getCurrentGameNumber(props), getCurrentCombinedScore(), props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType);
    }

    async function selectInitialServer(isA) {
        const serviceSideChanged = selectedInitialServerIsA !== isA;
        setSelectedInitialServerIsA(isA);
        setLoadingMatchServer(true);
        try {
            await setInitialMatchServer(props.matchID, isA);
            if (props.isDoubles === true && serviceSideChanged) {
                const defaultServerPlayerField = getDoublesPlayerFieldsForSide(isA)[0];
                const defaultReceiverPlayerField = getDoublesPlayerFieldsForSide(!isA)[0];
                const defaultGame2ServerPlayerField = getDoublesPlayerFieldsForSide(!isA)[0];
                const defaultGame2ReceiverPlayerField = getDoublesPlayerFieldsForSide(isA)[0];
                setSelectedInitialServerPlayerField(defaultServerPlayerField);
                setSelectedInitialReceiverPlayerField(defaultReceiverPlayerField);
                setSelectedGame2ServerPlayerField(defaultGame2ServerPlayerField);
                setSelectedGame2ReceiverPlayerField(defaultGame2ReceiverPlayerField);
                await Promise.all([
                    setInitialServerPlayerField(props.matchID, defaultServerPlayerField),
                    setInitialReceiverPlayerField(props.matchID, defaultReceiverPlayerField),
                    setGame2InitialServerPlayerField(props.matchID, defaultGame2ServerPlayerField),
                    setGame2InitialReceiverPlayerField(props.matchID, defaultGame2ReceiverPlayerField),
                ]);
            }
            await recalculateService(isA);
        }
        finally {
            setLoadingMatchServer(false);
        }
    }

    async function selectInitialServerPlayer(playerField) {
        setSelectedInitialServerPlayerField(playerField);
        setLoadingServicePlayerOrder(true);
        try {
            await setInitialServerPlayerField(props.matchID, playerField);
            await recalculateService();
        }
        finally {
            setLoadingServicePlayerOrder(false);
        }
    }

    async function selectInitialReceiverPlayer(playerField) {
        setSelectedInitialReceiverPlayerField(playerField);
        setLoadingServicePlayerOrder(true);
        try {
            await setInitialReceiverPlayerField(props.matchID, playerField);
            await recalculateService();
        }
        finally {
            setLoadingServicePlayerOrder(false);
        }
    }

    async function selectGame2ServerPlayer(playerField) {
        setSelectedGame2ServerPlayerField(playerField);
        setLoadingServicePlayerOrder(true);
        try {
            await setGame2InitialServerPlayerField(props.matchID, playerField);
            await recalculateService();
        }
        finally {
            setLoadingServicePlayerOrder(false);
        }
    }

    async function selectGame2ReceiverPlayer(playerField) {
        setSelectedGame2ReceiverPlayerField(playerField);
        setLoadingServicePlayerOrder(true);
        try {
            await setGame2InitialReceiverPlayerField(props.matchID, playerField);
            await recalculateService();
        }
        finally {
            setLoadingServicePlayerOrder(false);
        }
    }

    function renderPlayerOrderSection() {
        if (props.isDoubles !== true) {
            return null;
        }

        const servingPlayerFields = getDoublesPlayerFieldsForSide(selectedInitialServerIsA);
        const receivingPlayerFields = getDoublesPlayerFieldsForSide(!selectedInitialServerIsA);

        return (
            <ScoringModalSection
                compact
                title={"Game 1 Opening Order"}
                description={"Set the opening server and receiver for game 1."}
            >
                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} marginBottom={1} textTransform={"uppercase"}>
                    Game 1 Server
                </Text>
                <View flexDirection={"row"} marginBottom={3}>
                    {servingPlayerFields.map((playerField, index) => {
                        const selected = selectedInitialServerPlayerField === playerField;
                        return (
                            <View key={`service-settings-server-${playerField}`} flex={1} paddingLeft={index === 0 ? 0 : 1} paddingRight={index === 0 ? 1 : 0}>
                                <ScoringChoiceButton
                                    compact
                                    disabled={loadingMatchServer || loadingServicePlayerOrder}
                                    icon={<MaterialCommunityIcons name="account-arrow-right-outline" size={16} color={selected ? openScoreboardButtonTextColor : openScoreboardColor} />}
                                    onPress={() => selectInitialServerPlayer(playerField)}
                                    selected={selected}
                                    selectedBackgroundColor={openScoreboardColor}
                                    title={getPlayerNameForField(playerField)}
                                />
                            </View>
                        );
                    })}
                </View>
                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} marginBottom={1} textTransform={"uppercase"}>
                    Game 1 Receiver
                </Text>
                <View flexDirection={"row"}>
                    {receivingPlayerFields.map((playerField, index) => {
                        const selected = selectedInitialReceiverPlayerField === playerField;
                        return (
                            <View key={`service-settings-receiver-${playerField}`} flex={1} paddingLeft={index === 0 ? 0 : 1} paddingRight={index === 0 ? 1 : 0}>
                                <ScoringChoiceButton
                                    compact
                                    disabled={loadingMatchServer || loadingServicePlayerOrder}
                                    icon={<MaterialCommunityIcons name="account-arrow-left-outline" size={16} color={selected ? openScoreboardButtonTextColor : openScoreboardColor} />}
                                    onPress={() => selectInitialReceiverPlayer(playerField)}
                                    selected={selected}
                                    selectedBackgroundColor={openScoreboardColor}
                                    title={getPlayerNameForField(playerField)}
                                />
                            </View>
                        );
                    })}
                </View>
            </ScoringModalSection>
        );
    }

    function renderGame2PlayerOrderSection() {
        if (!canEditGame2OpeningOrder) {
            return null;
        }

        const servingPlayerFields = getDoublesPlayerFieldsForSide(!selectedInitialServerIsA);
        const receivingPlayerFields = getDoublesPlayerFieldsForSide(selectedInitialServerIsA);

        return (
            <ScoringModalSection
                compact
                title={"Game 2 Opening Order"}
                description={"The receiving team from game 1 serves first in game 2."}
            >
                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} marginBottom={1} textTransform={"uppercase"}>
                    Game 2 Server
                </Text>
                <View flexDirection={"row"} marginBottom={3}>
                    {servingPlayerFields.map((playerField, index) => {
                        const selected = selectedGame2ServerPlayerField === playerField;
                        return (
                            <View key={`service-settings-game-2-server-${playerField}`} flex={1} paddingLeft={index === 0 ? 0 : 1} paddingRight={index === 0 ? 1 : 0}>
                                <ScoringChoiceButton
                                    compact
                                    disabled={loadingMatchServer || loadingServicePlayerOrder}
                                    icon={<MaterialCommunityIcons name="account-arrow-right-outline" size={16} color={selected ? openScoreboardButtonTextColor : openScoreboardColor} />}
                                    onPress={() => selectGame2ServerPlayer(playerField)}
                                    selected={selected}
                                    selectedBackgroundColor={openScoreboardColor}
                                    title={getPlayerNameForField(playerField)}
                                />
                            </View>
                        );
                    })}
                </View>
                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} marginBottom={1} textTransform={"uppercase"}>
                    Game 2 Receiver
                </Text>
                <View flexDirection={"row"}>
                    {receivingPlayerFields.map((playerField, index) => {
                        const selected = selectedGame2ReceiverPlayerField === playerField;
                        return (
                            <View key={`service-settings-game-2-receiver-${playerField}`} flex={1} paddingLeft={index === 0 ? 0 : 1} paddingRight={index === 0 ? 1 : 0}>
                                <ScoringChoiceButton
                                    compact
                                    disabled={loadingMatchServer || loadingServicePlayerOrder}
                                    icon={<MaterialCommunityIcons name="account-arrow-left-outline" size={16} color={selected ? openScoreboardButtonTextColor : openScoreboardColor} />}
                                    onPress={() => selectGame2ReceiverPlayer(playerField)}
                                    selected={selected}
                                    selectedBackgroundColor={openScoreboardColor}
                                    title={getPlayerNameForField(playerField)}
                                />
                            </View>
                        );
                    })}
                </View>
            </ScoringModalSection>
        );
    }

    return (
        <Modal isOpen={props.isOpen} onClose={() => props.onClose()}>
            <Modal.Content maxW={540} width={"92%"}>
                <Modal.CloseButton />
                <Modal.Header>
                    <ScoringModalHeader
                        title={i18n.t("serviceSettings")}
                    />
                </Modal.Header>
                <Modal.Body backgroundColor={"gray.50"} padding={2}>
                    <ScoringModalSection
                        compact
                        title={"Game 1 Serving Side"}
                    >
                        <View flexDirection={"row"}>
                            <View flex={1} paddingRight={1}>
                                <ScoringChoiceButton
                                    compact
                                    disabled={loadingMatchServer}
                                    icon={<MaterialCommunityIcons name="table-tennis" size={16} color={selectedInitialServerIsA ? openScoreboardButtonTextColor : openScoreboardColor} />}
                                    onPress={() => selectInitialServer(true)}
                                    selected={selectedInitialServerIsA}
                                    selectedBackgroundColor={openScoreboardColor}
                                    title={playerNames.a}
                                />
                            </View>
                            <View flex={1} paddingLeft={1}>
                                <ScoringChoiceButton
                                    compact
                                    disabled={loadingMatchServer}
                                    icon={<MaterialCommunityIcons name="table-tennis" size={16} color={!selectedInitialServerIsA ? openScoreboardButtonTextColor : openScoreboardColor} />}
                                    onPress={() => selectInitialServer(false)}
                                    selected={!selectedInitialServerIsA}
                                    selectedBackgroundColor={openScoreboardColor}
                                    title={playerNames.b}
                                />
                            </View>
                        </View>
                    </ScoringModalSection>
                    {renderPlayerOrderSection()}
                    {renderGame2PlayerOrderSection()}
                    <ScoringModalSection
                        compact
                        title={i18n.t("serviceMode")}
                    >
                        <View flexDirection={"row"}>
                            <View flex={1} paddingRight={1}>
                                <ScoringChoiceButton
                                    compact
                                    onPress={() => {
                                        setIsManual(false);
                                        setisManualMode(props.matchID, false);
                                        updateService(props.matchID, selectedInitialServerIsA, getCurrentGameNumber(props), getCurrentCombinedScore(), props.changeServeEveryXPoints, props.pointsToWinGame, props.sportName, props.scoringType)
                                    }}
                                    selected={!isManual}
                                    selectedBackgroundColor={openScoreboardColor}
                                    title={i18n.t("auto")}
                                />
                            </View>
                            <View flex={1} paddingLeft={1}>
                                <ScoringChoiceButton
                                    compact
                                    onPress={() => {
                                        setIsManual(true);
                                        setisManualMode(props.matchID, true);
                                    }}
                                    selected={isManual}
                                    selectedBackgroundColor={openScoreboardColor}
                                    title={i18n.t("manual")}
                                />
                            </View>
                        </View>
                    </ScoringModalSection>
                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
