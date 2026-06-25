import React, { useEffect, useRef, useState } from 'react';
import { AddIcon, Button, FormControl, Input, MinusIcon, NativeBaseProvider, ScrollView, Select, Spinner, Text, View } from 'native-base';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserPath } from '../database';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from "../openscoreboardtheme";
import { subFolderPath } from '../openscoreboard.config';
import { CopyInputRightButton } from './components/CopyButton';
import { DateTimePicker } from './components/DateTimePicker';
import { ScorekeeperSessionsPanel } from './components/ScorekeeperSessionsPanel';
import LoadingPage from './LoadingPage';
import { TeamMatchLinkModal } from './modals/TeamMatchLinkModal';
import { TEAM_MATCH_MODES } from './classes/TeamMatch';
import { addTeamMatchCurrentMatch, archiveTeamMatch, getMyTeamMatch, getTeamMatch, setTeamMatchTeamScore, updateTeamMatch } from './functions/teammatches';
import { getMyTeams } from './functions/teams';
import { supportedSports } from './functions/sports';
import { getTeamMatchScorekeeperTarget } from './functions/scorekeeperSessions';
import i18n from './translations/translate';

function toScore(value) {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function getTeamName(teamSelectionList, teamID, fallback) {
    const team = teamSelectionList.find((teamItem) => teamItem[1]?.id === teamID);
    return team?.[1]?.name || fallback;
}

function Section({ children, title }) {
    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginTop={4}
            padding={4}
        >
            <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>{title}</Text>
            {children}
        </View>
    );
}

