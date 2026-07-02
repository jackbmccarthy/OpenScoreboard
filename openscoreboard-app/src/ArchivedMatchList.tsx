import React, { useEffect, useState } from 'react';
import { Button, NativeBaseProvider, ScrollView, Spinner, Text, View } from 'native-base';
import { getArchivedMatchesForTable, getArchivedMatchesForTeamMatch, getMatchData } from './functions/scoring';
import LoadingPage from './LoadingPage';
import { ArchivedMatchItem } from './listitems/ArchivedMatchItem';
import i18n from './translations/translate';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';
import { getTableName } from './functions/tables';
import { EmptyState, ListPageHeader, ListToolbar, PageScaffold } from './components/ListPage';

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
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                    >
                        <PageScaffold>
                            <ListPageHeader
                                description={"Review completed matches, game scores, match totals, and historical results for this scoring target."}
                                title={archiveTitle || i18n.t("archivedMatches")}
                            />
                            {archivedMatchList.length > 0 ? (
                                <>
                                    <ListToolbar
                                        countLabel={`Showing ${Math.min(visibleCount, filteredArchivedMatchList.length)} of ${filteredArchivedMatchList.length} archived match${filteredArchivedMatchList.length === 1 ? "" : "es"}.${isHydratingMatches ? " Loading scores..." : ""}`}
                                        onSearchChange={(text) => {
                                            setSearchText(text);
                                            setVisibleCount(PAGE_SIZE);
                                        }}
                                        searchPlaceholder={"Search by player name"}
                                        searchValue={searchText}
                                    />

                                    {visibleArchivedMatchList.length > 0 ? (
                                        <View
                                            flexDir={"row"}
                                            flexWrap={"wrap"}
                                            justifyContent={"space-between"}
                                            marginX={3}
                                            width={"auto"}
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
                                            marginX={3}
                                            padding={4}
                                        >
                                            <Spinner color={openScoreboardColor} size={"sm"} />
                                            <Text color={"gray.600"} fontSize={"sm"} marginLeft={2}>Loading scores</Text>
                                        </View>
                                    ) : (
                                        <EmptyState
                                            actionLabel={"Clear search"}
                                            description={"Try a different player name."}
                                            icon={"archive-search-outline"}
                                            onAction={() => setSearchText("")}
                                            title={"No matches found"}
                                        />
                                    )}

                                    {visibleCount < filteredArchivedMatchList.length ? (
                                        <View alignItems={"center"} marginTop={2}>
                                            <Button
                                                backgroundColor={openScoreboardColor}
                                                borderRadius={8}
                                                onPress={() => setVisibleCount((currentCount) => currentCount + PAGE_SIZE)}
                                            >
                                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Load More</Text>
                                            </Button>
                                        </View>
                                    ) : null}
                                </>
                            ) : (
                                <EmptyState
                                    description={"Completed matches for this table or team match will appear here after they are archived."}
                                    icon={"archive-outline"}
                                    title={i18n.t("noArchivedMatchesTable")}
                                />
                            )}
                        </PageScaffold>
                    </ScrollView>

                </View>


            </NativeBaseProvider>

        )
    }
    else {
        return <LoadingPage></LoadingPage>
    }

}
