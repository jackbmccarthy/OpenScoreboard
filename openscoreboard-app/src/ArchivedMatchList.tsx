import React, { useEffect, useState } from 'react';
import { Button, Input, NativeBaseProvider, ScrollView, Spinner, Text, View } from 'native-base';
import { getArchivedMatchesForTable, getArchivedMatchesForTeamMatch, getMatchData } from './functions/scoring';
import LoadingPage from './LoadingPage';
import { ArchivedMatchItem } from './listitems/ArchivedMatchItem';
import i18n from './translations/translate';
import { openScoreboardTheme } from '../openscoreboardtheme';
import { getTableName } from './functions/tables';

const PAGE_SIZE = 12;

function getGameScoresFromMatch(match = {}) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9]
        .filter((gameNumber) => match[`isGame${gameNumber}Started`] || match[`isGame${gameNumber}Finished`])
        .map((gameNumber) => ({
            gameNumber,
            a: match[`game${gameNumber}AScore`] ?? 0,
            b: match[`game${gameNumber}BScore`] ?? 0,
        }));
}

async function hydrateArchivedMatches(matches) {
    return Promise.all(matches.map(async ([id, matchSummary]) => {
        if (!matchSummary?.matchID) {
            return [id, { ...matchSummary, gameScores: [] }];
        }

        try {
            const match = await getMatchData(matchSummary.matchID);

            return [id, {
                ...matchSummary,
                gameScores: getGameScoresFromMatch(match),
                startTime: matchSummary?.startTime || match?.matchStartTime,
            }];
        }
        catch (err) {
            console.error(err);
            return [id, { ...matchSummary, gameScores: [] }];
        }
    }));
}

function getArchiveTimestamp(matchSummary) {
    const date = new Date(matchSummary?.archivedOn || matchSummary?.startTime || 0);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function sortArchivedMatches(matches) {
    return [...matches].sort((a, b) => getArchiveTimestamp(b[1]) - getArchiveTimestamp(a[1]));
}

function matchesSearch(matchSummary, searchText) {
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
        return true;
    }

    return [matchSummary?.playerA, matchSummary?.playerB]
        .filter(Boolean)
        .some((playerName) => String(playerName).toLowerCase().includes(normalizedSearch));
}

