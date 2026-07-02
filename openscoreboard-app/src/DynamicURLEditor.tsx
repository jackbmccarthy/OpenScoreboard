import React, { useEffect, useState } from 'react';
import { Button, FormControl, Input, NativeBaseProvider, ScrollView, Select, Spinner, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserPath } from '../database';
import { scoreboardBaseURL } from '../openscoreboard.config';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';
import LoadingPage from './LoadingPage';
import { CopyInputRightButton } from './components/CopyButton';
import { ListPageHeader, PageScaffold } from './components/ListPage';
import { isTeamScoreOnlyTeamMatch } from './classes/TeamMatch';
import { getMyDynamicURLs, updateDynamicURL } from './functions/dynamicurls';
import { getMyScoreboards } from './functions/scoreboards';
import { getMyTables } from './functions/tables';
import getMyTeamMatches, { getTeamMatchCurrentMatches } from './functions/teammatches';
import i18n from './translations/translate';

const DYNAMIC_URL_TYPES = {
    TABLE: "table",
    TEAM_MATCH: "teamMatch",
};

function FieldSection({ children, title, subtitle }) {
    return (
        <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} margin={3} padding={4}>
            <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>{title}</Text>
            {subtitle ? (
                <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{subtitle}</Text>
            ) : null}
            <View marginTop={3}>{children}</View>
        </View>
    );
}

function getInitialDynamicURLType(dynamicURL) {
    return dynamicURL?.teammatchID && dynamicURL.teammatchID.length > 0
        ? DYNAMIC_URL_TYPES.TEAM_MATCH
        : DYNAMIC_URL_TYPES.TABLE;
}

function getTargetSummary(dynamicURL) {
    if (dynamicURL?.tableID) {
        return dynamicURL.tableName || "Table / Court";
    }

    if (dynamicURL?.teammatchID) {
        const teamMatchName = `${dynamicURL.teamAName || "Team A"} vs ${dynamicURL.teamBName || "Team B"}`;
        return dynamicURL.tableNumber ? `${teamMatchName} - Table ${dynamicURL.tableNumber}` : teamMatchName;
    }

    return "Unassigned";
}

