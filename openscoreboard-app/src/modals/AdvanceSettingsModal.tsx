import React, { useEffect, useState } from 'react';
import { Text, View, Modal, Spinner } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { endGame, flipScoreboard, getCurrentGameNumber, getMatchScore, setBestOf, setChangeServiceEveryXPoints, setGamePointsToWinGame, setScoringType } from '../functions/scoring';
import { getCombinedPlayerNames } from '../functions/players';
import { EditGameScoreItem } from '../listitems/EditGameScoreItem';
import i18n from '../translations/translate';
import { supportedSports } from '../functions/sports';
import { ScoringChoiceButton, ScoringDangerButton, ScoringModalHeader, ScoringModalSection, ScoringPrimaryButton, ScoringSecondaryButton, ScoringSegmentedTabs } from '../components/ScoringModalComponents';

function OptionCell({ children, minWidth = 58 }) {
    return (
        <View flex={1} padding={1} style={{ minWidth }}>
            {children}
        </View>
    );
}

function OptionGroup({ children }) {
    return (
        <View flexDirection={"row"} flexWrap={"wrap"} marginX={-1}>
            {children}
        </View>
    );
}

function SettingsLabel({ children }) {
    return (
        <Text color={"gray.700"} fontSize={"xs"} fontWeight={"bold"} marginBottom={1} marginTop={2} textTransform={"uppercase"}>
            {children}
        </Text>
    );
}

