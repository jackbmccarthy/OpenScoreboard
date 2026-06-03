import React, { useEffect, useState } from 'react';
import { AddIcon, Button, Modal, Spinner, Text, View } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addTeamMatchCurrentMatch, getTeamMatchCurrentMatches } from '../functions/teammatches';
import i18n from '../translations/translate';

function getSortedTables(tableList = {}) {
    return Object.keys(tableList || {})
        .filter((tableNumber) => {
            const parsedTableNumber = parseInt(tableNumber, 10);
            return !Number.isNaN(parsedTableNumber) && parsedTableNumber > 0;
        })
        .sort((a, b) => {
            return parseInt(a, 10) > parseInt(b, 10) ? 1 : -1;
        });
}

function getNextTableNumber(tableList = {}) {
    const tableNumbers = Object.keys(tableList || {})
        .filter((tableNumber) => {
            const parsedTableNumber = parseInt(tableNumber, 10);
            return !Number.isNaN(parsedTableNumber) && parsedTableNumber > 0;
        })
        .map((tableNumber) => parseInt(tableNumber, 10));

    return (tableNumbers.length > 0 ? Math.max(...tableNumbers) + 1 : 1).toString();
}

function TableAction({ icon, label, onPress, isPrimary = false }) {
    return (
        <Button
            backgroundColor={isPrimary ? openScoreboardColor : "white"}
            borderColor={isPrimary ? openScoreboardColor : "blue.100"}
            borderRadius={8}
            borderWidth={1}
            marginLeft={2}
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

function TeamMatchTableRow({ onLinks, onScore, tableNumber }) {
    return (
        <View
            alignItems={"center"}
            backgroundColor={"gray.50"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            flexDirection={"row"}
            flexWrap={"wrap"}
            justifyContent={"space-between"}
            marginTop={3}
            padding={3}
        >
            <View flex={1} minWidth={140} paddingRight={2}>
                <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>Table {tableNumber}</Text>
                <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>Choose scoring or scoreboard links.</Text>
            </View>
            <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"flex-end"}>
                <TableAction
                    isPrimary
                    icon={(color) => <MaterialCommunityIcons name="scoreboard-outline" size={20} color={color} />}
                    label={"Scoring"}
                    onPress={onScore}
                />
                <TableAction
                    icon={(color) => <MaterialCommunityIcons name="share-outline" size={19} color={color} />}
                    label={"Links"}
                    onPress={onLinks}
                />
            </View>
        </View>
    );
}

export function SelectTeamMatchTableModal(props) {
    let [doneLoading, setDoneLoading] = useState(false);
    let [loadingNewTable, setLoadingNewTable] = useState(false);
    let [tableList, setTableList] = useState({});

    async function loadCurrentTeamMatches(teamMatchID) {
        setDoneLoading(false);
        let tables = await getTeamMatchCurrentMatches(teamMatchID);
        setTableList(tables || {});
        setDoneLoading(true);
    }

    useEffect(() => {
        if (props.teamMatchID && props.teamMatchID.length) {
            loadCurrentTeamMatches(props.teamMatchID);
        }
    }, [props.teamMatchID]);

    const addTable = async () => {
        const nextTableNumber = getNextTableNumber(tableList);
        setLoadingNewTable(true);

        try {
            await addTeamMatchCurrentMatch(props.teamMatchID, nextTableNumber);
            setTableList({ ...(tableList || {}), [nextTableNumber]: "" });
        }
        finally {
            setLoadingNewTable(false);
        }
    };

    const tableNumbers = getSortedTables(tableList);

    return (
        <Modal
            isOpen={props.isOpen}
            onClose={() => {
                props.onClose(false);
            }}
        >
            <Modal.Content maxWidth={560}>
                <Modal.CloseButton />
                <Modal.Header>{i18n.t("selectTable")}</Modal.Header>
                <Modal.Body>
                    <Text color={"gray.600"} fontSize={"sm"}>
                        Select a table for live scoring or scoreboard links.
                    </Text>

                    {doneLoading ? (
                        <>
                            {tableNumbers.length > 0 ? tableNumbers.map((tableNumber) => (
                                <TeamMatchTableRow
                                    key={tableNumber}
                                    tableNumber={tableNumber}
                                    onScore={() => {
                                        props.goToKeepScore(props.teamMatchID, tableNumber, props.sportName, props.scoringType);
                                    }}
                                    onLinks={() => {
                                        props.onClose(false);
                                        props.openTeamMatchLink(props.teamMatchID, tableNumber, props.sportName, props.scoringType);
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

                            <Button
                                backgroundColor={openScoreboardColor}
                                borderRadius={8}
                                isDisabled={loadingNewTable}
                                marginTop={4}
                                onPress={addTable}
                                width={"100%"}
                            >
                                {loadingNewTable ? (
                                    <Spinner color={openScoreboardButtonTextColor} />
                                ) : (
                                    <View alignItems={"center"} flexDirection={"row"}>
                                        <AddIcon color={openScoreboardButtonTextColor} />
                                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"} marginLeft={2}>
                                            Add table
                                        </Text>
                                    </View>
                                )}
                            </Button>
                        </>
                    ) : (
                        <View alignItems={"center"} padding={6}>
                            <Spinner color={openScoreboardColor} />
                            <Text color={"gray.600"} fontSize={"sm"} marginTop={2}>Loading tables</Text>
                        </View>
                    )}
                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
