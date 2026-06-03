import React, { useEffect, useRef, useState } from 'react';
import { AddIcon, Button, Checkbox, FormControl, Input, NativeBaseProvider, ScrollView, Spinner, Text, View } from 'native-base';
import { v4 as uuidv4 } from 'uuid';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from "../openscoreboardtheme";
import { subFolderPath } from '../openscoreboard.config';
import { newImportedPlayer } from './classes/Player';
import { ensureTeamManagerPassword, getTeam, resetTeamManagerPassword, updateMyTeam, updateTeam } from './functions/teams';
import { TeamPlayerItem } from './listitems/TeamPlayerItem';
import CountrySelect from './components/CountrySelect';
import { CopyInputRightButton } from './components/CopyButton';
import TeamLogoPreview from './components/TeamLogoPreview';
import LoadingPage from './LoadingPage';
import Unauthorized from './Unauthorized';
import i18n from './translations/translate';

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
        clubName: player.clubName || "",
        jerseyColor: player.jerseyColor || "",
        firstNameInitial: player.firstNameInitial === true,
        lastNameInitial: player.lastNameInitial === true,
        isImported: player.isImported === true,
    };
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
        </View>
    );
}

function getTeamManagerURL(teamID, password) {
    if (typeof window === "undefined" || !teamID || !password) {
        return "";
    }

    return `${window.location.origin}${subFolderPath}/teammanager/${teamID}/${password}`;
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
    const [teamManagerPassword, setTeamManagerPassword] = useState("");
    const [players, setPlayers] = useState({});
    const [archivedPlayers, setArchivedPlayers] = useState({});
    const [showAddPlayer, setShowAddPlayer] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [imageURL, setImageURL] = useState("");
    const [country, setCountry] = useState("");
    const [bulkEditMode, setBulkEditMode] = useState(false);
    const [bulkPlayers, setBulkPlayers] = useState({});
    const [bulkArchivedPlayers, setBulkArchivedPlayers] = useState({});
    const [bulkSelectedPlayerIDs, setBulkSelectedPlayerIDs] = useState([]);
    const [savingRoster, setSavingRoster] = useState(false);

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
                if (!team.teamManagerPassword || team.teamManagerPassword !== routePassword) {
                    setUnauthorized(true);
                    setDoneLoading(true);
                    return;
                }
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

    const addPlayer = () => {
        setPlayers({ ...players, [uuidv4()]: newImportedPlayer(firstName, lastName, imageURL, country) });
        setShowAddPlayer(false);
        setFirstName("");
        setLastName("");
        setImageURL("");
        setCountry("");
    };

    const saveTeam = async () => {
        setSaving(true);

        try {
            const nextTeam = {
                ...editingTeam.current,
                teamName,
                teamLogoURL,
                teamManagerPassword,
                players: JSON.parse(JSON.stringify(players)),
                archivedPlayers: JSON.parse(JSON.stringify(archivedPlayers)),
            };

            await updateTeam(teamID, nextTeam);
            if (myTeamID) {
                await updateMyTeam(myTeamID, teamName, teamLogoURL);
            }
            editingTeam.current = nextTeam;
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
        setSavingRoster(true);

        try {
            const nextArchivedPlayers = {
                ...archivedPlayers,
                ...addArchivedMetadata(bulkArchivedPlayers),
            };
            const nextTeam = {
                ...editingTeam.current,
                teamName,
                teamLogoURL,
                teamManagerPassword,
                players: JSON.parse(JSON.stringify(bulkPlayers)),
                archivedPlayers: JSON.parse(JSON.stringify(nextArchivedPlayers)),
            };

            await updateTeam(teamID, nextTeam);
            if (myTeamID) {
                await updateMyTeam(myTeamID, teamName, teamLogoURL);
            }
            editingTeam.current = nextTeam;
            setPlayers(bulkPlayers);
            setArchivedPlayers(nextArchivedPlayers);
            setBulkArchivedPlayers({});
            setBulkSelectedPlayerIDs([]);
            setBulkEditMode(false);
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

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
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
                            <Button backgroundColor={openScoreboardColor} isDisabled={saving} marginTop={1} onPress={saveTeam}>
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
                                    <View minWidth={820} width={"100%"}>
                                        <View flexDirection={"row"} paddingBottom={2}>
                                            <Text color={"gray.500"} fontSize={"xs"} fontWeight={"bold"} minWidth={54} paddingRight={2} textTransform={"uppercase"}>Select</Text>
                                            <Text color={"gray.500"} flex={1} fontSize={"xs"} fontWeight={"bold"} minWidth={130} paddingRight={2} textTransform={"uppercase"}>{i18n.t("firstName")}</Text>
                                            <Text color={"gray.500"} flex={1} fontSize={"xs"} fontWeight={"bold"} minWidth={130} paddingRight={2} textTransform={"uppercase"}>{i18n.t("lastName")}</Text>
                                            <Text color={"gray.500"} flex={1.4} fontSize={"xs"} fontWeight={"bold"} minWidth={180} paddingRight={2} textTransform={"uppercase"}>{i18n.t("imageURL")}</Text>
                                            <Text color={"gray.500"} flex={1} fontSize={"xs"} fontWeight={"bold"} minWidth={180} textTransform={"uppercase"}>{i18n.t("country")}</Text>
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
                                    <Button backgroundColor={openScoreboardColor} isDisabled={savingRoster} onPress={saveBulkRoster}>
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
                        <Button backgroundColor={openScoreboardColor} isDisabled={saving} onPress={saveTeam}>
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
