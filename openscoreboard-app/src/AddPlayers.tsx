import React, { useEffect, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Avatar, Button, Checkbox, FormControl, Input, Modal, NativeBaseProvider, ScrollView, Spinner, Text, View } from 'native-base';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from "../openscoreboardtheme";
import {
    addImportedPlayer,
    archiveImportedPlayers,
    getImportPlayerList,
    getPlayerListDetails,
    resetPlayerListPassword,
    sortPlayers,
    updateImportedPlayers,
    updateImportedPlayersWithArchived,
    updatePlayerListDetails,
} from './functions/players';
import { newImportedPlayer } from './classes/Player';
import { AddNewPlayerModal } from './modals/AddNewPlayerModal';
import { CopyInputRightButton } from './components/CopyButton';
import CountrySelect, { getCountryName } from './components/CountrySelect';
import { subFolderPath } from '../openscoreboard.config';
import i18n from './translations/translate';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';
import { normalizePlayerRegistrationFields, playerRegistrationFieldOptions } from './registrationFields';

function getRegistrationURL(playerListID, password) {
    if (typeof window === "undefined") {
        return "";
    }

    return `${window.location.origin}${subFolderPath}/playerregistration/${playerListID}/${password || ""}`;
}

function formatModifiedDate(value) {
    if (!value) {
        return "Unknown";
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function csvEscape(value) {
    const stringValue = `${value || ""}`;

    if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

function parseCSVLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index++) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
            current += '"';
            index++;
        }
        else if (char === '"') {
            inQuotes = !inQuotes;
        }
        else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
        }
        else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

function playerMatchesSearch(player, searchText) {
    const searchable = `${player.firstName || ""} ${player.lastName || ""} ${player.country || ""}`.toLowerCase();
    return searchable.includes(searchText.trim().toLowerCase());
}

function normalizeDuplicateText(value = "") {
    return `${value}`.trim().replace(/\s+/g, " ").toLowerCase();
}

function getDuplicateKey(player = {}) {
    const firstName = normalizeDuplicateText(player.firstName);
    const lastName = normalizeDuplicateText(player.lastName);

    if (!firstName && !lastName) {
        return "";
    }

    return `${firstName}|${lastName}`;
}

function getPlayerDisplayName(player = {}) {
    return `${player.firstName || ""} ${player.lastName || ""}`.trim() || "Unnamed player";
}

function parseImportPlayers(importValue) {
    return importValue
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map(parseCSVLine)
        .filter((row, index) => index !== 0 || row[0]?.trim().toLowerCase() !== "firstname")
        .map((row) => newImportedPlayer(
            row[0] || "",
            row[1] || "",
            row[2] || "",
            row[3]?.toLowerCase() || "",
        ));
}