export function AdvanceSettingsModal(props) {
    const [activeTab, setActiveTab] = useState("settings");
    const [confirmAbandonMatch, setConfirmAbandonMatch] = useState(false)
    const [abandonMatchError, setAbandonMatchError] = useState("")
    const [loadingAbandonMatch, setLoadingAbandonMatch] = useState(false)
    const [confirmManualEndGame, setConfirmManualEndGame] = useState(false)
    const [loadingManualEndGame, setLoadingManualEndGame] = useState(false)
    const [bestOfGames, setBestOfGames] = useState(props.bestOf)
    const [pointsToWinGame, setPointsToWinGame] = useState(props.pointsToWinGame)
    const [changeServeEveryXPoints, setChangeServeEveryXPoints] = useState(props.changeServeEveryXPoints)
    const [selectedScoringType, setSelectedScoringType] = useState(props.scoringType)

    const matchScores = getMatchScore(props)
    const gamesPlayed = matchScores.a + matchScores.b
    const finishedGames = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((gameNumber) => props[`isGame${gameNumber}Finished`]);
    const sportSettings = supportedSports[props.sportName];
    const playerNames = getCombinedPlayerNames(props.playerA, props.playerB, props.playerA2, props.playerB2);

    useEffect(() => {
        setBestOfGames(props.bestOf)
        setPointsToWinGame(props.pointsToWinGame)
        setChangeServeEveryXPoints(props.changeServeEveryXPoints)
        setSelectedScoringType(props.scoringType)
    }, [props.bestOf, props.pointsToWinGame, props.changeServeEveryXPoints, props.scoringType])

    useEffect(() => {
        if (!props.isOpen) {
            setConfirmAbandonMatch(false)
            setAbandonMatchError("")
            setLoadingAbandonMatch(false)
        }
    }, [props.isOpen])

    function renderSettingsTab() {
        return (
            <View>
                {props.isKioskMode ? (
                    <ScoringModalSection
                        title={"Scheduled match settings"}
                        description={"Match format, players, round, and scoring rules are locked by the kiosk schedule."}
                    >
                        <View alignItems={"center"} backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} flexDirection={"row"} padding={3}>
                            <Text color={"blue.900"} flex={1} fontSize={"sm"} fontWeight={"bold"}>
                                Best of {bestOfGames} · {playerNames.a} vs {playerNames.b}
                            </Text>
                        </View>
                    </ScoringModalSection>
                ) : (
                    <ScoringModalSection
                        title={"Match format"}
                        description={"These options define the length of the match. Some choices lock once enough games have already been played."}
                    >
                        <SettingsLabel>{i18n.t("winBestOf")}</SettingsLabel>
                        <OptionGroup>
                            {[1, 3, 5, 7, 9].map((bestOf) => (
                                <OptionCell key={bestOf}>
                                    <ScoringChoiceButton
                                        disabled={gamesPlayed >= bestOf}
                                        onPress={() => {
                                            setBestOfGames(bestOf)
                                            setBestOf(props.matchID, bestOf)
                                        }}
                                        selected={bestOfGames === bestOf}
                                        selectedBackgroundColor={openScoreboardColor}
                                        title={`${bestOf}`}
                                    />
                                </OptionCell>
                            ))}
                        </OptionGroup>
                    </ScoringModalSection>
                )}

                <ScoringModalSection
                    title={"Game settings"}
                    description={props.isKioskMode ?
                        "The scheduled scoring rules are locked. Operational controls remain available."
                        : "Adjust scoring rules for the active match. These settings affect service and game-completion behavior."}
                >
                    <SettingsLabel>{i18n.t("manuallyFinishGame")}</SettingsLabel>
                    <View marginBottom={3}>
                        {confirmManualEndGame ? (
                            <View>
                                <View
                                    backgroundColor={"red.50"}
                                    borderColor={"red.200"}
                                    borderRadius={10}
                                    borderWidth={1}
                                    marginBottom={3}
                                    padding={3}
                                >
                                    <Text color={"red.800"} fontSize={"sm"} fontWeight={"bold"}>
                                        Are you sure you want to end this game early?
                                    </Text>
                                    <Text color={"red.700"} fontSize={"xs"} marginTop={1}>
                                        This will finish the current game with the score shown on screen and move the match forward. This action cannot be undone from scoring.
                                    </Text>
                                </View>
                                <View flexDirection={"row"}>
                                    <View flex={1} paddingRight={1}>
                                        <ScoringDangerButton
                                            disabled={loadingManualEndGame}
                                            onPress={async () => {
                                                setLoadingManualEndGame(true)
                                                let newMatchValues = await endGame(props.matchID, getCurrentGameNumber(props))
                                                props.openAfterGamePrompt({ ...props, ...newMatchValues })
                                                props.onClose()
                                                setLoadingManualEndGame(false)
                                                setConfirmManualEndGame(false)
                                            }}
                                        >
                                            {loadingManualEndGame ? (
                                                <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                            ) : (
                                                <Text color={"white"} fontWeight={"bold"}>Yes, End Game</Text>
                                            )}
                                        </ScoringDangerButton>
                                    </View>
                                    <View flex={1} paddingLeft={1}>
                                        <ScoringSecondaryButton onPress={() => setConfirmManualEndGame(false)}>
                                            <Text color={openScoreboardColor} fontWeight={"bold"}>No, Keep Playing</Text>
                                        </ScoringSecondaryButton>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <ScoringPrimaryButton
                                onPress={() => {
                                    setConfirmManualEndGame(true)
                                }}
                            >
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("manuallyFinishGame")}</Text>
                            </ScoringPrimaryButton>
                        )}
                    </View>

                    {!props.isKioskMode ? (
                        <>
                            <SettingsLabel>{i18n.t("pointsToWinGame")}</SettingsLabel>
                            <OptionGroup>
                                {[
                                    { label: "11", value: 11 },
                                    { label: "15", value: 15 },
                                    { label: "21", value: 21 },
                                    { label: "No Limit", value: 9999 },
                                ].map((option) => (
                                    <OptionCell key={option.value} minWidth={option.value === 9999 ? 94 : 58}>
                                        <ScoringChoiceButton
                                            onPress={() => {
                                                setPointsToWinGame(option.value)
                                                setGamePointsToWinGame(props.matchID, option.value)
                                            }}
                                            selected={pointsToWinGame === option.value}
                                            selectedBackgroundColor={openScoreboardColor}
                                            title={option.label}
                                        />
                                    </OptionCell>
                                ))}
                            </OptionGroup>

                            <SettingsLabel>{i18n.t("changeServerEveryXPoints")}</SettingsLabel>
                            <OptionGroup>
                                {[1, 2, 5].map((points) => (
                                    <OptionCell key={points}>
                                        <ScoringChoiceButton
                                            onPress={() => {
                                                setChangeServeEveryXPoints(points)
                                                setChangeServiceEveryXPoints(props.matchID, points)
                                            }}
                                            selected={changeServeEveryXPoints === points}
                                            selectedBackgroundColor={openScoreboardColor}
                                            title={`${points}`}
                                        />
                                    </OptionCell>
                                ))}
                            </OptionGroup>

                            {sportSettings?.hasScoringTypes ? (
                                <>
                                    <SettingsLabel>{i18n.t("changeScoringType")}</SettingsLabel>
                                    <OptionGroup>
                                        {Object.entries(sportSettings.scoringTypes).map(([id, scoringType]) => (
                                            <OptionCell key={id} minWidth={110}>
                                                <ScoringChoiceButton
                                                    onPress={() => {
                                                        setSelectedScoringType(id)
                                                        setScoringType(props.matchID, id)
                                                    }}
                                                    selected={id === selectedScoringType}
                                                    selectedBackgroundColor={openScoreboardColor}
                                                    title={scoringType["displayName"]}
                                                />
                                            </OptionCell>
                                        ))}
                                    </OptionGroup>
                                </>
                            ) : null}
                        </>
                    ) : null}
                </ScoringModalSection>

                <ScoringModalSection
                    title={"Scoreboard controls"}
                    description={"Use this when the visual court-side scoreboard is reversed from the physical table or court."}
                >
                    <ScoringSecondaryButton
                        onPress={() => {
                            flipScoreboard(props.matchID)
                        }}
                    >
                        <Text color={openScoreboardColor} fontWeight={"bold"}>{i18n.t("flipCourtSideScoreboard")}</Text>
                    </ScoringSecondaryButton>
                </ScoringModalSection>

                <ScoringModalSection
                    title={"Abandon match"}
                    description={"Discard this scoring attempt and immediately open setup for a new match."}
                >
                    {confirmAbandonMatch ? (
                        <View>
                            <View
                                backgroundColor={"red.50"}
                                borderColor={"red.200"}
                                borderRadius={10}
                                borderWidth={1}
                                marginBottom={3}
                                padding={3}
                            >
                                <Text color={"red.800"} fontSize={"sm"} fontWeight={"bold"}>
                                    Abandon the current match?
                                </Text>
                                <Text color={"red.700"} fontSize={"xs"} marginTop={1}>
                                    Current scores will be discarded. A scheduled fixture will return to the pending list, and the new match setup wizard will open immediately.
                                </Text>
                            </View>
                            {abandonMatchError ? (
                                <Text color={"red.700"} fontSize={"xs"} fontWeight={"bold"} marginBottom={2}>
                                    {abandonMatchError}
                                </Text>
                            ) : null}
                            <View flexDirection={"row"}>
                                <View flex={1} paddingRight={1}>
                                    <ScoringDangerButton
                                        disabled={loadingAbandonMatch}
                                        onPress={async () => {
                                            setLoadingAbandonMatch(true)
                                            setAbandonMatchError("")
                                            try {
                                                await props.abandonCurrentMatch()
                                            }
                                            catch (error) {
                                                console.error("[AdvanceSettingsModal] failed to abandon match", error)
                                                setAbandonMatchError("The match could not be abandoned. Please try again.")
                                                setLoadingAbandonMatch(false)
                                            }
                                        }}
                                    >
                                        {loadingAbandonMatch ? (
                                            <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                        ) : (
                                            <Text color={"white"} fontWeight={"bold"}>Abandon Match</Text>
                                        )}
                                    </ScoringDangerButton>
                                </View>
                                <View flex={1} paddingLeft={1}>
                                    <ScoringSecondaryButton
                                        disabled={loadingAbandonMatch}
                                        onPress={() => {
                                            setConfirmAbandonMatch(false)
                                            setAbandonMatchError("")
                                        }}
                                    >
                                        <Text color={openScoreboardColor} fontWeight={"bold"}>Keep Playing</Text>
                                    </ScoringSecondaryButton>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <ScoringDangerButton onPress={() => setConfirmAbandonMatch(true)}>
                            <Text color={"white"} fontWeight={"bold"}>Abandon Match</Text>
                        </ScoringDangerButton>
                    )}
                </ScoringModalSection>
            </View>
        );
    }

    function renderGameScoresTab() {
        return (
            <ScoringModalSection
                title={i18n.t("manuallyEditFinishedGameScores")}
                description={"Adjust a completed game score if the match log needs a correction."}
            >
                {finishedGames.length > 0 ? (
                    <>
                        <View backgroundColor={"gray.100"} borderRadius={10} flexDirection="row" marginBottom={2} padding={2}>
                            <View alignItems={"center"} flex={1}>
                                <Text color={"gray.700"} fontSize={"sm"} fontWeight={"bold"} textAlign={"center"}>{playerNames.a}</Text>
                            </View>
                            <View alignItems={"center"} flex={1}>
                                <Text color={"gray.700"} fontSize={"sm"} fontWeight={"bold"} textAlign={"center"}>{playerNames.b}</Text>
                            </View>
                        </View>
                        {finishedGames.map((gameNumber) => (
                            <EditGameScoreItem key={"game" + gameNumber} gameNumber={gameNumber} {...props} />
                        ))}
                    </>
                ) : (
                    <View alignItems={"center"} backgroundColor={"gray.50"} borderRadius={12} padding={5}>
                        <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} textAlign={"center"}>No completed games yet</Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1} textAlign={"center"}>Finished game scores will appear here once at least one game is logged.</Text>
                    </View>
                )}
            </ScoringModalSection>
        );
    }

    return (
        <Modal avoidKeyboard isOpen={props.isOpen} onClose={() => { props.onClose(); }}>
            <Modal.Content maxW={680} width={"94%"}>
                <Modal.CloseButton />
                <Modal.Header>
                    <ScoringModalHeader
                        title={i18n.t("settings")}
                        description={"Manage match rules, table-side controls, and completed game score corrections."}
                    />
                </Modal.Header>
                <Modal.Body backgroundColor={"gray.50"}>
                    <ScoringSegmentedTabs
                        onChange={setActiveTab}
                        tabs={[
                            { label: "Settings", value: "settings" },
                            { label: "Game Scores", value: "games" },
                        ]}
                        value={activeTab}
                    />
                    {activeTab === "settings" ? renderSettingsTab() : renderGameScoresTab()}
                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
