import React, { useEffect, useState } from 'react';
import { Button, FormControl, Input, NativeBaseProvider, ScrollView, Select, Spinner, Text, View } from 'native-base';
import { AntDesign, FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import db, { getUserPath } from '../database';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';
import { subFolderPath } from '../openscoreboard.config';
import LoadingPage from './LoadingPage';
import { CopyInputRightButton } from './components/CopyButton';
import { ScorekeeperSessionsPanel } from './components/ScorekeeperSessionsPanel';
import { getMyPlayerLists } from './functions/players';
import { getTableScorekeeperTarget } from './functions/scorekeeperSessions';
import { deleteTable, resetTablePassword, setPlayerListToTable } from './functions/tables';
import { supportedSports } from './functions/sports';
import i18n from './translations/translate';

function Section({ children, icon, subtitle, title, tone = "default" }) {
    const isDanger = tone === "danger";

    return (
        <View
            backgroundColor={"white"}
            borderColor={isDanger ? "red.200" : "gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginTop={4}
            padding={4}
        >
            <View alignItems={"center"} flexDirection={"row"} marginBottom={subtitle ? 3 : 2}>
                <View
                    alignItems={"center"}
                    backgroundColor={isDanger ? "red.50" : "gray.100"}
                    borderRadius={999}
                    height={36}
                    justifyContent={"center"}
                    marginRight={3}
                    width={36}
                >
                    {icon}
                </View>
                <View flex={1}>
                    <Text color={isDanger ? "red.700" : "gray.900"} fontSize={"lg"} fontWeight={"bold"}>{title}</Text>
                    {subtitle ? (
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{subtitle}</Text>
                    ) : null}
                </View>
            </View>
            {children}
        </View>
    );
}

function PageAction({ icon, isPrimary = false, label, onPress }) {
    return (
        <Button
            backgroundColor={isPrimary ? openScoreboardColor : "white"}
            borderColor={isPrimary ? openScoreboardColor : "blue.100"}
            borderRadius={8}
            borderWidth={1}
            marginRight={2}
            marginTop={2}
            onPress={onPress}
            variant={isPrimary ? "solid" : "outline"}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                {icon(isPrimary ? openScoreboardButtonTextColor : openScoreboardColor)}
                <Text
                    color={isPrimary ? openScoreboardButtonTextColor : "blue.700"}
                    fontSize={"sm"}
                    fontWeight={"bold"}
                    marginLeft={2}
                >
                    {label}
                </Text>
            </View>
        </Button>
    );
}

function findPlayerList(playerLists, playerListID) {
    return playerLists.find((playerList) => playerList?.[1]?.id === playerListID);
}

async function findMyTableID(tableID) {
    const myTablesSnap = await db.ref(`users/${getUserPath()}/myTables`).get();
    const myTables = myTablesSnap.val() || {};
    const matchingTable = Object.entries(myTables).find(([, currentTableID]) => currentTableID === tableID);
    return matchingTable?.[0] || "";
}

export default function TableEditor(props) {
    const routeParams = props.route?.params || {};
    const tableID = routeParams.tableID || "";
    const [myTableID, setMyTableID] = useState(routeParams.myTableID || "");
    const [doneLoading, setDoneLoading] = useState(false);
    const [tableExists, setTableExists] = useState(true);
    const [tableName, setTableName] = useState(routeParams.name || "");
    const [accessPassword, setAccessPassword] = useState("");
    const [sportName, setSportName] = useState(routeParams.sportName || "tableTennis");
    const [scoringType, setScoringType] = useState(routeParams.scoringType || "");
    const [playerListID, setPlayerListID] = useState("");
    const [selectedPlayerListPassword, setSelectedPlayerListPassword] = useState("");
    const [myPlayerLists, setMyPlayerLists] = useState([]);
    const [savingTableName, setSavingTableName] = useState(false);
    const [savingPlayerList, setSavingPlayerList] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);
    const [showConfirmPasswordReset, setShowConfirmPasswordReset] = useState(false);
    const [showDeleteTable, setShowDeleteTable] = useState(false);
    const [loadingDeleteTable, setLoadingDeleteTable] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const tableDisplayName = tableName || "Table";
    const sportDisplayName = supportedSports[sportName]?.displayName || sportName || "Table Tennis";
    const encodedTableName = encodeURIComponent(tableDisplayName);
    const ownerID = getUserPath() || "";
    const scoreKeepingURL = typeof window === "undefined" || !tableID
        ? ""
        : `${window.location.origin}${subFolderPath}/scoring/table/${tableID}/${encodedTableName}/${accessPassword}?sportName=${sportName || "tableTennis"}&scoringType=${scoringType || ""}&ownerID=${encodeURIComponent(ownerID)}`;
    const playerRegistrationURL = typeof window === "undefined" || !playerListID
        ? ""
        : `${window.location.origin}${subFolderPath}/playerregistration/${playerListID}/${selectedPlayerListPassword}`;
    const scorekeeperTarget = getTableScorekeeperTarget(tableID, tableDisplayName, ownerID);

    function setSelectedPlayerList(nextPlayerListID, playerLists = myPlayerLists) {
        setPlayerListID(nextPlayerListID || "");
        const selectedPlayerList = findPlayerList(playerLists, nextPlayerListID);
        setSelectedPlayerListPassword(selectedPlayerList?.[1]?.password || "");
    }

    async function loadTable() {
        setDoneLoading(false);

        const [tableSnap, playerLists] = await Promise.all([
            db.ref(`tables/${tableID}`).get(),
            getMyPlayerLists(),
        ]);
        const table = tableSnap.val();

        if (!table) {
            setTableExists(false);
            setDoneLoading(true);
            return;
        }

        const nextMyTableID = myTableID || await findMyTableID(tableID);
        setMyTableID(nextMyTableID);
        setTableName(table.tableName || "");
        setAccessPassword(table.password || "");
        setSportName(table.sportName || "tableTennis");
        setScoringType(table.scoringType || "");
        setMyPlayerLists(playerLists);
        setSelectedPlayerList(table.playerListID || "", playerLists);
        setTableExists(true);
        setDoneLoading(true);
    }

    async function saveTableName() {
        setSavingTableName(true);
        await db.ref(`tables/${tableID}/tableName`).set(tableName);
        setStatusMessage("Table name saved.");
        setSavingTableName(false);
    }

    async function savePlayerList() {
        setSavingPlayerList(true);
        await setPlayerListToTable(tableID, playerListID, myTableID);
        setStatusMessage("Player list saved.");
        setSavingPlayerList(false);
    }

    async function resetShareAccess() {
        setResettingPassword(true);
        const newPassword = await resetTablePassword(tableID);
        setAccessPassword(newPassword);
        setStatusMessage("Share access reset. Existing scoring links have been replaced.");
        setShowConfirmPasswordReset(false);
        setResettingPassword(false);
    }

    async function removeTable() {
        setLoadingDeleteTable(true);
        await deleteTable(myTableID);
        setLoadingDeleteTable(false);
        props.navigation.navigate("MyTables");
    }

    useEffect(() => {
        props.navigation.setOptions({
            title: tableName ? `Manage ${tableName}` : "Manage Table/Court",
        });
    }, [props.navigation, tableName]);

    useEffect(() => {
        loadTable();
    }, [tableID]);

    if (!doneLoading) {
        return <LoadingPage />;
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"} contentContainerStyle={{ paddingBottom: 40 }}>
                <View alignSelf={"center"} maxWidth={960} padding={4} width={"100%"}>
                    {!tableExists ? (
                        <Section
                            icon={<MaterialCommunityIcons name="table-tennis" size={18} color={openScoreboardColor} />}
                            title={"Table/Court not found"}
                            subtitle={"This table or court may have been deleted or you may not have access to it."}
                        >
                            <Button alignSelf={"flex-start"} onPress={() => props.navigation.navigate("MyTables")}>
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Back to tables</Text>
                            </Button>
                        </Section>
                    ) : (
                        <>
                            <View
                                backgroundColor={"white"}
                                borderColor={"gray.200"}
                                borderRadius={8}
                                borderWidth={1}
                                padding={4}
                            >
                                <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>{tableDisplayName}</Text>
                                <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{sportDisplayName}</Text>
                            </View>

                            {statusMessage ? (
                                <View
                                    backgroundColor={"green.50"}
                                    borderColor={"green.200"}
                                    borderRadius={8}
                                    borderWidth={1}
                                    marginTop={4}
                                    padding={3}
                                >
                                    <Text color={"green.800"} fontSize={"sm"} fontWeight={"semibold"}>{statusMessage}</Text>
                                </View>
                            ) : null}

                            <Section
                                icon={<FontAwesome name="edit" size={16} color={openScoreboardColor} />}
                                title={"Table details"}
                                subtitle={"Update the table name and copy the scoring access link."}
                            >
                                <FormControl>
                                    <FormControl.Label>Table name</FormControl.Label>
                                    <View alignItems={"center"} flexDirection={"row"}>
                                        <Input
                                            backgroundColor={"white"}
                                            borderColor={"gray.300"}
                                            color={"gray.900"}
                                            flex={1}
                                            onChangeText={setTableName}
                                            value={tableName}
                                        />
                                        <Button
                                            backgroundColor={"black"}
                                            borderRadius={8}
                                            isDisabled={!tableName.trim() || savingTableName}
                                            marginLeft={2}
                                            onPress={saveTableName}
                                        >
                                            {savingTableName ? (
                                                <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                            ) : (
                                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("save")}</Text>
                                            )}
                                        </Button>
                                    </View>
                                </FormControl>

                                <FormControl marginTop={4}>
                                    <FormControl.Label>Scoring link</FormControl.Label>
                                    <Input
                                        backgroundColor={"white"}
                                        borderColor={"gray.300"}
                                        color={"gray.900"}
                                        isReadOnly
                                        InputRightElement={<CopyInputRightButton text={scoreKeepingURL} />}
                                        value={scoreKeepingURL}
                                    />
                                </FormControl>

                                {showConfirmPasswordReset ? (
                                    <View
                                        backgroundColor={"amber.50"}
                                        borderColor={"amber.200"}
                                        borderRadius={8}
                                        borderWidth={1}
                                        marginTop={3}
                                        padding={3}
                                    >
                                        <Text color={"amber.900"} fontSize={"sm"} fontWeight={"bold"}>{i18n.t("areYouSure")}</Text>
                                        <Text color={"amber.900"} fontSize={"sm"} marginTop={1}>{i18n.t("accessCutOff")}</Text>
                                        <View flexDirection={"row"} marginTop={3}>
                                            <Button
                                                backgroundColor={"black"}
                                                borderRadius={8}
                                                isDisabled={resettingPassword}
                                                onPress={resetShareAccess}
                                            >
                                                {resettingPassword ? (
                                                    <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                                ) : (
                                                    <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("yesReset")}</Text>
                                                )}
                                            </Button>
                                            <Button marginLeft={2} onPress={() => setShowConfirmPasswordReset(false)} variant={"ghost"}>
                                                <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("no")}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                ) : (
                                    <Button
                                        alignSelf={"flex-start"}
                                        marginTop={3}
                                        onPress={() => setShowConfirmPasswordReset(true)}
                                        variant={"outline"}
                                    >
                                        <Text color={"gray.900"} fontWeight={"bold"}>{i18n.t("resetShareAccess")}</Text>
                                    </Button>
                                )}
                            </Section>

                            <Section
                                icon={<MaterialCommunityIcons name="monitor-eye" size={18} color={openScoreboardColor} />}
                                title={"Scorekeeper sessions"}
                                subtitle={"See scoring pages currently open for this table and send kiosk controls."}
                            >
                                <ScorekeeperSessionsPanel target={scorekeeperTarget} title={""} />
                            </Section>

                            <Section
                                icon={<FontAwesome5 name="users" size={15} color={openScoreboardColor} />}
                                title={"Player list"}
                                subtitle={"Choose which roster is available for this table and share self-registration if needed."}
                            >
                                {myPlayerLists.length > 0 ? (
                                    <>
                                        <FormControl>
                                            <FormControl.Label>{i18n.t("selectPlayerList")}</FormControl.Label>
                                            <Select
                                                backgroundColor={"white"}
                                                borderColor={"gray.300"}
                                                onValueChange={setSelectedPlayerList}
                                                selectedValue={playerListID}
                                            >
                                                {myPlayerLists.map((playerList) => (
                                                    <Select.Item key={playerList[1].id} label={playerList[1].playerListName} value={playerList[1].id} />
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {playerRegistrationURL ? (
                                            <FormControl marginTop={4}>
                                                <FormControl.Label>{i18n.t("selfPlayerRegistration")}</FormControl.Label>
                                                <Input
                                                    backgroundColor={"white"}
                                                    borderColor={"gray.300"}
                                                    color={"gray.900"}
                                                    isReadOnly
                                                    InputRightElement={<CopyInputRightButton text={playerRegistrationURL} />}
                                                    value={playerRegistrationURL}
                                                />
                                            </FormControl>
                                        ) : null}

                                        <Button
                                            alignSelf={"flex-start"}
                                            backgroundColor={"black"}
                                            borderRadius={8}
                                            isDisabled={!playerListID || savingPlayerList}
                                            marginTop={4}
                                            onPress={savePlayerList}
                                        >
                                            {savingPlayerList ? (
                                                <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                            ) : (
                                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("save")}</Text>
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <Text color={"gray.600"} fontSize={"sm"}>{i18n.t("noPlayerListsGoAdd")}</Text>
                                )}
                            </Section>

                            <Section
                                icon={<AntDesign name="calendar" size={18} color={openScoreboardColor} />}
                                title={"Schedule and history"}
                                subtitle={"Manage upcoming matches or review archived matches for this table."}
                            >
                                <View flexDirection={"row"} flexWrap={"wrap"}>
                                    <PageAction
                                        isPrimary
                                        icon={(color) => <AntDesign name="calendar" size={18} color={color} />}
                                        label={"Scheduling Manager"}
                                        onPress={() => {
                                            props.navigation.navigate("SchedulingManager", {
                                                sourceType: "table",
                                                sourceID: tableID,
                                                tableID,
                                                name: tableDisplayName,
                                                playerListID,
                                                sportName,
                                                scoringType,
                                            });
                                        }}
                                    />
                                    <PageAction
                                        icon={(color) => <MaterialCommunityIcons name="calendar-edit" size={18} color={color} />}
                                        label={"Manual schedule"}
                                        onPress={() => {
                                            props.navigation.navigate("ScheduledTableMatches", {
                                                tableID,
                                                name: tableDisplayName,
                                                sportName,
                                                scoringType,
                                            });
                                        }}
                                    />
                                    <PageAction
                                        icon={(color) => <FontAwesome5 name="history" size={18} color={color} />}
                                        label={"History"}
                                        onPress={() => {
                                            props.navigation.navigate("ArchivedMatchList", { tableID, name: tableDisplayName });
                                        }}
                                    />
                                </View>
                            </Section>

                            <Section
                                icon={<FontAwesome5 name="trash" size={14} color={"#B91C1C"} />}
                                title={i18n.t("deleteTable")}
                                subtitle={"Remove this table from your account. Archived data is not shown from this table after deletion."}
                                tone={"danger"}
                            >
                                {showDeleteTable ? (
                                    <View
                                        backgroundColor={"red.50"}
                                        borderColor={"red.200"}
                                        borderRadius={8}
                                        borderWidth={1}
                                        padding={3}
                                    >
                                        <Text color={"red.800"} fontSize={"sm"} fontWeight={"bold"}>{i18n.t("deleteTableAreSure")}</Text>
                                        <View flexDirection={"row"} marginTop={3}>
                                            <Button
                                                backgroundColor={"red.700"}
                                                borderRadius={8}
                                                isDisabled={!myTableID || loadingDeleteTable}
                                                onPress={removeTable}
                                            >
                                                {loadingDeleteTable ? (
                                                    <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                                ) : (
                                                    <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("yes")}</Text>
                                                )}
                                            </Button>
                                            <Button marginLeft={2} onPress={() => setShowDeleteTable(false)} variant={"ghost"}>
                                                <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("no")}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                ) : (
                                    <Button
                                        alignSelf={"flex-start"}
                                        borderColor={"red.200"}
                                        borderRadius={8}
                                        onPress={() => setShowDeleteTable(true)}
                                        variant={"outline"}
                                    >
                                        <Text color={"red.700"} fontWeight={"bold"}>{i18n.t("deleteTable")}</Text>
                                    </Button>
                                )}
                            </Section>
                        </>
                    )}
                </View>
            </ScrollView>
        </NativeBaseProvider>
    );
}