function RegistrationFieldSetting({ option, isChecked, onChange }) {
    return (
        <View
            backgroundColor={"gray.50"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginBottom={2}
            padding={3}
        >
            <Checkbox
                isChecked={isChecked}
                isDisabled={option.locked}
                onChange={(checked) => onChange(option.key, checked)}
                value={option.key}
            >
                <Text color={"gray.900"} fontWeight={"bold"}>{option.label}</Text>
            </Checkbox>
            <Text color={"gray.600"} fontSize={"xs"} marginLeft={7} marginTop={1}>
                {option.description}
            </Text>
        </View>
    );
}

function DuplicateImportModal({ duplicates, isImporting, isOpen, onClose, onImportAll, onSkipDuplicates }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <Modal.Content maxWidth={560}>
                <Modal.CloseButton />
                <Modal.Header>Duplicate players found</Modal.Header>
                <Modal.Body>
                    <Text color={"gray.700"}>
                        Some imported players look like players already in this list, or repeat within the pasted CSV.
                    </Text>
                    <View
                        backgroundColor={"gray.50"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        marginTop={3}
                        maxHeight={220}
                        padding={3}
                    >
                        <ScrollView>
                            {duplicates.slice(0, 20).map((duplicate, index) => (
                                <View key={`${duplicate.key}-${index}`} marginBottom={2}>
                                    <Text color={"gray.900"} fontWeight={"bold"}>{getPlayerDisplayName(duplicate.player)}</Text>
                                    <Text color={"gray.600"} fontSize={"xs"}>
                                        Matches {duplicate.matchSource === "import" ? "another imported row" : getPlayerDisplayName(duplicate.match)}
                                    </Text>
                                </View>
                            ))}
                            {duplicates.length > 20 ? (
                                <Text color={"gray.600"} fontSize={"xs"}>
                                    And {duplicates.length - 20} more duplicate rows.
                                </Text>
                            ) : null}
                        </ScrollView>
                    </View>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        backgroundColor={openScoreboardColor}
                        isDisabled={isImporting}
                        onPress={onSkipDuplicates}
                    >
                        {isImporting ? (
                            <Spinner color={openScoreboardButtonTextColor} />
                        ) : (
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Skip duplicates</Text>
                        )}
                    </Button>
                    <Button
                        marginLeft={2}
                        isDisabled={isImporting}
                        onPress={onImportAll}
                        variant={"outline"}
                    >
                        <Text color={openScoreboardColor} fontWeight={"bold"}>Import as new</Text>
                    </Button>
                    <Button marginLeft={2} isDisabled={isImporting} onPress={onClose} variant={"ghost"}>
                        <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("close")}</Text>
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}

function PlayerCard({ player, isEditing, draft, onEdit, onDelete, onDraftChange, onSave, onCancel }) {
    const displayName = `${player.firstName || ""} ${player.lastName || ""}`.trim() || "Unnamed player";

    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginBottom={3}
            padding={3}
        >
            <View alignItems={"flex-start"} flexDirection={"row"}>
                {player.imageURL ? (
                    <Avatar source={{ uri: player.imageURL }} />
                ) : (
                    <View
                        alignItems={"center"}
                        backgroundColor={"blue.50"}
                        borderColor={"blue.100"}
                        borderRadius={8}
                        borderWidth={1}
                        height={42}
                        justifyContent={"center"}
                        width={42}
                    >
                        <FontAwesome5 name="user" size={17} color={openScoreboardColor} />
                    </View>
                )}
                <View flex={1} marginLeft={3} paddingRight={2}>
                    <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"} numberOfLines={1}>
                        {displayName}
                    </Text>
                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1} numberOfLines={1}>
                        {getCountryName(player.country) || "No country set"}
                    </Text>
                </View>
                {!isEditing ? (
                    <Button
                        backgroundColor={"white"}
                        borderColor={"blue.100"}
                        borderRadius={8}
                        borderWidth={1}
                        minWidth={42}
                        onPress={onEdit}
                        variant={"outline"}
                    >
                        <FontAwesome5 name="edit" size={15} color={openScoreboardColor} />
                    </Button>
                ) : null}
            </View>

            {isEditing ? (
                <View marginTop={3}>
                    <FormControl>
                        <FormControl.Label>{i18n.t("firstName")}</FormControl.Label>
                        <Input value={draft.firstName || ""} onChangeText={(value) => onDraftChange("firstName", value)} />
                    </FormControl>
                    <FormControl marginTop={2}>
                        <FormControl.Label>{i18n.t("lastName")}</FormControl.Label>
                        <Input value={draft.lastName || ""} onChangeText={(value) => onDraftChange("lastName", value)} />
                    </FormControl>
                    <FormControl marginTop={2}>
                        <FormControl.Label>{i18n.t("imageURL")}</FormControl.Label>
                        <Input value={draft.imageURL || ""} onChangeText={(value) => onDraftChange("imageURL", value)} />
                    </FormControl>
                    <FormControl marginTop={2}>
                        <FormControl.Label>{i18n.t("country")}</FormControl.Label>
                        <CountrySelect value={draft.country || ""} onChange={(value) => onDraftChange("country", value)} />
                    </FormControl>
                    <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                        <Button backgroundColor={openScoreboardColor} onPress={onSave}>
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("save")}</Text>
                        </Button>
                        <Button marginLeft={2} onPress={onCancel} variant={"ghost"}>
                            <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("close")}</Text>
                        </Button>
                        <Button
                            backgroundColor={"white"}
                            borderColor={"red.200"}
                            borderRadius={8}
                            borderWidth={1}
                            marginLeft={2}
                            onPress={onDelete}
                            variant={"outline"}
                        >
                            <View alignItems={"center"} flexDirection={"row"}>
                                <FontAwesome5 name="archive" size={14} color="#B91C1C" />
                                <Text color={"red.700"} fontSize={"sm"} fontWeight={"bold"} marginLeft={2}>Archive</Text>
                            </View>
                        </Button>
                    </View>
                </View>
            ) : null}
        </View>
    );
}