export default function ArchivedMatchList(props) {

    let [archivedMatchList, setArchivedMatchList] = useState([])
    let [visibleArchivedMatchList, setVisibleArchivedMatchList] = useState([])
    let [doneLoadingMatchList, setDoneLoadingMatchList] = useState(false)
    let [isHydratingMatches, setIsHydratingMatches] = useState(false)
    let [searchText, setSearchText] = useState("")
    let [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    let [archiveTitle, setArchiveTitle] = useState(props.route.params.name || "")

    async function loadArchivedMatches() {
        setDoneLoadingMatchList(false)
        if (!props.route.params.name) {
            const tableName = await getTableName(props.route.params.tableID);
            setArchiveTitle(tableName || "");
        }
        let matches = await getArchivedMatchesForTable(props.route.params.tableID)
        setArchivedMatchList(sortArchivedMatches(matches))
        setDoneLoadingMatchList(true)

    }

    async function loadArchivedTeamMatches() {
        setDoneLoadingMatchList(false)
        setArchiveTitle(props.route.params.name || "Team Match")
        let matches = await getArchivedMatchesForTeamMatch(props.route.params.teamMatchID)
        setArchivedMatchList(sortArchivedMatches(matches))
        setDoneLoadingMatchList(true)
    }

    useEffect(() => {
        if (props.route.params.tableID) {
            loadArchivedMatches()
        }
        else if (props.route.params.teamMatchID) {
            loadArchivedTeamMatches()
        }

    }, [])

    const filteredArchivedMatchList = archivedMatchList.filter((match) => matchesSearch(match[1], searchText));
    const visibleMatchesToHydrate = filteredArchivedMatchList.slice(0, visibleCount);

    useEffect(() => {
        let isCurrent = true;

        async function hydrateVisibleMatches() {
            setIsHydratingMatches(true);
            const hydratedMatches = await hydrateArchivedMatches(visibleMatchesToHydrate);

            if (isCurrent) {
                setVisibleArchivedMatchList(hydratedMatches);
                setIsHydratingMatches(false);
            }
        }

        if (doneLoadingMatchList) {
            hydrateVisibleMatches();
        }

        return () => {
            isCurrent = false;
        };
    }, [doneLoadingMatchList, archivedMatchList, searchText, visibleCount])

    if (doneLoadingMatchList) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View width={"100%"} height={"100%"}>
                    <ScrollView
                        backgroundColor={"gray.50"}
                        flex={1}
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingTop: 12 }}
                    >
                        {archivedMatchList.length > 0 ? (
                            <View alignSelf={"center"} maxW={1180} paddingX={3} width={"100%"}>
                                <View marginBottom={3}>
                                    <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>
                                        {archiveTitle || i18n.t("archivedMatches")}
                                    </Text>
                                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                        {i18n.t("archivedMatches")}
                                    </Text>
                                </View>
                                <View
                                    backgroundColor={"white"}
                                    borderColor={"gray.200"}
                                    borderRadius={8}
                                    borderWidth={1}
                                    marginBottom={3}
                                    padding={3}
                                >
                                    <Input
                                        backgroundColor={"white"}
                                        borderColor={"gray.300"}
                                        color={"gray.900"}
                                        placeholder={"Search by player name"}
                                        placeholderTextColor={"#6B7280"}
                                        value={searchText}
                                        onChangeText={(text) => {
                                            setSearchText(text);
                                            setVisibleCount(PAGE_SIZE);
                                        }}
                                    />
                                    <View alignItems={"center"} flexDir={"row"} justifyContent={"space-between"} marginTop={2}>
                                        <Text color={"gray.600"} fontSize={"xs"} fontWeight={"medium"}>
                                            Showing {Math.min(visibleCount, filteredArchivedMatchList.length)} of {filteredArchivedMatchList.length}
                                        </Text>
                                        {isHydratingMatches ? (
                                            <View alignItems={"center"} flexDir={"row"}>
                                                <Spinner color={openScoreboardTheme.colors.primary[600]} size={"sm"} />
                                                <Text color={"gray.500"} fontSize={"xs"} marginLeft={2}>Loading scores</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>

                                {visibleArchivedMatchList.length > 0 ? (
                                    <View
                                        flexDir={"row"}
                                        flexWrap={"wrap"}
                                        justifyContent={"space-between"}
                                        width={"100%"}
                                    >
                                        {visibleArchivedMatchList.map((match, index) => (
                                            <ArchivedMatchItem key={match[0]} index={index} item={match} />
                                        ))}
                                    </View>
                                ) : isHydratingMatches ? (
                                    <View
                                        alignItems={"center"}
                                        backgroundColor={"white"}
                                        borderColor={"gray.200"}
                                        borderRadius={8}
                                        borderWidth={1}
                                        flexDir={"row"}
                                        justifyContent={"center"}
                                        padding={4}
                                    >
                                        <Spinner color={openScoreboardTheme.colors.primary[600]} size={"sm"} />
                                        <Text color={"gray.600"} fontSize={"sm"} marginLeft={2}>Loading scores</Text>
                                    </View>
                                ) : (
                                    <View
                                        backgroundColor={"white"}
                                        borderColor={"gray.200"}
                                        borderRadius={8}
                                        borderWidth={1}
                                        padding={4}
                                    >
                                        <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>No matches found</Text>
                                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>Try a different player name.</Text>
                                    </View>
                                )}

                                {visibleCount < filteredArchivedMatchList.length ? (
                                    <View alignItems={"center"} marginTop={2}>
                                        <Button
                                            backgroundColor={"black"}
                                            borderRadius={8}
                                            onPress={() => setVisibleCount((currentCount) => currentCount + PAGE_SIZE)}
                                        >
                                            <Text color={"white"} fontWeight={"bold"}>Load More</Text>
                                        </Button>
                                    </View>
                                ) : null}
                            </View>
                        ) : (
                            <View flex={1} justifyContent={"center"} alignItems="center" padding={4}>
                                <View
                                    backgroundColor={"white"}
                                    borderColor={"gray.200"}
                                    borderRadius={8}
                                    borderWidth={1}
                                    padding={4}
                                    width={"100%"}
                                    maxW={420}
                                >
                                    <Text color={"gray.900"} fontSize={"xl"} fontWeight="bold">{i18n.t("noArchivedMatchesTable")}</Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                </View>


            </NativeBaseProvider>

        )
    }
    else {
        return <LoadingPage></LoadingPage>
    }

}