export default function DynamicURLEditor(props) {
    const routeParams = props.route?.params || {};
    const [doneLoading, setDoneLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [myDynamicURLID, setMyDynamicURLID] = useState(routeParams.myDynamicURLID || "");
    const [dynamicURL, setDynamicURL] = useState<any>(null);
    const [dynamicURLType, setDynamicURLType] = useState(DYNAMIC_URL_TYPES.TABLE);
    const [selectedTableNumber, setSelectedTableNumber] = useState("");
    const [selectedTeamMatchID, setSelectedTeamMatchID] = useState("");
    const [selectedTableID, setSelectedTableID] = useState("");
    const [selectedScoreboardID, setSelectedScoreboardID] = useState("");
    const [tableList, setTableList] = useState([]);
    const [teamMatchList, setTeamMatchList] = useState([]);
    const [tableNumberList, setTableNumberList] = useState([]);
    const [scoreboardList, setScoreboardList] = useState([]);
    const [urlName, setURLName] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    const isTableDynamicURL = dynamicURLType === DYNAMIC_URL_TYPES.TABLE;
    const selectedTeamMatch = teamMatchList.find((teamMatch: any) => teamMatch?.[1]?.id === selectedTeamMatchID)?.[1] || dynamicURL || {};
    const isSelectedTeamScoreOnly = !isTableDynamicURL && isTeamScoreOnlyTeamMatch(selectedTeamMatch);
    const canSave = urlName.trim().length > 0 && (
        isTableDynamicURL
            ? selectedTableID.length > 0
            : selectedTeamMatchID.length > 0 && (isSelectedTeamScoreOnly || selectedTableNumber.length > 0)
    );
    const scoreboardURL = dynamicURL?.id ? `${scoreboardBaseURL}/scoreboard/?dynid=${dynamicURL.id}` : "";

    async function loadTableNumbersOnTeamMatch(teamMatchID, tableNumberToKeep = "") {
        setSelectedTableNumber(tableNumberToKeep);
        const selectedMatch = teamMatchList.find((teamMatch: any) => teamMatch?.[1]?.id === teamMatchID)?.[1] || dynamicURL || {};
        if (isTeamScoreOnlyTeamMatch(selectedMatch)) {
            setSelectedTableNumber("");
            setTableNumberList([]);
            return;
        }

        const tableNumbers = await getTeamMatchCurrentMatches(teamMatchID);
        setTableNumberList(Object.keys(tableNumbers || {}).filter((tableNumber) => {
            const parsedTableNumber = parseInt(tableNumber, 10);
            return !Number.isNaN(parsedTableNumber) && parsedTableNumber > 0;
        }));
    }

    async function loadPage() {
        setDoneLoading(false);
        const [dynamicURLs, tables, teamMatches, scoreboards] = await Promise.all([
            getMyDynamicURLs(true),
            getMyTables(),
            getMyTeamMatches(getUserPath()),
            getMyScoreboards(getUserPath()),
        ]);
        const dynamicURLEntry = dynamicURLs.find((entry) => {
            return entry?.[0] === routeParams.myDynamicURLID || entry?.[1]?.id === routeParams.dynamicURLID;
        });

        if (!dynamicURLEntry) {
            setNotFound(true);
            setDoneLoading(true);
            return;
        }

        const nextDynamicURL = dynamicURLEntry?.[1] || {};
        const nextType = getInitialDynamicURLType(nextDynamicURL);
        setNotFound(false);
        setMyDynamicURLID(dynamicURLEntry?.[0] || "");
        setDynamicURL(nextDynamicURL);
        setDynamicURLType(nextType);
        setSelectedTableID(nextDynamicURL.tableID || "");
        setSelectedTeamMatchID(nextDynamicURL.teammatchID || "");
        setSelectedTableNumber(nextDynamicURL.tableNumber || "");
        setSelectedScoreboardID(nextDynamicURL.scoreboardID || "");
        setURLName(nextDynamicURL.dynamicURLName || "");
        setTableList(tables);
        setTeamMatchList(teamMatches);
        setScoreboardList(scoreboards);

        if (nextType === DYNAMIC_URL_TYPES.TEAM_MATCH && nextDynamicURL.teammatchID) {
            const tableNumbers = await getTeamMatchCurrentMatches(nextDynamicURL.teammatchID);
            setTableNumberList(Object.keys(tableNumbers || {}).filter((tableNumber) => {
                const parsedTableNumber = parseInt(tableNumber, 10);
                return !Number.isNaN(parsedTableNumber) && parsedTableNumber > 0;
            }));
        }
        else {
            setTableNumberList([]);
        }

        setDoneLoading(true);
    }

    async function saveDynamicURL() {
        if (!canSave || !myDynamicURLID) {
            return;
        }

        setSaving(true);
        setSaveMessage("");
        try {
            await updateDynamicURL(
                myDynamicURLID,
                urlName.trim(),
                isTableDynamicURL ? selectedTableID : "",
                isTableDynamicURL ? "" : selectedTeamMatchID,
                isTableDynamicURL || isSelectedTeamScoreOnly ? "" : selectedTableNumber,
                selectedScoreboardID
            );
            setSaveMessage("Dynamic URL saved.");
            await loadPage();
        }
        finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        loadPage();
    }, [routeParams.myDynamicURLID, routeParams.dynamicURLID]);

    if (!doneLoading) {
        return <LoadingPage />;
    }

    if (notFound) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <PageScaffold>
                    <ListPageHeader
                        title={"Dynamic URL not found"}
                        description={"This dynamic URL could not be found under your account."}
                    />
                </PageScaffold>
            </NativeBaseProvider>
        );
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"} contentContainerStyle={{ paddingBottom: 36 }}>
                <PageScaffold>
                    <ListPageHeader
                        actionIcon={"content-save"}
                        actionLabel={"Save changes"}
                        description={"Manage where this stable scoreboard link points. The public URL stays the same."}
                        onAction={saveDynamicURL}
                        title={urlName || "Manage dynamic URL"}
                    />
                    {saveMessage ? (
                        <View backgroundColor={"green.50"} borderColor={"green.200"} borderRadius={8} borderWidth={1} marginX={3} marginBottom={2} padding={3}>
                            <Text color={"green.800"} fontWeight={"bold"}>{saveMessage}</Text>
                        </View>
                    ) : null}
                    <FieldSection title={"Stable display link"} subtitle={"Use this URL for your stream, TV, or shared display. Editing the target below will not change this link."}>
                        <FormControl.Label>{i18n.t("scoreboardURL")}</FormControl.Label>
                        <Input
                            backgroundColor={"white"}
                            color={"gray.900"}
                            isReadOnly
                            InputRightElement={<CopyInputRightButton text={scoreboardURL} />}
                            value={scoreboardURL}
                        />
                        <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                            <Button borderRadius={8} marginRight={2} marginTop={1} onPress={() => window.open(scoreboardURL, "_blank", "noopener,noreferrer")} variant={"outline"}>
                                <View alignItems={"center"} flexDirection={"row"}>
                                    <MaterialCommunityIcons name="open-in-new" size={16} color={openScoreboardColor} />
                                    <Text color={openScoreboardColor} fontWeight={"bold"} marginLeft={2}>Open display</Text>
                                </View>
                            </Button>
                        </View>
                    </FieldSection>
                    <FieldSection title={"Dynamic URL details"} subtitle={"Name the URL and choose whether it follows a normal table or a team match."}>
                        <FormControl.Label>{i18n.t("dynamicURLName")}</FormControl.Label>
                        <Input backgroundColor={"white"} borderColor={"gray.300"} value={urlName} onChangeText={setURLName} />
                        <FormControl.Label marginTop={3}>Dynamic URL Type</FormControl.Label>
                        <Select
                            backgroundColor={"white"}
                            borderColor={"gray.300"}
                            selectedValue={dynamicURLType}
                            onValueChange={(value) => {
                                setDynamicURLType(value);
                                setSelectedTableID("");
                                setSelectedTeamMatchID("");
                                setSelectedTableNumber("");
                                setTableNumberList([]);
                            }}
                        >
                            <Select.Item label={"Table / Court"} value={DYNAMIC_URL_TYPES.TABLE} />
                            <Select.Item label={i18n.t("teamMatch")} value={DYNAMIC_URL_TYPES.TEAM_MATCH} />
                        </Select>
                    </FieldSection>
                    {isTableDynamicURL ? (
                        <FieldSection title={"Table / Court"} subtitle={"Choose the table or court this dynamic URL should follow."}>
                            {tableList.length > 0 ? (
                                <Select
                                    backgroundColor={"white"}
                                    borderColor={"gray.300"}
                                    selectedValue={selectedTableID}
                                    onValueChange={setSelectedTableID}
                                >
                                    {tableList.map((table) => (
                                        <Select.Item key={table[0]} label={table[1].tableName} value={table[0]} />
                                    ))}
                                </Select>
                            ) : (
                                <Text color={"gray.600"}>{i18n.t("noTablesCannotAssign")}</Text>
                            )}
                        </FieldSection>
                    ) : (
                        <FieldSection title={i18n.t("teamMatch")} subtitle={"Choose the team match this dynamic URL should follow. Structured team matches also need a table number."}>
                            {teamMatchList.length > 0 ? (
                                <Select
                                    backgroundColor={"white"}
                                    borderColor={"gray.300"}
                                    selectedValue={selectedTeamMatchID}
                                    onValueChange={(value) => {
                                        setSelectedTeamMatchID(value);
                                        loadTableNumbersOnTeamMatch(value);
                                    }}
                                >
                                    {teamMatchList.map((teammatch) => (
                                        <Select.Item key={teammatch[0]} label={`(${teammatch[1].startTime}) ${teammatch[1].teamAName} vs ${teammatch[1].teamBName}`} value={teammatch[1].id} />
                                    ))}
                                </Select>
                            ) : (
                                <Text color={"gray.600"}>{i18n.t("noTeamMatchsCannotAssign")}</Text>
                            )}
                            {selectedTeamMatchID.length > 0 && !isSelectedTeamScoreOnly ? (
                                <>
                                    <FormControl.Label marginTop={3}>{i18n.t("selectTableNumber")}</FormControl.Label>
                                    {tableNumberList.length > 0 ? (
                                        <Select backgroundColor={"white"} borderColor={"gray.300"} selectedValue={selectedTableNumber} onValueChange={setSelectedTableNumber}>
                                            {tableNumberList.map((tableNumber) => (
                                                <Select.Item key={tableNumber} label={`Table ${tableNumber}`} value={tableNumber.toString()} />
                                            ))}
                                        </Select>
                                    ) : (
                                        <Text color={"gray.600"}>{i18n.t("noTablesCannotAssign")}</Text>
                                    )}
                                </>
                            ) : null}
                            {selectedTeamMatchID.length > 0 && isSelectedTeamScoreOnly ? (
                                <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} marginTop={3} padding={3}>
                                    <Text color={"blue.800"} fontSize={"sm"} fontWeight={"bold"}>
                                        Team score only selected. This URL follows the team score without a table.
                                    </Text>
                                </View>
                            ) : null}
                        </FieldSection>
                    )}
                    <FieldSection title={i18n.t("selectScoreboard")} subtitle={"Optionally choose the scoreboard layout this dynamic URL should use."}>
                        {scoreboardList.length > 0 ? (
                            <Select backgroundColor={"white"} borderColor={"gray.300"} selectedValue={selectedScoreboardID} onValueChange={setSelectedScoreboardID}>
                                <Select.Item label={"Default scoreboard"} value={""} />
                                {scoreboardList.map((scoreboard, index) => (
                                    <Select.Item key={index} label={scoreboard[1].name} value={scoreboard[1].id} />
                                ))}
                            </Select>
                        ) : (
                            <Text color={"gray.600"}>{i18n.t("noScoreboardsCannotAssign")}</Text>
                        )}
                    </FieldSection>
                    <View marginX={3} marginTop={1}>
                        <Button backgroundColor={openScoreboardColor} borderRadius={8} isDisabled={!canSave || saving} onPress={saveDynamicURL}>
                            {saving ? (
                                <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                            ) : (
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("save")}</Text>
                            )}
                        </Button>
                        <Text color={"gray.500"} fontSize={"xs"} marginTop={2}>
                            Current target: {getTargetSummary(dynamicURL)}
                        </Text>
                    </View>
                </PageScaffold>
            </ScrollView>
        </NativeBaseProvider>
    );
}