function BulkEditRow({ playerID, player, selected, onChange, onToggleSelected }) {
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

export default function AddPlayers(props) {
    const playerListID = props.route.params.playerListID;
    const { width } = useWindowDimensions();
    const useTwoColumns = width >= 860;
    const [playerList, setPlayerList] = useState([]);
    const [listName, setListName] = useState("");
    const [description, setDescription] = useState("");
    const [password, setPassword] = useState("");
    const [modifiedOn, setModifiedOn] = useState(null);
    const [registrationFields, setRegistrationFields] = useState(normalizePlayerRegistrationFields());
    const [resettingRegistrationAccess, setResettingRegistrationAccess] = useState(false);
    const [showAddNewPlayer, setShowAddNewPlayer] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [editingPlayerID, setEditingPlayerID] = useState("");
    const [editingDraft, setEditingDraft] = useState({});
    const [savingDetails, setSavingDetails] = useState(false);
    const [bulkEditMode, setBulkEditMode] = useState(false);
    const [bulkPlayers, setBulkPlayers] = useState({});
    const [bulkArchivedPlayers, setBulkArchivedPlayers] = useState({});
    const [bulkSelectedPlayerIDs, setBulkSelectedPlayerIDs] = useState([]);
    const [savingBulk, setSavingBulk] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState("");
    const [pendingImportPlayers, setPendingImportPlayers] = useState([]);
    const [pendingDuplicateImports, setPendingDuplicateImports] = useState([]);
    const [isImportingPlayers, setIsImportingPlayers] = useState(false);

    async function loadPlayerList() {
        const [details, playerValues] = await Promise.all([
            getPlayerListDetails(playerListID),
            getImportPlayerList(playerListID),
        ]);

        setListName(details.playerListName || "");
        setDescription(details.description || "");
        setPassword(details.password || "");
        setModifiedOn(details.modifiedOn || details.createdOn || null);
        setRegistrationFields(normalizePlayerRegistrationFields(details.registrationFields));
        setPlayerList(playerValues.length > 0 ? sortPlayers(playerValues) : []);
    }

    useEffect(() => {
        props.navigation.setOptions({
            headerRight: () => (
                <HeaderActions
                    navigation={props.navigation}
                    action={<HeaderIconButton label={i18n.t("createOne")} onPress={() => {
                        setShowAddNewPlayer(true);
                    }} />}
                />
            ),
        });

        loadPlayerList();
    }, [props.navigation, playerListID]);

    const filteredPlayers = useMemo(() => {
        if (!searchText.trim()) {
            return playerList;
        }

        return playerList.filter(([, player]) => playerMatchesSearch(player, searchText));
    }, [playerList, searchText]);

    const registrationURL = getRegistrationURL(playerListID, password);

    const saveListDetails = async () => {
        setSavingDetails(true);
        await updatePlayerListDetails(playerListID, {
            playerListName: listName,
            description,
            registrationFields: normalizePlayerRegistrationFields(registrationFields),
        });
        setSavingDetails(false);
        await loadPlayerList();
    };

    const updateRegistrationField = (field, isEnabled) => {
        setRegistrationFields(normalizePlayerRegistrationFields({
            ...registrationFields,
            [field]: isEnabled,
        }));
    };

    const resetRegistrationAccess = async () => {
        setResettingRegistrationAccess(true);

        try {
            const newPassword = await resetPlayerListPassword(playerListID);
            setPassword(newPassword);
            await loadPlayerList();
        }
        finally {
            setResettingRegistrationAccess(false);
        }
    };

    const startCardEdit = (playerID, player) => {
        setEditingPlayerID(playerID);
        setEditingDraft({ ...player });
    };

    const updateCardDraft = (field, value) => {
        setEditingDraft({ ...editingDraft, [field]: value });
    };

    const saveCardEdit = async () => {
        const players = Object.fromEntries(playerList);
        players[editingPlayerID] = { ...players[editingPlayerID], ...editingDraft };
        await updateImportedPlayers(playerListID, players);
        setEditingPlayerID("");
        setEditingDraft({});
        await loadPlayerList();
    };

    const removePlayer = async (playerID) => {
        await archiveImportedPlayers(playerListID, [playerID]);
        await loadPlayerList();
    };

    const openBulkEdit = () => {
        setBulkPlayers(Object.fromEntries(playerList));
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

    const selectAllBulkPlayers = () => {
        setBulkSelectedPlayerIDs(Object.keys(bulkPlayers));
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

    const saveBulkPlayers = async () => {
        setSavingBulk(true);
        await updateImportedPlayersWithArchived(playerListID, bulkPlayers, bulkArchivedPlayers);
        setSavingBulk(false);
        setBulkEditMode(false);
        await loadPlayerList();
    };

    const exportPlayers = () => {
        const rows = [
            ["firstName", "lastName", "imageURL", "country"],
            ...playerList.map(([, player]) => [
                player.firstName || "",
                player.lastName || "",
                player.imageURL || "",
                player.country || "",
            ]),
        ];
        const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

        if (typeof window !== "undefined") {
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${listName || "players"}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    const clearPendingImport = () => {
        setPendingImportPlayers([]);
        setPendingDuplicateImports([]);
    };

    const completeImport = async (playersToImport) => {
        setIsImportingPlayers(true);

        try {
            for (const player of playersToImport) {
                await addImportedPlayer(playerListID, player);
            }

            setImportText("");
            setShowImport(false);
            clearPendingImport();
            await loadPlayerList();
        }
        finally {
            setIsImportingPlayers(false);
        }
    };

    const getDuplicateImportReview = (importedPlayers) => {
        const seenPlayers = new Map();
        const duplicates = [];
        const uniquePlayers = [];

        playerList.forEach(([, player]) => {
            const duplicateKey = getDuplicateKey(player);

            if (duplicateKey) {
                seenPlayers.set(duplicateKey, {
                    player,
                    source: "existing",
                });
            }
        });

        importedPlayers.forEach((player) => {
            const duplicateKey = getDuplicateKey(player);
            const matchingPlayer = duplicateKey ? seenPlayers.get(duplicateKey) : null;

            if (matchingPlayer) {
                duplicates.push({
                    key: duplicateKey,
                    match: matchingPlayer.player,
                    matchSource: matchingPlayer.source,
                    player,
                });
            }
            else {
                uniquePlayers.push(player);
            }

            if (duplicateKey && !seenPlayers.has(duplicateKey)) {
                seenPlayers.set(duplicateKey, {
                    player,
                    source: "import",
                });
            }
        });

        return { duplicates, uniquePlayers };
    };

    const importPlayers = async () => {
        const importedPlayers = parseImportPlayers(importText);
        const { duplicates, uniquePlayers } = getDuplicateImportReview(importedPlayers);

        if (duplicates.length > 0) {
            setPendingImportPlayers(importedPlayers);
            setPendingDuplicateImports(duplicates);
            return;
        }

        await completeImport(uniquePlayers);
    };

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"white"}>
                <View alignSelf={"center"} maxWidth={1180} padding={4} width={"100%"}>
                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        padding={4}
                    >
                        <View flexDirection={"row"} flexWrap={"wrap"}>
                            <View flex={1} minWidth={260} paddingRight={3}>
                                <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>Player List</Text>
                                <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                    {playerList.length} active {playerList.length === 1 ? "player" : "players"} | Last modified {formatModifiedDate(modifiedOn)}
                                </Text>
                            </View>
                            <Button backgroundColor={openScoreboardColor} isDisabled={savingDetails} onPress={saveListDetails}>
                                {savingDetails ? (
                                    <Spinner color={openScoreboardButtonTextColor} />
                                ) : (
                                    <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("save")}</Text>
                                )}
                            </Button>
                        </View>

                        <FormControl marginTop={4}>
                            <FormControl.Label>List name</FormControl.Label>
                            <Input value={listName} onChangeText={setListName} />
                        </FormControl>
                        <FormControl marginTop={3}>
                            <FormControl.Label>Description</FormControl.Label>
                            <Input
                                multiline
                                minHeight={84}
                                textAlignVertical={"top"}
                                value={description}
                                onChangeText={setDescription}
                            />
                        </FormControl>
                        <FormControl marginTop={3}>
                            <FormControl.Label>Registration link</FormControl.Label>
                            <Input
                                backgroundColor={"white"}
                                borderColor={"gray.300"}
                                color={"gray.900"}
                                isReadOnly
                                InputRightElement={<CopyInputRightButton text={registrationURL} />}
                                value={registrationURL}
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
                                Reset this link if the current URL should no longer allow public registrations.
                            </Text>
                            <Button
                                backgroundColor={"white"}
                                borderColor={"red.200"}
                                borderRadius={8}
                                borderWidth={1}
                                isDisabled={resettingRegistrationAccess}
                                onPress={resetRegistrationAccess}
                                variant={"outline"}
                            >
                                {resettingRegistrationAccess ? (
                                    <Spinner color={"red.700"} />
                                ) : (
                                    <Text color={"red.700"} fontWeight={"bold"}>Reset registration link</Text>
                                )}
                            </Button>
                        </View>
                        <View marginTop={4}>
                            <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>Registration form fields</Text>
                            <Text color={"gray.600"} fontSize={"sm"} marginTop={1} marginBottom={3}>
                                Choose which player details the public registration page should request.
                            </Text>
                            <View flexDirection={"row"} flexWrap={"wrap"}>
                                {playerRegistrationFieldOptions.map((option) => (
                                    <View key={option.key} paddingRight={useTwoColumns ? 2 : 0} width={useTwoColumns ? "50%" : "100%"}>
                                        <RegistrationFieldSetting
                                            option={option}
                                            isChecked={registrationFields[option.key] === true}
                                            onChange={updateRegistrationField}
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        marginTop={4}
                        padding={4}
                    >
                        <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                            <View flex={1} minWidth={240} paddingRight={3}>
                                <FormControl>
                                    <FormControl.Label>Search players</FormControl.Label>
                                    <Input
                                        placeholder="Search by player name"
                                        value={searchText}
                                        onChangeText={setSearchText}
                                    />
                                </FormControl>
                            </View>
                            <View flexDirection={"row"} flexWrap={"wrap"} marginTop={4}>
                                <Button marginRight={2} onPress={() => setShowAddNewPlayer(true)}>
                                    <View alignItems={"center"} flexDirection={"row"}>
                                        <Ionicons name="add" size={18} color={openScoreboardButtonTextColor} />
                                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"} marginLeft={2}>{i18n.t("add")}</Text>
                                    </View>
                                </Button>
                                <Button marginRight={2} onPress={openBulkEdit} variant={"outline"}>
                                    <Text color={openScoreboardColor} fontWeight={"bold"}>Bulk edit</Text>
                                </Button>
                                <Button marginRight={2} onPress={() => setShowImport(!showImport)} variant={"outline"}>
                                    <Text color={openScoreboardColor} fontWeight={"bold"}>Import</Text>
                                </Button>
                                <Button onPress={exportPlayers} variant={"outline"}>
                                    <Text color={openScoreboardColor} fontWeight={"bold"}>Export</Text>
                                </Button>
                            </View>
                        </View>

                        {showImport ? (
                            <View
                                backgroundColor={"gray.50"}
                                borderColor={"gray.200"}
                                borderRadius={8}
                                borderWidth={1}
                                marginTop={4}
                                padding={3}
                            >
                                <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>Import players</Text>
                                <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                    Paste CSV rows as firstName,lastName,imageURL,country.
                                </Text>
                                <Input
                                    marginTop={3}
                                    multiline
                                    minHeight={120}
                                    textAlignVertical={"top"}
                                    value={importText}
                                    onChangeText={setImportText}
                                />
                                <View flexDirection={"row"} marginTop={3}>
                                    <Button
                                        backgroundColor={openScoreboardColor}
                                        isDisabled={isImportingPlayers || importText.trim().length === 0}
                                        onPress={importPlayers}
                                    >
                                        {isImportingPlayers ? (
                                            <Spinner color={openScoreboardButtonTextColor} />
                                        ) : (
                                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Import players</Text>
                                        )}
                                    </Button>
                                    <Button
                                        marginLeft={2}
                                        onPress={() => {
                                            setShowImport(false);
                                            clearPendingImport();
                                        }}
                                        variant={"ghost"}
                                    >
                                        <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("close")}</Text>
                                    </Button>
                                </View>
                            </View>
                        ) : null}

                        {bulkEditMode ? (
                            <View marginTop={4}>
                                <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                                    <View flex={1} minWidth={260} paddingRight={3}>
                                        <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>Bulk edit players</Text>
                                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                            Select players to archive them. They will be removed from the active list when you save.
                                        </Text>
                                    </View>
                                    <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                                        <Button marginRight={2} onPress={selectAllBulkPlayers} variant={"outline"}>
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
                                            <BulkEditRow
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
                                    <Button backgroundColor={openScoreboardColor} isDisabled={savingBulk} onPress={saveBulkPlayers}>
                                        {savingBulk ? (
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
                            <View
                                flexDirection={"row"}
                                flexWrap={"wrap"}
                                marginTop={4}
                            >
                                {filteredPlayers.length > 0 ? (
                                    filteredPlayers.map(([playerID, player]) => (
                                        <View key={playerID} paddingRight={useTwoColumns ? 3 : 0} width={useTwoColumns ? "50%" : "100%"}>
                                            <PlayerCard
                                                player={player}
                                                isEditing={editingPlayerID === playerID}
                                                draft={editingDraft}
                                                onEdit={() => startCardEdit(playerID, player)}
                                                onDelete={() => removePlayer(playerID)}
                                                onDraftChange={updateCardDraft}
                                                onSave={saveCardEdit}
                                                onCancel={() => {
                                                    setEditingPlayerID("");
                                                    setEditingDraft({});
                                                }}
                                            />
                                        </View>
                                    ))
                                ) : (
                                    <View alignItems={"center"} padding={6} width={"100%"}>
                                        <MaterialCommunityIcons name="account-search-outline" size={42} color={openScoreboardColor} />
                                        <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"} marginTop={3}>
                                            {playerList.length > 0 ? "No players match your search" : i18n.t("noPlayersInList")}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                <DuplicateImportModal
                    duplicates={pendingDuplicateImports}
                    isImporting={isImportingPlayers}
                    isOpen={pendingDuplicateImports.length > 0}
                    onClose={clearPendingImport}
                    onImportAll={() => {
                        completeImport(pendingImportPlayers);
                    }}
                    onSkipDuplicates={() => {
                        completeImport(getDuplicateImportReview(pendingImportPlayers).uniquePlayers);
                    }}
                />

                {showAddNewPlayer ? (
                    <AddNewPlayerModal
                        {...props}
                        isOpen={showAddNewPlayer}
                        isEditing={false}
                        onClose={() => {
                            setShowAddNewPlayer(false);
                        }}
                        onConfirmAdd={async () => {
                            await loadPlayerList();
                        }}
                        onConfirmEdit={async () => {
                            await loadPlayerList();
                        }}
                    />
                ) : null}
            </ScrollView>
        </NativeBaseProvider>
    );
}
