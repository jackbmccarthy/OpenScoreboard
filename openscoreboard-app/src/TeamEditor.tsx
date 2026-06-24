import React, { useEffect, useRef, useState } from 'react';
import { AddIcon, Button, Checkbox, FormControl, Input, NativeBaseProvider, ScrollView, Spinner, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from "../openscoreboardtheme";
import { subFolderPath } from '../openscoreboard.config';
import { newImportedPlayer } from './classes/Player';
import { ensureTeamManagerPassword, getTeam, resetTeamManagerPassword, updateMyTeam, updateTeam, validateTeamManagerPassword } from './functions/teams';
import { TeamPlayerItem } from './listitems/TeamPlayerItem';
import CountrySelect from './components/CountrySelect';
import { CopyInputRightButton } from './components/CopyButton';
import TeamLogoPreview from './components/TeamLogoPreview';
import TeamColorField, { isValidTeamColor } from './components/TeamColorField';
import LoadingPage from './LoadingPage';
import Unauthorized from './Unauthorized';
import i18n from './translations/translate';
import { getTeamCompetitionContests, subscribeToTeamCompetitions } from './functions/teamCompetitions';

function addArchivedMetadata(players) {
    const timestamp = new Date().toISOString();
    return Object.entries(players || {}).reduce((archivedPlayers, [playerID, player]) => {
        archivedPlayers[playerID] = {
            ...player,
            archivedOn: timestamp,
        };
        return archivedPlayers;
    }, {});
}

function normalizeTeamPlayer(player = {}) {
    return {
        firstName: player.firstName || "",
        lastName: player.lastName || "",
        imageURL: player.imageURL || "",
        country: player.country || "",
        gender: normalizeGender(player.gender),
        rating: normalizeNumberField(player.rating),
        ranking: normalizeNumberField(player.ranking),
        clubName: player.clubName || "",
        jerseyColor: player.jerseyColor || "",
        firstNameInitial: player.firstNameInitial === true,
        lastNameInitial: player.lastNameInitial === true,
        isImported: player.isImported === true,
    };
}

function normalizeGender(value = "") {
    return `${value || ""}`.trim().slice(0, 1).toUpperCase();
}

function normalizeNumberField(value) {
    const parsedValue = parseInt(`${value || ""}`, 10);
    return Number.isNaN(parsedValue) ? "" : parsedValue;
}

function TeamBulkEditRow({ playerID, player, selected, onChange, onToggleSelected }) {
    return (
        <View
            alignItems={"center"}
            borderBottomColor={"gray.200"}
            borderBottomWidth={1}
            flexDirection={"row"}
            paddingY={2}
        >
            <View alignItems={"center"} minWidth={54} paddingRight={2}>
                <Checkbox
                    aria-label={`Select player ${player.firstName || ""} ${player.lastName || ""}`}
                    isChecked={selected}
                    onChange={() => onToggleSelected(playerID)}
                    value={playerID}
                />
            </View>
            <View flex={1} minWidth={130} paddingRight={2}>
                <Input value={player.firstName || ""} onChangeText={(value) => onChange(playerID, "firstName", value)} />
            </View>
            <View flex={1} minWidth={130} paddingRight={2}>
                <Input value={player.lastName || ""} onChangeText={(value) => onChange(playerID, "lastName", value)} />
            </View>
            <View flex={1.4} minWidth={180} paddingRight={2}>
                <Input value={player.imageURL || ""} onChangeText={(value) => onChange(playerID, "imageURL", value)} />
            </View>
            <View flex={1} minWidth={180}>
                <CountrySelect value={player.country || ""} onChange={(value) => onChange(playerID, "country", value)} />
            </View>
            <View flex={0.6} minWidth={90} paddingLeft={2}>
                <Input maxLength={1} value={player.gender || ""} onChangeText={(value) => onChange(playerID, "gender", normalizeGender(value))} />
            </View>
            <View flex={0.8} minWidth={110} paddingLeft={2}>
                <Input keyboardType={"numeric"} value={`${player.rating || ""}`} onChangeText={(value) => onChange(playerID, "rating", normalizeNumberField(value))} />
            </View>
            <View flex={0.8} minWidth={110} paddingLeft={2}>
                <Input keyboardType={"numeric"} value={`${player.ranking || ""}`} onChangeText={(value) => onChange(playerID, "ranking", normalizeNumberField(value))} />
            </View>
        </View>
    );
}

function getTeamManagerURL(teamID, password) {
    if (typeof window === "undefined" || !teamID || !password) {
        return "";
    }

    return `${window.location.origin}${subFolderPath}/teammanager/${teamID}/${password}`;
}

function getTeamCompetitionSummary(competition, teamID) {
    const contests = getTeamCompetitionContests(competition).filter((contest) => {
        return contest.teamAID === teamID || contest.teamBID === teamID;
    });
    const completed = contests.filter((contest) => contest.match.isComplete === true).length;
    const awaitingLineup = contests.filter((contest) => {
        return !!contest.match.teamMatchID &&
            contest.match.isComplete !== true &&
            (contest.match.teamTieStatus === "waiting-lineups" || contest.match.teamTieStatus === "ready");
    }).length;
    const awaitingCreation = contests.filter((contest) => !contest.match.teamMatchID).length;

    return {
        awaitingCreation,
        awaitingLineup,
        completed,
        contests,
    };
}

function TeamCompetitionAccess({ competitions, navigation, password, teamID }) {
    if (competitions.length === 0) {
        return null;
    }

    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginTop={4}
            padding={4}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                <View alignItems={"center"} backgroundColor={"blue.50"} borderRadius={8} height={"38px"} justifyContent={"center"} width={"38px"}>
                    <MaterialCommunityIcons name="tournament" size={21} color={openScoreboardColor} />
                </View>
                <View flex={1} marginLeft={3}>
                    <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"}>Team competitions</Text>
                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                        Open your competition page to submit lineups and review assigned team contests.
                    </Text>
                </View>
            </View>

            {competitions.map((competition) => {
                const summary = getTeamCompetitionSummary(competition, teamID);
                const title = competition?.data?.title || competition.title || "Competition";
                const archived = competition.archived === true || !!competition.archivedOn;
                const needsAttention = summary.awaitingLineup > 0;

                return (
                    <View
                        key={competition.id}
                        alignItems={{ base: "stretch", md: "center" }}
                        backgroundColor={needsAttention ? "yellow.50" : "gray.50"}
                        borderColor={needsAttention ? "yellow.200" : "gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        flexDirection={{ base: "column", md: "row" }}
                        marginTop={3}
                        padding={3}
                    >
                        <View flex={1} paddingRight={{ base: 0, md: 3 }}>
                            <View alignItems={"center"} flexDirection={"row"} flexWrap={"wrap"}>
                                <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>{title}</Text>
                                {archived ? (
                                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} marginLeft={2}>ARCHIVED</Text>
                                ) : null}
                            </View>
                            <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                                {summary.contests.length} contest{summary.contests.length === 1 ? "" : "s"} - {summary.completed} complete
                                {summary.awaitingLineup > 0 ? ` - ${summary.awaitingLineup} awaiting your lineup` : ""}
                                {summary.awaitingCreation > 0 ? ` - ${summary.awaitingCreation} awaiting organizer` : ""}
                            </Text>
                        </View>
                        <Button
                            alignSelf={{ base: "stretch", md: "center" }}
                            backgroundColor={openScoreboardColor}
                            marginTop={{ base: 3, md: 0 }}
                            onPress={() => navigation.navigate("TeamCompetitionPortal", {
                                competitionID: competition.id,
                                password,
                                teamID,
                            })}
                            size={"sm"}
                        >
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Open competition portal</Text>
                        </Button>
                    </View>
                );
            })}
        </View>
    );
}