function ScoreControl({ label, score, teamName, onDecrease, onIncrease }) {
    return (
        <View
            alignItems={"center"}
            backgroundColor={"gray.50"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            flexDirection={"row"}
            marginTop={3}
            padding={3}
        >
            <View
                alignItems={"center"}
                backgroundColor={openScoreboardColor}
                borderRadius={8}
                justifyContent={"center"}
                marginRight={3}
                minWidth={58}
                paddingX={3}
                paddingY={2}
            >
                <Text color={"white"} fontSize={"2xl"} fontWeight={"bold"}>{score}</Text>
            </View>
            <View flex={1} paddingRight={3}>
                <Text color={"gray.500"} fontSize={"xs"} fontWeight={"bold"} textTransform={"uppercase"}>{label}</Text>
                <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"} numberOfLines={1}>{teamName}</Text>
            </View>
            <View flexDirection={"row"}>
                <Button
                    backgroundColor={"white"}
                    borderColor={"blue.100"}
                    borderRadius={8}
                    borderWidth={1}
                    marginRight={2}
                    onPress={onDecrease}
                    variant={"outline"}
                >
                    <MinusIcon color={openScoreboardColor} />
                </Button>
                <Button backgroundColor={openScoreboardColor} borderRadius={8} onPress={onIncrease}>
                    <AddIcon color={openScoreboardButtonTextColor} />
                </Button>
            </View>
        </View>
    );
}

function PageAction({ icon, label, onPress, isPrimary = false, isDanger = false, isLoading = false }) {
    const borderColor = isDanger ? "red.200" : isPrimary ? openScoreboardColor : "blue.100";
    const iconColor = isDanger ? "#B91C1C" : isPrimary ? openScoreboardButtonTextColor : openScoreboardColor;
    const textColor = isDanger ? "red.700" : isPrimary ? openScoreboardButtonTextColor : "blue.700";

    return (
        <Button
            backgroundColor={isPrimary ? openScoreboardColor : "white"}
            borderColor={borderColor}
            borderRadius={8}
            borderWidth={1}
            isDisabled={isLoading}
            isLoading={isLoading}
            marginRight={2}
            marginTop={2}
            onPress={onPress}
            variant={isPrimary ? "solid" : "outline"}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                {icon(iconColor)}
                <Text color={textColor} fontSize={"sm"} fontWeight={"bold"} marginLeft={2}>{label}</Text>
            </View>
        </Button>
    );
}

function TableRow({ onLinks, onScore, tableNumber }) {
    return (
        <View
            alignItems={"center"}
            backgroundColor={"gray.50"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            flexDirection={"row"}
            justifyContent={"space-between"}
            marginTop={2}
            padding={3}
        >
            <View flex={1} paddingRight={3}>
                <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>Table {tableNumber}</Text>
            </View>
            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"flex-end"}>
                <PageAction
                    isPrimary
                    icon={(color) => <MaterialCommunityIcons name="scoreboard-outline" size={20} color={color} />}
                    label={"Score"}
                    onPress={onScore}
                />
                <PageAction
                    icon={(color) => <MaterialCommunityIcons name="share-outline" size={19} color={color} />}
                    label={"Links"}
                    onPress={onLinks}
                />
            </View>
        </View>
    );
}

export default function TeamMatchEditor(props) {
    const routeParams = props.route?.params || {};
    const teamMatchID = routeParams.teamMatchID;
    const myTeamMatchID = routeParams.myTeamMatchID;

    const [doneLoading, setDoneLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingNewTable, setLoadingNewTable] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [teamSelectionList, setTeamSelectionList] = useState([]);
    const [teamMatch, setTeamMatch] = useState({});
    const [teamAID, setTeamAID] = useState("");
    const [teamBID, setTeamBID] = useState("");
    const [teamAScore, setTeamAScore] = useState(0);
    const [teamBScore, setTeamBScore] = useState(0);
    const latestScoresRef = useRef({ a: 0, b: 0 });
    const [startTime, setStartTime] = useState("");
    const [selectedSport, setSelectedSport] = useState("tableTennis");
    const [selectedScoringType, setSelectedScoringType] = useState("");
    const [selectedTeamMatchMode, setSelectedTeamMatchMode] = useState(TEAM_MATCH_MODES.STRUCTURED);
    const [currentMatches, setCurrentMatches] = useState({});
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedTableID, setSelectedTableID] = useState("");

    useEffect(() => {
        async function loadTeamMatch() {
            setDoneLoading(false);
            const [match, myTeamMatch, teams] = await Promise.all([
                getTeamMatch(teamMatchID),
                getMyTeamMatch(myTeamMatchID),
                getMyTeams(getUserPath()),
            ]);

            const nextTeamMatch = match || {};
            setTeamSelectionList(teams);
            setTeamMatch(nextTeamMatch);
            setTeamAID(nextTeamMatch.teamAID || "");
            setTeamBID(nextTeamMatch.teamBID || "");
            const nextTeamAScore = toScore(nextTeamMatch.teamAScore);
            const nextTeamBScore = toScore(nextTeamMatch.teamBScore);
            latestScoresRef.current = { a: nextTeamAScore, b: nextTeamBScore };
            setTeamAScore(nextTeamAScore);
            setTeamBScore(nextTeamBScore);
            setStartTime(nextTeamMatch.startTime || myTeamMatch?.startTime || new Date().toISOString().slice(0, 10));
            setSelectedSport(nextTeamMatch.sportName || myTeamMatch?.sportName || "tableTennis");
            setSelectedScoringType(nextTeamMatch.scoringType || myTeamMatch?.scoringType || "");
            setSelectedTeamMatchMode(nextTeamMatch.teamMatchMode || myTeamMatch?.teamMatchMode || TEAM_MATCH_MODES.STRUCTURED);
            setCurrentMatches(nextTeamMatch.currentMatches || {});
            setDoneLoading(true);
        }

        loadTeamMatch();
    }, [myTeamMatchID, teamMatchID]);

    useEffect(() => {
        const teamAName = getTeamName(teamSelectionList, teamAID, "Team A");
        const teamBName = getTeamName(teamSelectionList, teamBID, "Team B");
        props.navigation.setOptions({
            title: `${teamAName} vs ${teamBName}`,
        });
    }, [props.navigation, teamAID, teamBID, teamSelectionList]);

    const teamAName = getTeamName(teamSelectionList, teamAID, "Team A");
    const teamBName = getTeamName(teamSelectionList, teamBID, "Team B");
    const ownerID = teamMatch.ownerID || getUserPath() || "";
    const sportDisplayName = supportedSports[selectedSport]?.displayName || selectedSport || "Team match";
    const isScoreOnlyMatch = selectedTeamMatchMode === TEAM_MATCH_MODES.TEAM_SCORE_ONLY;
    const publicViewURL = typeof window === "undefined" ? "" : `${window.location.origin}${subFolderPath}/teammatches/view/${teamMatchID}`;
    const publicEmbedURL = publicViewURL ? `${publicViewURL}?embed=true` : "";
    const sortedTables = Object.entries(currentMatches || {})
        .filter(([tableNumber]) => {
            const parsedTableNumber = parseInt(tableNumber, 10);
            return !Number.isNaN(parsedTableNumber) && parsedTableNumber > 0;
        })
        .sort((a, b) => {
            return parseInt(a[0], 10) > parseInt(b[0], 10) ? 1 : -1;
        });

    const setVisibleTeamScores = (nextAScore, nextBScore) => {
        const safeAScore = Math.max(0, toScore(nextAScore));
        const safeBScore = Math.max(0, toScore(nextBScore));
        latestScoresRef.current = { a: safeAScore, b: safeBScore };
        setTeamAScore(safeAScore);
        setTeamBScore(safeBScore);
    };

    const saveTeamMatch = async () => {
        setSaving(true);

        try {
            const latestScores = latestScoresRef.current;
            const nextTeamMatch = {
                ...teamMatch,
                teamAID,
                teamBID,
                startTime,
                teamAScore: latestScores.a,
                teamBScore: latestScores.b,
                currentMatches: isScoreOnlyMatch ? {} : currentMatches || {},
                sportName: selectedSport,
                scoringType: selectedScoringType || "",
                teamMatchMode: selectedTeamMatchMode,
                ownerID,
            };

            await updateTeamMatch(teamMatchID, myTeamMatchID, nextTeamMatch);
            setTeamMatch(nextTeamMatch);
        }
        finally {
            setSaving(false);
        }
    };

    const updateTeamScore = async (side, nextScore) => {
        const safeScore = Math.max(0, toScore(nextScore));
        const currentScores = latestScoresRef.current;
        const nextAScore = side === "A" ? safeScore : currentScores.a;
        const nextBScore = side === "B" ? safeScore : currentScores.b;

        setVisibleTeamScores(nextAScore, nextBScore);

        if (!isScoreOnlyMatch) {
            return;
        }

        setSaving(true);
        try {
            await setTeamMatchTeamScore(teamMatchID, nextAScore, nextBScore);
            setTeamMatch((currentTeamMatch) => ({
                ...currentTeamMatch,
                teamAScore: nextAScore,
                teamBScore: nextBScore,
            }));
        }
        finally {
            setSaving(false);
        }
    };

    const addTable = async () => {
        setLoadingNewTable(true);

        try {
            const tableNumbers = Object.keys(currentMatches || {})
                .filter((key) => {
                    const parsedTableNumber = parseInt(key, 10);
                    return !Number.isNaN(parsedTableNumber) && parsedTableNumber > 0;
                })
                .map((key) => parseInt(key, 10));
            const nextTableNumber = (tableNumbers.length > 0 ? Math.max(...tableNumbers) + 1 : 1).toString();

            await addTeamMatchCurrentMatch(teamMatchID, nextTableNumber);
            setCurrentMatches({ ...(currentMatches || {}), [nextTableNumber]: "" });
        }
        finally {
            setLoadingNewTable(false);
        }
    };

    const deleteTeamMatch = async () => {
        setDeleting(true);

        try {
            await archiveTeamMatch(myTeamMatchID);
            props.navigation.goBack();
        }
        finally {
            setDeleting(false);
        }
    };

    if (!doneLoading) {
        return <LoadingPage />;
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"white"}>
                <View alignSelf={"center"} maxWidth={960} padding={4} width={"100%"}>
                    <Section title={i18n.t("editTeamMatch")}>
                        <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"} marginTop={2}>
                            <View flex={1} minWidth={240} paddingRight={3}>
                                <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"} numberOfLines={1}>
                                    {teamAName} vs {teamBName}
                                </Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                    {isScoreOnlyMatch ? "Team score only" : sportDisplayName} - {startTime ? new Date(startTime).toLocaleDateString() : "No date"}
                                </Text>
                            </View>
                            <Button backgroundColor={openScoreboardColor} isDisabled={saving} marginTop={2} onPress={saveTeamMatch}>
                                {saving ? (
                                    <Spinner color={openScoreboardButtonTextColor} />
                                ) : (
                                    <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("save")}</Text>
                                )}
                            </Button>
                        </View>

                        <ScoreControl
                            label={i18n.t("teamA")}
                            score={teamAScore}
                            teamName={teamAName}
                            onDecrease={() => updateTeamScore("A", latestScoresRef.current.a - 1)}
                            onIncrease={() => updateTeamScore("A", latestScoresRef.current.a + 1)}
                        />
                        <ScoreControl
                            label={i18n.t("teamB")}
                            score={teamBScore}
                            teamName={teamBName}
                            onDecrease={() => updateTeamScore("B", latestScoresRef.current.b - 1)}
                            onIncrease={() => updateTeamScore("B", latestScoresRef.current.b + 1)}
                        />
                        {isScoreOnlyMatch ? (
                            <Text color={"gray.600"} fontSize={"xs"} marginTop={2}>
                                Score changes save immediately so linked scoreboards can update without player matches.
                            </Text>
                        ) : null}
                    </Section>

                    <Section title={"Public view"}>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                            Share the normal page as a link, or use the embed URL inside another website without the app navigation bar.
                        </Text>
                        <FormControl marginTop={3}>
                            <FormControl.Label>Public page URL</FormControl.Label>
                            <Input
                                backgroundColor={"white"}
                                borderColor={"gray.300"}
                                color={"gray.900"}
                                isReadOnly
                                InputRightElement={<CopyInputRightButton text={publicViewURL} />}
                                value={publicViewURL}
                            />
                        </FormControl>
                        <FormControl marginTop={3}>
                            <FormControl.Label>Embeddable URL</FormControl.Label>
                            <Input
                                backgroundColor={"white"}
                                borderColor={"gray.300"}
                                color={"gray.900"}
                                isReadOnly
                                InputRightElement={<CopyInputRightButton text={publicEmbedURL} />}
                                value={publicEmbedURL}
                            />
                        </FormControl>
                        <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                            <PageAction
                                icon={(color) => <FontAwesome name="external-link" size={16} color={color} />}
                                label={"Preview page"}
                                onPress={() => {
                                    props.navigation.navigate("TeamMatchPublicView", { teamMatchID });
                                }}
                            />
                            <PageAction
                                icon={(color) => <FontAwesome name="code" size={16} color={color} />}
                                label={"Preview embed"}
                                onPress={() => {
                                    props.navigation.navigate("TeamMatchPublicView", { teamMatchID, embed: true });
                                }}
                            />
                            {isScoreOnlyMatch ? (
                                <PageAction
                                    icon={(color) => <MaterialCommunityIcons name="share-outline" size={19} color={color} />}
                                    label={"Scoreboard links"}
                                    onPress={() => {
                                        setSelectedTableID("");
                                        setShowLinkModal(true);
                                    }}
                                />
                            ) : null}
                        </View>
                    </Section>

                    {!isScoreOnlyMatch ? <Section title={"Scheduling"}>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                            Generate team-match schedules from roster formats, then push selected matches to this team match.
                        </Text>
                        <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                            <PageAction
                                isPrimary
                                icon={(color) => <MaterialCommunityIcons name="calendar-multiselect" size={20} color={color} />}
                                label={"Scheduling Manager"}
                                onPress={() => {
                                    props.navigation.navigate("SchedulingManager", {
                                        sourceType: "teamMatch",
                                        sourceID: teamMatchID,
                                        teamMatchID,
                                        myTeamMatchID,
                                        teamAID,
                                        teamBID,
                                        sportName: selectedSport,
                                        scoringType: selectedScoringType,
                                    });
                                }}
                            />
                        </View>
                    </Section> : null}

                    <Section title={"Match settings"}>
                        <FormControl marginTop={3}>
                            <FormControl.Label>Team match type</FormControl.Label>
                            <Select
                                selectedValue={selectedTeamMatchMode}
                                onValueChange={(mode) => {
                                    setSelectedTeamMatchMode(mode);
                                    if (mode === TEAM_MATCH_MODES.TEAM_SCORE_ONLY) {
                                        setCurrentMatches({});
                                    }
                                }}
                            >
                                <Select.Item label={"Structured team match"} value={TEAM_MATCH_MODES.STRUCTURED} />
                                <Select.Item label={"Team score only"} value={TEAM_MATCH_MODES.TEAM_SCORE_ONLY} />
                            </Select>
                            <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                                {selectedTeamMatchMode === TEAM_MATCH_MODES.TEAM_SCORE_ONLY ?
                                    "Manually control the team score without creating player matches or table scoring links." :
                                    "Create player matches, assign tables, and let completed player matches update the team score."}
                            </Text>
                        </FormControl>
                        <FormControl marginTop={3}>
                            <FormControl.Label>{i18n.t("teamA")}</FormControl.Label>
                            <Select selectedValue={teamAID} onValueChange={setTeamAID}>
                                {teamSelectionList.map((team) => (
                                    <Select.Item key={`${team[0]}A`} label={team[1].name} value={team[1].id} />
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl marginTop={3}>
                            <FormControl.Label>{i18n.t("teamB")}</FormControl.Label>
                            <Select selectedValue={teamBID} onValueChange={setTeamBID}>
                                {teamSelectionList.map((team) => (
                                    <Select.Item key={`${team[0]}B`} label={team[1].name} value={team[1].id} />
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl marginTop={3}>
                            <FormControl.Label>{i18n.t("matchTime")}</FormControl.Label>
                            <DateTimePicker type="date" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                        </FormControl>
                        <FormControl marginTop={3}>
                            <FormControl.Label>{i18n.t("sport")}</FormControl.Label>
                            <Select
                                selectedValue={selectedSport}
                                onValueChange={(sport) => {
                                    setSelectedSport(sport);
                                    if (supportedSports[sport]?.hasScoringTypes) {
                                        setSelectedScoringType(Object.keys(supportedSports[sport]?.scoringTypes || {})[0] || "");
                                    }
                                    else {
                                        setSelectedScoringType("");
                                    }
                                }}
                            >
                                {Object.entries(supportedSports).map(([id, { displayName }]) => (
                                    <Select.Item key={id} label={displayName} value={id} />
                                ))}
                            </Select>
                        </FormControl>
                        {supportedSports[selectedSport]?.hasScoringTypes ? (
                            <FormControl marginTop={3}>
                                <FormControl.Label>{i18n.t("scoringType")}</FormControl.Label>
                                <Select selectedValue={selectedScoringType} onValueChange={setSelectedScoringType}>
                                    {Object.entries(supportedSports[selectedSport]?.scoringTypes || {}).map(([id, { displayName }]) => (
                                        <Select.Item key={id} label={displayName} value={id} />
                                    ))}
                                </Select>
                            </FormControl>
                        ) : null}
                    </Section>

                    {!isScoreOnlyMatch ? <Section title={"Tables"}>
                        {sortedTables.length > 0 ? sortedTables.map(([tableNumber]) => (
                            <TableRow
                                key={tableNumber}
                                tableNumber={tableNumber}
                                onScore={() => {
                                    props.navigation.navigate("TeamMatchScoring", {
                                        isTeamMatch: true,
                                        teamMatchID,
                                        tableNumber,
                                        name: "Table " + tableNumber,
                                        sportName: selectedSport,
                                        scoringType: selectedScoringType,
                                        ownerID,
                                    });
                                }}
                                onLinks={() => {
                                    setSelectedTableID(tableNumber);
                                    setShowLinkModal(true);
                                }}
                            />
                        )) : (
                            <View
                                alignItems={"center"}
                                backgroundColor={"gray.50"}
                                borderColor={"gray.200"}
                                borderRadius={8}
                                borderStyle={"dashed"}
                                borderWidth={1}
                                marginTop={3}
                                padding={5}
                            >
                                <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>No tables have been added.</Text>
                            </View>
                        )}
                        <View flexDirection={"row"} marginTop={3}>
                            <PageAction
                                isPrimary
                                isLoading={loadingNewTable}
                                icon={(color) => <MaterialCommunityIcons name="plus-box-outline" size={20} color={color} />}
                                label={"Add table"}
                                onPress={addTable}
                            />
                        </View>
                    </Section> : null}

                    {!isScoreOnlyMatch ? <Section title={"Scorekeeper sessions"}>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                            Monitor the scorekeeping pages currently open for each team-match table.
                        </Text>
                        {sortedTables.length > 0 ? sortedTables.map(([tableNumber]) => (
                            <View key={`scorekeeper-session-${tableNumber}`} marginTop={4}>
                                <ScorekeeperSessionsPanel
                                    target={getTeamMatchScorekeeperTarget(teamMatchID, tableNumber, `Table ${tableNumber}`, ownerID)}
                                    title={`Table ${tableNumber}`}
                                />
                            </View>
                        )) : (
                            <View
                                alignItems={"center"}
                                backgroundColor={"gray.50"}
                                borderColor={"gray.200"}
                                borderRadius={8}
                                borderStyle={"dashed"}
                                borderWidth={1}
                                marginTop={3}
                                padding={5}
                            >
                                <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>Add a table to monitor scorekeepers.</Text>
                            </View>
                        )}
                    </Section> : null}

                    {!isScoreOnlyMatch ? <Section title={"History"}>
                        <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                            <PageAction
                                icon={(color) => <FontAwesome name="history" size={18} color={color} />}
                                label={"Archived matches"}
                                onPress={() => {
                                    props.navigation.navigate("ArchivedMatchList", {
                                        teamMatchID,
                                        name: `${teamAName} vs ${teamBName}`,
                                    });
                                }}
                            />
                        </View>
                    </Section> : null}

                    <Section title={"Delete"}>
                        {showDeleteConfirm ? (
                            <View
                                backgroundColor={"red.50"}
                                borderColor={"red.200"}
                                borderRadius={8}
                                borderWidth={1}
                                marginTop={3}
                                padding={3}
                            >
                                <Text color={"red.800"} fontSize={"sm"} fontWeight={"bold"}>
                                    {i18n.t("areYouSureDelete")} {teamAName} vs {teamBName}?
                                </Text>
                                <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                                    <PageAction
                                        isDanger
                                        isLoading={deleting}
                                        icon={(color) => <FontAwesome name="trash" size={16} color={color} />}
                                        label={i18n.t("deleteTeamMatch")}
                                        onPress={deleteTeamMatch}
                                    />
                                    <PageAction
                                        icon={(color) => <FontAwesome name="times" size={16} color={color} />}
                                        label={i18n.t("close")}
                                        onPress={() => setShowDeleteConfirm(false)}
                                    />
                                </View>
                            </View>
                        ) : (
                            <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                                <PageAction
                                    isDanger
                                    icon={(color) => <FontAwesome name="trash" size={16} color={color} />}
                                    label={i18n.t("deleteTeamMatch")}
                                    onPress={() => setShowDeleteConfirm(true)}
                                />
                            </View>
                        )}
                    </Section>

                    <View flexDirection={"row"} marginTop={4} paddingBottom={8}>
                        <Button backgroundColor={openScoreboardColor} isDisabled={saving} onPress={saveTeamMatch}>
                            {saving ? (
                                <Spinner color={openScoreboardButtonTextColor} />
                            ) : (
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("save")}</Text>
                            )}
                        </Button>
                    </View>
                </View>
            </ScrollView>

            {showLinkModal ? (
                <TeamMatchLinkModal
                    id={teamMatchID}
                    isOpen={showLinkModal}
                    isTeamMatch
                    onClose={() => setShowLinkModal(false)}
                    scoringType={selectedScoringType}
                    sportName={selectedSport}
                    tableID={selectedTableID}
                    ownerID={ownerID}
                    isScoreOnly={isScoreOnlyMatch}
                    teamAName={teamAName}
                    teamBName={teamBName}
                    teamMatchID={teamMatchID}
                />
            ) : null}
        </NativeBaseProvider>
    );
}
