import React, { useEffect, useState } from 'react';
import { Button, View, Modal, Text, Input, FormControl, Select, Spinner } from 'native-base';
import { getUserPath } from '../../database';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { updateDynamicURL } from '../functions/dynamicurls';
import { getMyTables } from '../functions/tables';
import getMyTeamMatches, { getTeamMatchCurrentMatches } from '../functions/teammatches';
import { getMyScoreboards } from '../functions/scoreboards';
import { isTeamScoreOnlyTeamMatch } from '../classes/TeamMatch';
import i18n from '../translations/translate';

const DYNAMIC_URL_TYPES = {
    TABLE: "table",
    TEAM_MATCH: "teamMatch",
};

function getInitialDynamicURLType(props) {
    return props.teammatchID && props.teammatchID.length > 0
        ? DYNAMIC_URL_TYPES.TEAM_MATCH
        : DYNAMIC_URL_TYPES.TABLE;
}

function FieldSection({ children, title, subtitle }) {
    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginBottom={3}
            padding={4}
        >
            <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>{title}</Text>
            {subtitle ? (
                <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{subtitle}</Text>
            ) : null}
            <View marginTop={3}>{children}</View>
        </View>
    );
}

export function EditDynamicURLModal(props) {
    let [tableList, setTableList] = useState([]);
    let [teamMatchList, setTeamMatchList] = useState([]);
    let [tableNumberList, setTableNumberList] = useState([]);

    let [dynamicURLType, setDynamicURLType] = useState(getInitialDynamicURLType(props));
    let [selectedTableNumber, setSelectedTableNumber] = useState("");
    let [selectedTeamMatchID, setSelectedTeamMatchID] = useState("");
    let [selectedTableID, setSelectedTableID] = useState("");
    let [selectedScoreboardID, setSelectedScoreboardID] = useState("")
    let [urlName, setURLName] = useState("");
    let [loadingNewURL, setLoadingNewURL] = useState(false);

    let [loadingScoreboards, setLoadingScoreboards] = useState(true)
    let [scoreboardList, setScoreboardList] = useState([])

    const isTableDynamicURL = dynamicURLType === DYNAMIC_URL_TYPES.TABLE;
    const selectedTeamMatch = teamMatchList.find((teamMatch: any) => teamMatch?.[1]?.id === selectedTeamMatchID)?.[1] || props || {};
    const isSelectedTeamScoreOnly = !isTableDynamicURL && isTeamScoreOnlyTeamMatch(selectedTeamMatch);
    const canSave = urlName.trim().length > 0 && (
        isTableDynamicURL
            ? selectedTableID.length > 0
            : selectedTeamMatchID.length > 0 && (isSelectedTeamScoreOnly || selectedTableNumber.length > 0)
    );

    useEffect(() => {
        const initialType = getInitialDynamicURLType(props);
        setDynamicURLType(initialType);
        setSelectedTableID(props.tableID || "");
        setSelectedTeamMatchID(props.teammatchID || "");
        setSelectedTableNumber(props.tableNumber || "");
        setSelectedScoreboardID(props.scoreboardID || "")
        setURLName(props.dynamicURLName || "");

        if (initialType === DYNAMIC_URL_TYPES.TEAM_MATCH && props.teammatchID && props.teammatchID.length > 0) {
            loadTableNumbersOnTeamMatch(props.teammatchID, props.tableNumber || "");
        }
    }, [props.id]);

    async function loadAllOptions() {
        let tableList = await getMyTables();
        setTableList(tableList);
        let myTeamMatches = await getMyTeamMatches(getUserPath());
        setTeamMatchList(myTeamMatches);
        await loadScoreboards()
    }

    async function loadScoreboards() {
        setLoadingScoreboards(true)
        let myScoreboards = await getMyScoreboards(getUserPath())
        setScoreboardList(myScoreboards)
        setLoadingScoreboards(false)
    }

    async function loadTableNumbersOnTeamMatch(teamMatchID, tableNumberToKeep = "") {
        setSelectedTableNumber(tableNumberToKeep);
        const selectedMatch = teamMatchList.find((teamMatch: any) => teamMatch?.[1]?.id === teamMatchID)?.[1] || props || {};
        if (isTeamScoreOnlyTeamMatch(selectedMatch)) {
            setSelectedTableNumber("");
            setTableNumberList([]);
            return;
        }

        let tableNumbers = await getTeamMatchCurrentMatches(teamMatchID);
        setTableNumberList(Object.keys(tableNumbers || {}).filter((tableNumber) => {
            const parsedTableNumber = parseInt(tableNumber, 10);
            return !Number.isNaN(parsedTableNumber) && parsedTableNumber > 0;
        }));
    }

    useEffect(() => {
        loadAllOptions();
    }, []);


    return (
        <Modal isOpen={props.isOpen} onClose={() => { props.onClose(); }}>
            <Modal.Content maxW={640} width={"92%"}>
                <Modal.CloseButton />
                <Modal.Header>{i18n.t("editDynamicURL")}</Modal.Header>
                <Modal.Body backgroundColor={"gray.50"}>
                    <FieldSection
                        title={"Dynamic URL"}
                        subtitle={"Edit the name and choose what kind of scoring target this link follows."}
                    >
                        <FormControl.Label>{i18n.t("dynamicURLName")}</FormControl.Label>
                        <Input
                            backgroundColor={"white"}
                            borderColor={"gray.300"}
                            value={urlName}
                            onChangeText={setURLName}
                        />

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
                        <FieldSection
                            title={"Table / Court"}
                            subtitle={"Choose the table or court this dynamic URL should point to."}
                        >
                            {tableList.length > 0 ?
                                <Select
                                    backgroundColor={"white"}
                                    borderColor={"gray.300"}
                                    selectedValue={selectedTableID}
                                    onValueChange={(value) => {
                                        setSelectedTableID(value);
                                    }}
                                >
                                    {tableList.map((table) => {
                                        return (
                                            <Select.Item key={table[0]} label={table[1].tableName} value={table[0]} />
                                        );
                                    })}
                                </Select>
                                :
                                <Text color={"gray.600"}>{i18n.t("noTablesCannotAssign")}</Text>}
                        </FieldSection>
                    ) : (
                        <FieldSection
                            title={i18n.t("teamMatch")}
                            subtitle={"Choose the team match this dynamic URL should point to. Structured team matches also need a table number."}
                        >
                            {teamMatchList.length > 0 ?
                                <Select
                                    backgroundColor={"white"}
                                    borderColor={"gray.300"}
                                    selectedValue={selectedTeamMatchID}
                                    onValueChange={(value) => {
                                        setSelectedTeamMatchID(value);
                                        loadTableNumbersOnTeamMatch(value);
                                    }}
                                >
                                    {teamMatchList.map((teammatch) => {
                                        return (
                                            <Select.Item key={teammatch[0]} label={`(${teammatch[1].startTime}) ${teammatch[1].teamAName} vs ${teammatch[1].teamBName}`} value={teammatch[1].id} />
                                        );
                                    })}
                                </Select>
                                :
                                <Text color={"gray.600"}>{i18n.t("noTeamMatchsCannotAssign")}</Text>}

                            {selectedTeamMatchID.length > 0 && isSelectedTeamScoreOnly ? (
                                <View
                                    backgroundColor={"blue.50"}
                                    borderColor={"blue.100"}
                                    borderRadius={8}
                                    borderWidth={1}
                                    marginTop={3}
                                    padding={3}
                                >
                                    <Text color={"blue.800"} fontSize={"sm"} fontWeight={"bold"}>
                                        Team score only selected. This dynamic URL will follow the team score without a table.
                                    </Text>
                                </View>
                            ) : null}

                            {selectedTeamMatchID.length > 0 && !isSelectedTeamScoreOnly ? (
                                <>
                                    <FormControl.Label marginTop={3}>{i18n.t("selectTableNumber")}</FormControl.Label>
                                    {tableNumberList.length > 0 ?
                                        <Select
                                            backgroundColor={"white"}
                                            borderColor={"gray.300"}
                                            selectedValue={selectedTableNumber}
                                            onValueChange={(value) => {
                                                setSelectedTableNumber(value);
                                            }}
                                        >
                                            {tableNumberList.map((tableNumber) => {
                                                return (
                                                    <Select.Item key={tableNumber} label={`Table ${tableNumber}`} value={tableNumber.toString()} />
                                                );
                                            })}
                                        </Select>
                                        :
                                        <Text color={"gray.600"}>{i18n.t("noTablesCannotAssign")}</Text>}
                                </>
                            ) : null}
                        </FieldSection>
                    )}

                    <FieldSection
                        title={i18n.t("selectScoreboard")}
                        subtitle={"Optionally choose a specific scoreboard layout for this dynamic URL."}
                    >
                        {scoreboardList.length > 0 ?
                            <Select
                                backgroundColor={"white"}
                                borderColor={"gray.300"}
                                selectedValue={selectedScoreboardID}
                                onValueChange={(value) => {
                                    setSelectedScoreboardID(value);
                                }}
                            >
                                <Select.Item label={"Default scoreboard"} value={""} />
                                {scoreboardList.map((scoreboard, index) => {
                                    return (
                                        <Select.Item key={index} label={scoreboard[1].name} value={scoreboard[1].id} />
                                    );
                                })}
                            </Select>
                            :
                            <>
                                {
                                    loadingScoreboards ?
                                        <Spinner color={openScoreboardColor} />
                                        :
                                        <Text color={"gray.600"}>{i18n.t("noScoreboardsCannotAssign")}</Text>

                                }
                            </>
                        }
                    </FieldSection>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        backgroundColor={"black"}
                        borderRadius={8}
                        isDisabled={!canSave || loadingNewURL}
                        onPress={async () => {
                            if (!canSave) {
                                return;
                            }

                            setLoadingNewURL(true);
                            await updateDynamicURL(
                                props.myID,
                                urlName.trim(),
                                isTableDynamicURL ? selectedTableID : "",
                                isTableDynamicURL ? "" : selectedTeamMatchID,
                                isTableDynamicURL || isSelectedTeamScoreOnly ? "" : selectedTableNumber,
                                selectedScoreboardID
                            );
                            props.onClose(true);
                            setLoadingNewURL(false);
                        }}
                    >
                        {loadingNewURL ?
                            <Spinner color={openScoreboardButtonTextColor} size={"sm"} /> :
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("save")}</Text>}

                    </Button>
                    <Button
                        marginLeft={2}
                        onPress={() => {
                            props.onClose();
                        }}
                        variant={"ghost"}
                    >
                        <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("close")}</Text>
                    </Button>

                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