function TeamSaveStatus({ message, statusType }) {
    if (!message) {
        return null;
    }

    const isError = statusType === "error";

    return (
        <View
            pointerEvents={"none"}
            style={{
                alignItems: "center",
                left: 0,
                position: (Platform.OS === "web" ? "fixed" : "absolute") as any,
                right: 0,
                top: 88,
                zIndex: 9999,
            }}
        >
            <View
                alignItems={"center"}
                backgroundColor={isError ? "red.700" : "green.700"}
                borderColor={isError ? "red.200" : "green.200"}
                borderRadius={8}
                borderWidth={1}
                flexDirection={"row"}
                maxWidth={560}
                paddingX={4}
                paddingY={3}
                shadow={5}
                width={{ base: "92%", md: "auto" }}
            >
                <MaterialCommunityIcons
                    name={isError ? "alert-circle" : "check-circle"}
                    size={22}
                    color={openScoreboardButtonTextColor}
                />
                <Text color={openScoreboardButtonTextColor} fontSize={"sm"} fontWeight={"bold"} marginLeft={2}>
                    {message}
                </Text>
            </View>
        </View>
    );
}

export default function TeamEditor(props) {
    const routeParams = props.route?.params || {};
    const teamID = routeParams.teamID;
    const myTeamID = routeParams.myTeamID;
    const isTeamManagerPage = props.route?.name === "TeamManager";
    const routePassword = routeParams.password || routeParams.teamManagerPassword;
    const editingTeam = useRef({});

    const [doneLoading, setDoneLoading] = useState(false);
    const [unauthorized, setUnauthorized] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resettingTeamManagerAccess, setResettingTeamManagerAccess] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [teamLogoURL, setTeamLogoURL] = useState("");
    const [teamJerseyColor, setTeamJerseyColor] = useState("");
    const [teamManagerPassword, setTeamManagerPassword] = useState("");
    const [players, setPlayers] = useState({});
    const [archivedPlayers, setArchivedPlayers] = useState({});
    const [showAddPlayer, setShowAddPlayer] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [imageURL, setImageURL] = useState("");
    const [country, setCountry] = useState("");
    const [gender, setGender] = useState("");
    const [rating, setRating] = useState("");
    const [ranking, setRanking] = useState("");
    const [bulkEditMode, setBulkEditMode] = useState(false);
    const [bulkPlayers, setBulkPlayers] = useState({});
    const [bulkArchivedPlayers, setBulkArchivedPlayers] = useState({});
    const [bulkSelectedPlayerIDs, setBulkSelectedPlayerIDs] = useState([]);
    const [savingRoster, setSavingRoster] = useState(false);
    const [saveStatusMessage, setSaveStatusMessage] = useState("");
    const [saveStatusType, setSaveStatusType] = useState("success");
    const [teamCompetitions, setTeamCompetitions] = useState<any[]>([]);

    useEffect(() => {
        async function loadTeam() {
            setDoneLoading(false);
            setUnauthorized(false);
            let team = await getTeam(teamID);

            if (!team) {
                setUnauthorized(true);
                setDoneLoading(true);
                return;
            }

            if (isTeamManagerPage) {
                if (!await validateTeamManagerPassword(teamID, routePassword)) {
                    setUnauthorized(true);
                    setDoneLoading(true);
                    return;
                }
                team = {
                    ...team,
                    teamManagerPassword: routePassword,
                };
            }
            else {
                const password = await ensureTeamManagerPassword(teamID, team);
                team = {
                    ...team,
                    teamManagerPassword: password,
                };
            }

            editingTeam.current = team || {};
            setTeamName(team?.teamName || "");
            setTeamLogoURL(team?.teamLogoURL || "");
            setTeamJerseyColor(team?.teamJerseyColor || "");
            setTeamManagerPassword(team?.teamManagerPassword || "");
            setPlayers(team?.players || {});
            setArchivedPlayers(team?.archivedPlayers || {});
            setDoneLoading(true);
        }

        loadTeam();
    }, [isTeamManagerPage, routePassword, teamID]);

    useEffect(() => {
        props.navigation.setOptions({
            title: teamName || "Edit Team",
        });
    }, [teamName]);

    useEffect(() => {
        return subscribeToTeamCompetitions(teamID, setTeamCompetitions);
    }, [teamID]);

    useEffect(() => {
        if (!saveStatusMessage) {
            return;
        }

        const timeout = setTimeout(() => {
            setSaveStatusMessage("");
        }, saveStatusType === "error" ? 6500 : 4500);

        return () => clearTimeout(timeout);
    }, [saveStatusMessage, saveStatusType]);

    const addPlayer = () => {
        setPlayers({ ...players, [uuidv4()]: newImportedPlayer(firstName, lastName, imageURL, country, "", gender, normalizeNumberField(rating), normalizeNumberField(ranking)) });
        setShowAddPlayer(false);
        setFirstName("");
        setLastName("");
        setImageURL("");
        setCountry("");
        setGender("");
        setRating("");
        setRanking("");
    };

    const saveTeam = async () => {
        if (!isValidTeamColor(teamJerseyColor)) {
            return;
        }

        setSaving(true);
        setSaveStatusMessage("");

        try {
            const nextTeam = {
                ...editingTeam.current,
                teamName,
                teamLogoURL,
                teamJerseyColor,
                players: JSON.parse(JSON.stringify(players)),
                archivedPlayers: JSON.parse(JSON.stringify(archivedPlayers)),
            };

            await updateTeam(teamID, nextTeam);
            if (myTeamID) {
                await updateMyTeam(myTeamID, teamName, teamLogoURL, teamJerseyColor);
            }
            editingTeam.current = nextTeam;
            setSaveStatusType("success");
            setSaveStatusMessage("Team details saved.");
        }
        catch (error) {
            console.error("[TeamEditor] failed to save team details", error);
            setSaveStatusType("error");
            setSaveStatusMessage("Team details could not be saved. Please try again.");
        }
        finally {
            setSaving(false);
        }
    };

    const resetTeamManagerAccess = async () => {
        setResettingTeamManagerAccess(true);

        try {
            const newPassword = await resetTeamManagerPassword(teamID);
            setTeamManagerPassword(newPassword);
            editingTeam.current = {
                ...editingTeam.current,
                teamManagerPassword: newPassword,
            };
        }
        finally {
            setResettingTeamManagerAccess(false);
        }
    };

    const archiveTeamPlayer = (playerID) => {
        const player = players[playerID];

        if (!player) {
            return;
        }

        const nextPlayers = { ...players };
        delete nextPlayers[playerID];

        setPlayers(nextPlayers);
        setArchivedPlayers({
            ...archivedPlayers,
            ...addArchivedMetadata({ [playerID]: player }),
        });
    };

    const openBulkEdit = () => {
        setBulkPlayers({ ...players });
        setBulkArchivedPlayers({});
        setBulkSelectedPlayerIDs([]);
        setBulkEditMode(true);
    };

    const updateBulkPlayer = (playerID, field, value) => {
        setBulkPlayers({
            ...bulkPlayers,
            [playerID]: {
                ...bulkPlayers[playerID],
                [field]: value,
            },
        });
    };

    const toggleBulkSelectedPlayer = (playerID) => {
        if (bulkSelectedPlayerIDs.includes(playerID)) {
            setBulkSelectedPlayerIDs(bulkSelectedPlayerIDs.filter((selectedID) => selectedID !== playerID));
        }
        else {
            setBulkSelectedPlayerIDs([...bulkSelectedPlayerIDs, playerID]);
        }
    };

    const archiveSelectedBulkPlayers = () => {
        const playersToArchive = {};
        const activePlayers = { ...bulkPlayers };

        bulkSelectedPlayerIDs.forEach((playerID) => {
            if (activePlayers[playerID]) {
                playersToArchive[playerID] = activePlayers[playerID];
                delete activePlayers[playerID];
            }
        });

        setBulkPlayers(activePlayers);
        setBulkArchivedPlayers({
            ...bulkArchivedPlayers,
            ...playersToArchive,
        });
        setBulkSelectedPlayerIDs([]);
    };

    const saveBulkRoster = async () => {
        if (!isValidTeamColor(teamJerseyColor)) {
            return;
        }

        setSavingRoster(true);
        setSaveStatusMessage("");

        try {
            const nextArchivedPlayers = {
                ...archivedPlayers,
                ...addArchivedMetadata(bulkArchivedPlayers),
            };
            const nextTeam = {
                ...editingTeam.current,
                teamName,
                teamLogoURL,
                teamJerseyColor,
                players: JSON.parse(JSON.stringify(bulkPlayers)),
                archivedPlayers: JSON.parse(JSON.stringify(nextArchivedPlayers)),
            };

            await updateTeam(teamID, nextTeam);
            if (myTeamID) {
                await updateMyTeam(myTeamID, teamName, teamLogoURL, teamJerseyColor);
            }
            editingTeam.current = nextTeam;
            setPlayers(bulkPlayers);
            setArchivedPlayers(nextArchivedPlayers);
            setBulkArchivedPlayers({});
            setBulkSelectedPlayerIDs([]);
            setBulkEditMode(false);
            setSaveStatusType("success");
            setSaveStatusMessage("Team roster saved.");
        }
        catch (error) {
            console.error("[TeamEditor] failed to save team roster", error);
            setSaveStatusType("error");
            setSaveStatusMessage("Team roster could not be saved. Please try again.");
        }
        finally {
            setSavingRoster(false);
        }
    };

    if (!doneLoading) {
        return <LoadingPage />;
    }

    if (unauthorized) {
        return <Unauthorized />;
    }

    const teamManagerURL = getTeamManagerURL(teamID, teamManagerPassword);
    const teamColorIsValid = isValidTeamColor(teamJerseyColor);

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <TeamSaveStatus message={saveStatusMessage} statusType={saveStatusType} />
            <ScrollView backgroundColor={"white"}>
                <View alignSelf={"center"} maxWidth={960} padding={4} width={"100%"}>
                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        padding={4}
                    >
                        <View alignItems={"flex-start"} flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                            <View flex={1} minWidth={220} paddingRight={3}>
                                <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>Team Details</Text>
                                <Text color={openScoreboardColor} fontSize={"lg"} fontWeight={"bold"} marginTop={1}>
                                    {teamName || "Unnamed team"}
                                </Text>
                                <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                    Manage team name, logo, and roster.
                                </Text>
                            </View>
                            <Button backgroundColor={openScoreboardColor} isDisabled={saving || !teamColorIsValid} marginTop={1} onPress={saveTeam}>
                                {saving ? (
                                    <Spinner color={openScoreboardButtonTextColor} />
                                ) : (
                                    <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("save")}</Text>
                                )}
                            </Button>
                        </View>

                        <FormControl marginTop={4}>
                            <FormControl.Label>{i18n.t("teamName")}</FormControl.Label>
                            <Input value={teamName} onChangeText={setTeamName} />
                        </FormControl>

                        <FormControl marginTop={3}>
                            <FormControl.Label>{i18n.t("teamLogoURL")}</FormControl.Label>
                            <Input value={teamLogoURL} onChangeText={setTeamLogoURL} />
                            {teamLogoURL.trim().length > 0 ? (
                                <View
                                    backgroundColor={"gray.50"}
                                    borderColor={"gray.200"}
                                    borderRadius={8}
                                    borderWidth={1}
                                    marginTop={3}
                                    padding={3}
                                >
                                    <TeamLogoPreview logoURL={teamLogoURL} teamName={teamName} size={84} label={"Logo preview"} />
                                </View>
                            ) : null}
                        </FormControl>

                        <View marginTop={3}>
                            <TeamColorField
                                label={i18n.t("teamJerseyColor")}
                                onChange={setTeamJerseyColor}
                                value={teamJerseyColor}
                            />
                        </View>

                        {!isTeamManagerPage ? (
                            <View marginTop={4}>
                                <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>Team manager access</Text>
                                <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                    Share this URL with a team manager so they can update this roster without account access.
                                </Text>
                                <FormControl marginTop={3}>
                                    <FormControl.Label>Team manager link</FormControl.Label>
                                    <Input
                                        backgroundColor={"white"}
                                        borderColor={"gray.300"}
                                        color={"gray.900"}
                                        isReadOnly
                                        InputRightElement={<CopyInputRightButton text={teamManagerURL} />}
                                        value={teamManagerURL}
                                    />
                                </FormControl>
                                <View
                                    alignItems={"center"}
                                    flexDirection={"row"}
                                    flexWrap={"wrap"}
                                    justifyContent={"space-between"}
                                    marginTop={3}
                                >
                                    <Text color={"gray.600"} flex={1} fontSize={"sm"} minWidth={260} paddingRight={3}>
                                        Reset this link if the current URL should no longer allow team roster management.
                                    </Text>
                                    <Button
                                        backgroundColor={"white"}
                                        borderColor={"red.200"}
                                        borderRadius={8}
                                        borderWidth={1}
                                        isDisabled={resettingTeamManagerAccess}
                                        onPress={resetTeamManagerAccess}
                                        variant={"outline"}
                                    >
                                        {resettingTeamManagerAccess ? (
                                            <Spinner color={"red.700"} />
                                        ) : (
                                            <Text color={"red.700"} fontWeight={"bold"}>Reset team manager link</Text>
                                        )}
                                    </Button>
                                </View>
                            </View>
                        ) : null}
                    </View>

                    <TeamCompetitionAccess
                        competitions={teamCompetitions}
                        navigation={props.navigation}
                        password={teamManagerPassword}
                        teamID={teamID}
                    />

                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        marginTop={4}
                        padding={4}
                    >
                        <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"}>
                            <View flex={1} paddingRight={3}>
                                <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>{i18n.t("players")}</Text>
                                <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                    {Object.keys(players || {}).length} team players
                                </Text>
                            </View>
                            <View flexDirection={"row"} flexWrap={"wrap"}>
                                <Button marginRight={2} onPress={openBulkEdit} variant={"outline"}>
                                    <Text color={openScoreboardColor} fontWeight={"bold"}>Bulk edit</Text>
                                </Button>
                                <Button
                                    backgroundColor={openScoreboardColor}
                                    borderRadius={8}
                                    onPress={() => {
                                        setShowAddPlayer(true);
                                    }}
                                >
                                    <View alignItems={"center"} flexDirection={"row"}>
                                        <AddIcon color={openScoreboardButtonTextColor} />
                                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"} marginLeft={2}>
                                            {i18n.t("add")}
                                        </Text>
                                    </View>
                                </Button>
                            </View>
                        </View>

                        {showAddPlayer ? (
                            <View
                                backgroundColor={"gray.50"}
                                borderColor={"gray.200"}
                                borderRadius={8}
                                borderWidth={1}
                                marginTop={4}
                                padding={3}
                            >
                                <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>{i18n.t("addTeamPlayer")}</Text>
                                <FormControl marginTop={3}>
                                    <FormControl.Label>{i18n.t("firstName")}<Text color={"red"}>*</Text></FormControl.Label>
                                    <Input value={firstName} onChangeText={setFirstName} />
                                </FormControl>
                                <FormControl marginTop={3}>
                                    <FormControl.Label>{i18n.t("lastName")}</FormControl.Label>
                                    <Input value={lastName} onChangeText={setLastName} />
                                </FormControl>
                                <FormControl marginTop={3}>
                                    <FormControl.Label>{i18n.t("imageURL")}</FormControl.Label>
                                    <Input value={imageURL} onChangeText={setImageURL} />
                                </FormControl>
                                <FormControl marginTop={3}>
                                    <FormControl.Label>{i18n.t("country")}</FormControl.Label>
                                    <CountrySelect value={country} onChange={setCountry} />
                                </FormControl>
                                <View flexDirection={"row"} flexWrap={"wrap"}>
                                    <FormControl marginTop={3} paddingRight={2} width={{ base: "100%", md: "33.33%" }}>
                                        <FormControl.Label>Gender</FormControl.Label>
                                        <Input maxLength={1} value={gender} onChangeText={(value) => setGender(normalizeGender(value))} />
                                    </FormControl>
                                    <FormControl marginTop={3} paddingRight={2} width={{ base: "100%", md: "33.33%" }}>
                                        <FormControl.Label>Rating</FormControl.Label>
                                        <Input keyboardType={"numeric"} value={rating} onChangeText={(value) => setRating(`${normalizeNumberField(value)}`)} />
                                    </FormControl>
                                    <FormControl marginTop={3} width={{ base: "100%", md: "33.33%" }}>
                                        <FormControl.Label>Ranking</FormControl.Label>
                                        <Input keyboardType={"numeric"} value={ranking} onChangeText={(value) => setRanking(`${normalizeNumberField(value)}`)} />
                                    </FormControl>
                                </View>
                                <View flexDirection={"row"} marginTop={3}>
                                    <Button backgroundColor={openScoreboardColor} onPress={addPlayer}>
                                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("add")}</Text>
                                    </Button>
                                    <Button
                                        marginLeft={2}
                                        onPress={() => {
                                            setShowAddPlayer(false);
                                            setFirstName("");
                                            setLastName("");
                                            setImageURL("");
                                            setCountry("");
                                            setGender("");
                                            setRating("");
                                            setRanking("");
                                        }}
                                        variant={"ghost"}
                                    >
                                        <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("back")}</Text>
                                    </Button>
                                </View>
                            </View>
                        ) : null}

                        {bulkEditMode ? (
                            <View marginTop={4}>
                                <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                                    <View flex={1} minWidth={260} paddingRight={3}>
                                        <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>Bulk edit roster</Text>
                                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                            Select players to archive them. They will be saved under archivedPlayers.
                                        </Text>
                                    </View>
                                    <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                                        <Button marginRight={2} onPress={() => setBulkSelectedPlayerIDs(Object.keys(bulkPlayers))} variant={"outline"}>
                                            <Text color={openScoreboardColor} fontWeight={"bold"}>Select all</Text>
                                        </Button>
                                        <Button marginRight={2} onPress={() => setBulkSelectedPlayerIDs([])} variant={"ghost"}>
                                            <Text color={"gray.700"} fontWeight={"bold"}>Clear</Text>
                                        </Button>
                                        <Button
                                            backgroundColor={"red.600"}
                                            isDisabled={bulkSelectedPlayerIDs.length === 0}
                                            onPress={archiveSelectedBulkPlayers}
                                        >
                                            <Text color={"white"} fontWeight={"bold"}>
                                                Archive selected{bulkSelectedPlayerIDs.length > 0 ? ` (${bulkSelectedPlayerIDs.length})` : ""}
                                            </Text>
                                        </Button>
                                    </View>
                                </View>
                                <ScrollView horizontal marginTop={2}>
                                    <View minWidth={1180} width={"100%"}>
                                        <View flexDirection={"row"} paddingBottom={2}>
                                            <Text color={"gray.500"} fontSize={"xs"} fontWeight={"bold"} minWidth={54} paddingRight={2} textTransform={"uppercase"}>Select</Text>
                                            <Text color={"gray.500"} flex={1} fontSize={"xs"} fontWeight={"bold"} minWidth={130} paddingRight={2} textTransform={"uppercase"}>{i18n.t("firstName")}</Text>
                                            <Text color={"gray.500"} flex={1} fontSize={"xs"} fontWeight={"bold"} minWidth={130} paddingRight={2} textTransform={"uppercase"}>{i18n.t("lastName")}</Text>
                                            <Text color={"gray.500"} flex={1.4} fontSize={"xs"} fontWeight={"bold"} minWidth={180} paddingRight={2} textTransform={"uppercase"}>{i18n.t("imageURL")}</Text>
                                            <Text color={"gray.500"} flex={1} fontSize={"xs"} fontWeight={"bold"} minWidth={180} textTransform={"uppercase"}>{i18n.t("country")}</Text>
                                            <Text color={"gray.500"} flex={0.6} fontSize={"xs"} fontWeight={"bold"} minWidth={90} paddingLeft={2} textTransform={"uppercase"}>Gender</Text>
                                            <Text color={"gray.500"} flex={0.8} fontSize={"xs"} fontWeight={"bold"} minWidth={110} paddingLeft={2} textTransform={"uppercase"}>Rating</Text>
                                            <Text color={"gray.500"} flex={0.8} fontSize={"xs"} fontWeight={"bold"} minWidth={110} paddingLeft={2} textTransform={"uppercase"}>Ranking</Text>
                                        </View>
                                        {Object.entries(bulkPlayers).map(([playerID, player]) => (
                                            <TeamBulkEditRow
                                                key={playerID}
                                                playerID={playerID}
                                                player={player}
                                                selected={bulkSelectedPlayerIDs.includes(playerID)}
                                                onChange={updateBulkPlayer}
                                                onToggleSelected={toggleBulkSelectedPlayer}
                                            />
                                        ))}
                                    </View>
                                </ScrollView>
                                <View flexDirection={"row"} marginTop={3}>
                                    <Button backgroundColor={openScoreboardColor} isDisabled={savingRoster || !teamColorIsValid} onPress={saveBulkRoster}>
                                        {savingRoster ? (
                                            <Spinner color={openScoreboardButtonTextColor} />
                                        ) : (
                                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("save")}</Text>
                                        )}
                                    </Button>
                                    <Button
                                        marginLeft={2}
                                        onPress={() => {
                                            setBulkEditMode(false);
                                            setBulkArchivedPlayers({});
                                            setBulkSelectedPlayerIDs([]);
                                        }}
                                        variant={"ghost"}
                                    >
                                        <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("close")}</Text>
                                    </Button>
                                </View>
                            </View>
                        ) : (
                            <View marginTop={3}>
                                {players && Object.entries(players).length > 0 ? Object.entries(players).map((player) => {
                                    return (
                                        <View key={player[0]}>
                                            <TeamPlayerItem
                                                onUpdate={(id, playerInfo) => {
                                                    setPlayers({ ...players, [id]: normalizeTeamPlayer(playerInfo) });
                                                }}
                                                onSave={(playerInfo) => {
                                                    setPlayers({ ...players, [uuidv4()]: normalizeTeamPlayer(playerInfo) });
                                                }}
                                                onDelete={archiveTeamPlayer}
                                                id={player[0]} {...player[1]}
                                            />
                                        </View>
                                    );
                                }) : (
                                    <View
                                        alignItems={"center"}
                                        backgroundColor={"gray.50"}
                                        borderColor={"gray.200"}
                                        borderRadius={8}
                                        borderStyle={"dashed"}
                                        borderWidth={1}
                                        marginTop={3}
                                        padding={6}
                                    >
                                        <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"} textAlign={"center"}>
                                            You do not have any players here.
                                        </Text>
                                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1} textAlign={"center"}>
                                            Please add a player to start building this team roster.
                                        </Text>
                                        <Button
                                            backgroundColor={openScoreboardColor}
                                            borderRadius={8}
                                            marginTop={4}
                                            onPress={() => {
                                                setShowAddPlayer(true);
                                            }}
                                        >
                                            <View alignItems={"center"} flexDirection={"row"}>
                                                <AddIcon color={openScoreboardButtonTextColor} />
                                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"} marginLeft={2}>
                                                    {i18n.t("add")}
                                                </Text>
                                            </View>
                                        </Button>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    <View flexDirection={"row"} marginTop={4} paddingBottom={8}>
                        <Button backgroundColor={openScoreboardColor} isDisabled={saving || !teamColorIsValid} onPress={saveTeam}>
                            {saving ? (
                                <Spinner color={openScoreboardButtonTextColor} />
                            ) : (
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("save")}</Text>
                            )}
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </NativeBaseProvider>
    );
}
