import React, { useEffect, useRef, useState } from 'react';
import { Button, Image, NativeBaseProvider, Pressable, ScrollView, Spinner, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openBrowserAsync } from 'expo-web-browser';
import db, { getUserPath } from '../database';
import { openScoreboardColor, openScoreboardTheme } from "../openscoreboardtheme";
import { getAppNavigationSections } from './navigationSections';
import getMyTeamMatches from './functions/teammatches';
import { getMyPlayerLists } from './functions/players';
import { getMyTeams } from './functions/teams';
import { getCompetitionSportLabel, getMyCompetitions } from './functions/competitions';
import { getMyScoreboards } from './functions/scoreboards';
import { getMyDynamicURLs } from './functions/dynamicurls';
import { getMyDynamicBracketGroupDisplays } from './functions/dynamicBracketGroups';
import { compareByCreatedDesc } from './functions/listSorting';

const ARTICLE_API_URL = "https://openscoreboard.com/wp-json/wp/v2/posts?per_page=3&_embed=1";
const OPEN_SCOREBOARD_ARTICLES_URL = "https://openscoreboard.com";
const PREVIEW_LIMIT = 3;

const documentationByRoute = {
    DynamicURLS: "dynamic-urls",
    MyAccount: "getting-started",
    MyBracketGroupStyles: "bracket-group-displays",
    MyCompetitions: "competitions",
    MyPlayerLists: "player-lists",
    MyScoreboards: "scoreboards",
    MyTables: "tables-scoring",
    MyTeamMatches: "team-matches",
    MyTeams: "teams",
    Tutorials: "getting-started",
};

function cleanHtml(value = "") {
    return value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
}

function getFeaturedImageUrl(post) {
    const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0];

    return featuredMedia?.media_details?.sizes?.medium?.source_url
        || featuredMedia?.media_details?.sizes?.thumbnail?.source_url
        || featuredMedia?.source_url
        || "";
}

function getRecentEntries(entries = []) {
    return [...entries].sort(compareByCreatedDesc).slice(0, PREVIEW_LIMIT);
}

function formatDate(value) {
    const parsedDate = Date.parse(value || "");
    return Number.isNaN(parsedDate) ? "" : new Date(parsedDate).toLocaleDateString();
}

function getCompetitionTypeLabel(type) {
    switch (type) {
        case "roundRobin":
            return "Round robin";
        case "roundRobinThenSingleElimination":
            return "Groups + bracket";
        case "singleElimination":
            return "Single elimination";
        default:
            return "Competition";
    }
}

function getScoreboardTypeLabel(type = "") {
    return type
        ? `${type}`.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()).trim()
        : "Scoreboard";
}

function toPreviewEntry(entry, mapRecord) {
    const id = entry?.[0] || entry?.[1]?.id || `${Date.now()}-${Math.random()}`;

    return {
        id,
        ...mapRecord(entry?.[1] || {}, entry?.[0]),
    };
}

function getScoreboardEditorURL(scoreboardID) {
    const editorPath = `/editor/?t=editor&sid=${scoreboardID}`;

    if (process.env.NODE_ENV === "production" || typeof window === "undefined") {
        return editorPath;
    }

    return window.location.origin.replace(window.location.port, "3002") + editorPath;
}

function getFirstTeamMatchTableNumber(currentMatches = {}) {
    return Object.keys(currentMatches || {})
        .filter((tableNumber) => {
            const parsedTableNumber = parseInt(tableNumber, 10);
            return !Number.isNaN(parsedTableNumber) && parsedTableNumber > 0;
        })
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))[0] || "";
}

async function getTablePreviewEntries() {
    const myTablesSnapshot = await db.ref(`users/${getUserPath()}/myTables`).get();
    const myTables = Object.entries(myTablesSnapshot.val() || {});
    const tableEntries = await Promise.all(myTables.map(async ([myTableID, tableID]: any) => {
        const tableSnapshot = await db.ref(`tables/${tableID}`).get();
        const table = tableSnapshot.val() || {};

        return [myTableID, {
            ...table,
            id: tableID,
        }];
    }));

    return getRecentEntries(tableEntries).map((entry) => toPreviewEntry(entry, (table, myTableID) => ({
        actionParams: {
            myTableID,
            name: table.tableName,
            scoringType: table.scoringType,
            sportName: table.sportName,
            tableID: table.id,
        },
        actionRoute: "TableEditor",
        icon: table.tableMode === "kiosk" ? "monitor-lock" : "table-tennis",
        meta: table.tableMode === "kiosk" ? "Kiosk" : "Standard",
        quickActions: [
            {
                icon: table.tableMode === "kiosk" ? "monitor-lock" : "scoreboard-outline",
                label: table.tableMode === "kiosk" ? "Kiosk" : "Score",
                route: "TableScoring",
                params: {
                    tableID: table.id,
                    name: table.tableName,
                    password: table.password,
                    sportName: table.sportName || "tableTennis",
                    scoringType: table.scoringType || null,
                    ownerID: getUserPath() || "",
                },
            },
        ],
        subtitle: table.currentMatch ? "Current match active" : `${table.sportName || "Table tennis"} scoring`,
        title: table.tableName || "Untitled table",
    })));
}

const previewLoaders = {
    MyTables: getTablePreviewEntries,
    MyTeamMatches: async () => getRecentEntries(await getMyTeamMatches(getUserPath())).map((entry) => toPreviewEntry(entry, (teamMatch, myTeamMatchID) => {
        const isScoreOnly = teamMatch.teamMatchMode === "teamScoreOnly";
        const firstTableNumber = getFirstTeamMatchTableNumber(teamMatch.currentMatches || {});
        const quickActions = isScoreOnly ? [
            {
                icon: "counter",
                label: "Score",
                route: "TeamMatchEditor",
                params: {
                    myTeamMatchID,
                    teamMatchID: teamMatch.id,
                },
            },
        ] : firstTableNumber ? [
            {
                icon: "scoreboard-outline",
                label: `Score T${firstTableNumber}`,
                route: "TeamMatchScoring",
                params: {
                    isTeamMatch: true,
                    teamMatchID: teamMatch.id,
                    tableNumber: firstTableNumber,
                    name: `Table ${firstTableNumber}`,
                    sportName: teamMatch.sportName,
                    scoringType: teamMatch.scoringType,
                    ownerID: getUserPath() || "",
                },
            },
        ] : [];

        return {
            actionParams: {
                myTeamMatchID,
                teamMatchID: teamMatch.id,
            },
            actionRoute: "TeamMatchEditor",
            icon: isScoreOnly ? "counter" : "account-group-outline",
            meta: isScoreOnly ? "Score only" : "Team match",
            quickActions,
            subtitle: teamMatch.startTime ? formatDate(teamMatch.startTime) : teamMatch.sportDisplayName || teamMatch.sportName || "Team event",
            title: `${teamMatch.teamAName || "Team A"} vs ${teamMatch.teamBName || "Team B"}`,
        };
    })),
    MyPlayerLists: async () => getRecentEntries(await getMyPlayerLists()).map((entry) => toPreviewEntry(entry, (playerList) => ({
        actionParams: {
            playerListID: playerList.id,
        },
        actionRoute: "AddPlayers",
        icon: "account-multiple-outline",
        meta: `${Number(playerList.playerCount || 0)} players`,
        subtitle: playerList.modifiedOn ? `Updated ${formatDate(playerList.modifiedOn)}` : "Reusable player data",
        title: playerList.playerListName || "Untitled player list",
    }))),
    MyTeams: async () => getRecentEntries(await getMyTeams(getUserPath())).map((entry) => toPreviewEntry(entry, (team, myTeamID) => ({
        actionParams: {
            myTeamID,
            teamID: team.id,
        },
        actionRoute: "TeamEditor",
        icon: "account-group-outline",
        meta: `${Object.keys(team.players || {}).length} players`,
        subtitle: team.teamJerseyColor ? "Team color configured" : "Roster and team details",
        title: team.name || team.teamName || "Untitled team",
    }))),
    MyCompetitions: async () => getRecentEntries(await getMyCompetitions(getUserPath())).map((entry) => toPreviewEntry(entry, (competition) => ({
        actionParams: {
            competitionID: competition.id,
        },
        actionRoute: "CompetitionEditor",
        icon: competition.participantType === "team" ? "account-switch-outline" : "tournament",
        meta: competition.participantType === "team" ? "Teams" : "Players",
        subtitle: `${getCompetitionTypeLabel(competition.type)} / ${getCompetitionSportLabel(competition.sportName || "tableTennis")}`,
        title: competition.title || competition.data?.title || "Untitled competition",
    }))),
    MyScoreboards: async () => getRecentEntries(await getMyScoreboards(getUserPath())).map((entry) => toPreviewEntry(entry, (scoreboard) => ({
        icon: "monitor-dashboard",
        meta: getScoreboardTypeLabel(scoreboard.type),
        openURL: scoreboard.id ? getScoreboardEditorURL(scoreboard.id) : "",
        subtitle: scoreboard.createdOn ? `Created ${formatDate(scoreboard.createdOn)}` : "Live graphic display",
        title: scoreboard.name || "Untitled scoreboard",
    }))),
    DynamicURLS: async () => getRecentEntries(await getMyDynamicURLs(true)).map((entry) => toPreviewEntry(entry, (dynamicURL, myDynamicURLID) => ({
        actionParams: {
            dynamicURLID: dynamicURL.id,
            myDynamicURLID,
        },
        actionRoute: "DynamicURLEditor",
        icon: "link-variant",
        meta: dynamicURL.tableID ? "Table" : dynamicURL.teammatchID ? "Team match" : "Unassigned",
        subtitle: dynamicURL.tableName || dynamicURL.scoreboardName || [dynamicURL.teamAName, dynamicURL.teamBName].filter(Boolean).join(" vs ") || "Manage stable display URL",
        title: dynamicURL.dynamicURLName || "Untitled dynamic URL",
    }))),
    MyBracketGroupStyles: async () => {
        const displays = await getMyDynamicBracketGroupDisplays(getUserPath());

        return getRecentEntries(displays).map((entry) => toPreviewEntry(entry, (display, myDisplayID) => ({
            actionParams: {
                displayID: display.id,
                myDisplayID,
            },
            actionRoute: "DynamicBracketGroupDisplayEditor",
            icon: "chart-tree",
            meta: display.displayType === "roundRobin" ? "Group display" : "Bracket display",
            subtitle: display.competitionTitle || display.displayType || "Manage dynamic display URL",
            title: display.title || "Untitled dynamic display",
        })));
    },
    MyAccount: async () => ([
        {
            icon: "account-circle-outline",
            id: "account-settings",
            meta: "Account",
            actionRoute: "MyAccount",
            subtitle: "Profile, sign out, and account options.",
            title: "Account settings",
        },
    ]),
    Tutorials: async () => ([
        {
            icon: "book-open-page-variant-outline",
            id: "documentation-home",
            meta: "Help",
            actionRoute: "Tutorials",
            subtitle: "Feature guides, workflows, and setup notes.",
            title: "Documentation home",
        },
    ]),
};

function ArticleCarousel() {
    const [articles, setArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        fetch(ARTICLE_API_URL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Unable to load articles");
                }
                return response.json();
            })
            .then((posts) => {
                if (!isMounted) {
                    return;
                }
                setArticles(posts.map((post) => ({
                    id: post.id,
                    title: cleanHtml(post.title?.rendered),
                    excerpt: cleanHtml(post.excerpt?.rendered),
                    link: post.link,
                    date: post.date ? new Date(post.date).toLocaleDateString() : "",
                    imageUrl: getFeaturedImageUrl(post),
                })));
                setHasError(false);
            })
            .catch(() => {
                if (isMounted) {
                    setHasError(true);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <View alignSelf={"center"} maxW={1180} marginTop={4} paddingX={4} width={"100%"}>
            <View alignItems={{ base: "flex-start", md: "center" }} flexDirection={{ base: "column", md: "row" }} justifyContent={"space-between"} marginBottom={3}>
                <View flex={1} paddingRight={{ base: 0, md: 4 }}>
                    <Text fontSize={"xl"} fontWeight={"bold"} color={"gray.900"}>Latest from Open Scoreboard</Text>
                    <Text fontSize={"sm"} color={"gray.600"} marginTop={1}>Recent articles, release notes, and practical setup notes.</Text>
                </View>
                <Button marginTop={{ base: 3, md: 0 }} borderRadius={8} onPress={() => openBrowserAsync(OPEN_SCOREBOARD_ARTICLES_URL)} size={"sm"} variant={"outline"}>
                    <Text color={openScoreboardColor} fontWeight={"bold"}>See more</Text>
                </Button>
            </View>
            {isLoading ? (
                <View padding={6} alignItems={"center"} backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1}>
                    <Spinner color={openScoreboardColor} />
                </View>
            ) : hasError ? (
                <View padding={4} backgroundColor={"gray.100"} borderRadius={8}>
                    <Text color={"gray.600"}>Articles are not available right now.</Text>
                </View>
            ) : (
                <View
                    backgroundColor={"white"}
                    borderColor={"gray.200"}
                    borderRadius={8}
                    borderWidth={1}
                    overflow={"hidden"}
                >
                    {articles.map((article) => (
                        <Pressable
                            key={article.id}
                            alignItems={"center"}
                            borderColor={"gray.100"}
                            borderTopWidth={article.id === articles[0]?.id ? 0 : 1}
                            flexDirection={"row"}
                            padding={4}
                            _hover={{ backgroundColor: "gray.50" }}
                            onPress={() => openBrowserAsync(article.link)}
                        >
                            {article.imageUrl ? (
                                <Image
                                    source={{ uri: article.imageUrl }}
                                    alt={article.title}
                                    width={78}
                                    height={54}
                                    borderRadius={8}
                                    marginRight={3}
                                    resizeMode={"cover"}
                                />
                            ) : null}
                            <View flex={1} minWidth={0}>
                                <Text fontSize={"xs"} color={"blue.700"} fontWeight={"semibold"}>{article.date}</Text>
                                <Text fontSize={"md"} color={"gray.900"} fontWeight={"bold"} marginTop={1} numberOfLines={1}>{article.title}</Text>
                                <Text fontSize={"sm"} color={"gray.600"} marginTop={1} numberOfLines={2}>{article.excerpt}</Text>
                            </View>
                            <MaterialCommunityIcons name="open-in-new" size={18} color={openScoreboardColor} />
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

function PreviewRow({ entry, fallbackRoute, navigation }) {
    const hasExternalURL = Boolean(entry.openURL);
    const actionRoute = entry.actionRoute || fallbackRoute;
    const quickActions = entry.quickActions || [];
    const canOpen = hasExternalURL || Boolean(actionRoute);

    const openEntry = () => {
        if (entry.openURL) {
            openBrowserAsync(entry.openURL);
            return;
        }

        if (actionRoute) {
            navigation.navigate(actionRoute, entry.actionParams || {});
        }
    };

    const openQuickAction = (quickAction, event = null) => {
        event?.stopPropagation?.();
        if (quickAction.openURL) {
            openBrowserAsync(quickAction.openURL);
            return;
        }
        if (quickAction.route) {
            navigation.navigate(quickAction.route, quickAction.params || {});
        }
    };

    return (
        <Pressable
            accessibilityLabel={`Open ${entry.title}`}
            accessibilityRole={"button"}
            alignItems={"stretch"}
            borderColor={"gray.100"}
            borderTopWidth={1}
            flexDirection={"column"}
            isDisabled={!canOpen}
            onPress={openEntry}
            paddingY={3}
            _hover={{ backgroundColor: "gray.50" }}
            _pressed={{ backgroundColor: "blue.50" }}
        >
            <View alignItems={"center"} flexDirection={"row"} width={"100%"}>
                <View
                    alignItems={"center"}
                    backgroundColor={"blue.50"}
                    borderColor={"blue.100"}
                    borderRadius={8}
                    borderWidth={1}
                    height={34}
                    justifyContent={"center"}
                    marginRight={2}
                    width={34}
                >
                    <MaterialCommunityIcons name={(entry.icon || "dots-horizontal-circle-outline") as any} size={18} color={openScoreboardColor} />
                </View>
                <View flex={1} minWidth={0}>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} numberOfLines={2}>{entry.title}</Text>
                    <Text color={"gray.600"} fontSize={"xs"} marginTop={0.5} numberOfLines={1}>{entry.subtitle}</Text>
                </View>
                <View alignItems={"center"} height={28} justifyContent={"center"} marginLeft={2} width={22}>
                    <MaterialCommunityIcons
                        name={(hasExternalURL ? "open-in-new" : "chevron-right") as any}
                        size={18}
                        color={openScoreboardColor}
                    />
                </View>
            </View>
            {(entry.meta || quickActions.length > 0) ? (
                <View alignItems={"center"} flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                    {entry.meta ? (
                        <View
                            backgroundColor={"gray.50"}
                            borderColor={"gray.200"}
                            borderRadius={999}
                            borderWidth={1}
                            marginBottom={1}
                            marginRight={2}
                            paddingX={2}
                            paddingY={1}
                        >
                            <Text color={"gray.600"} fontSize={"2xs"} fontWeight={"bold"}>{entry.meta}</Text>
                        </View>
                    ) : null}
                    {quickActions.map((quickAction) => (
                        <Button
                            key={`${entry.id}-${quickAction.label}`}
                            borderRadius={8}
                            marginBottom={1}
                            marginRight={2}
                            minHeight={8}
                            onPress={(event) => openQuickAction(quickAction, event)}
                            paddingX={2}
                            paddingY={1}
                            size={"xs"}
                            variant={"outline"}
                        >
                            <View alignItems={"center"} flexDirection={"row"}>
                                <MaterialCommunityIcons name={(quickAction.icon || "scoreboard-outline") as any} size={14} color={openScoreboardColor} />
                                <Text color={openScoreboardColor} fontSize={"xs"} fontWeight={"bold"} marginLeft={1}>{quickAction.label}</Text>
                            </View>
                        </Button>
                    ))}
                </View>
            ) : null}
        </Pressable>
    );
}

function FeaturePreviewCard({ item, navigation, preview }) {
    const docID = documentationByRoute[item.route] || "getting-started";
    const entries = preview?.entries || [];
    const isLoading = preview?.isLoading !== false;
    const hasError = preview?.hasError === true;

    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginBottom={3}
            minHeight={244}
            padding={4}
            width={"100%"}
        >
            <View alignItems={"flex-start"} flexDirection={"row"}>
                <Pressable flex={1} paddingRight={3} onPress={() => navigation.navigate(item.route)}>
                    <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>{item.title}</Text>
                    <Text color={"gray.600"} fontSize={"xs"} marginTop={1} numberOfLines={2}>{item.description}</Text>
                </Pressable>
                <Pressable
                    accessibilityLabel={`Open ${item.title} documentation`}
                    alignItems={"center"}
                    borderColor={"gray.200"}
                    borderRadius={999}
                    borderWidth={1}
                    height={34}
                    justifyContent={"center"}
                    onPress={() => navigation.navigate("Tutorials", { sectionID: docID })}
                    width={34}
                    _hover={{ backgroundColor: "blue.50" }}
                >
                    <MaterialCommunityIcons name="information-outline" size={18} color={openScoreboardColor} />
                </Pressable>
            </View>

            <View marginTop={3} minHeight={126}>
                {isLoading ? (
                    <View alignItems={"center"} justifyContent={"center"} paddingY={8}>
                        <Spinner color={openScoreboardColor} />
                    </View>
                ) : hasError ? (
                    <Text color={"red.700"} fontSize={"sm"}>Unable to load recent items.</Text>
                ) : entries.length > 0 ? (
                    entries.map((entry) => (
                        <PreviewRow
                            entry={entry}
                            fallbackRoute={item.route}
                            key={entry.id}
                            navigation={navigation}
                        />
                    ))
                ) : (
                    <View borderColor={"gray.100"} borderTopWidth={1} paddingY={4}>
                        <Text color={"gray.500"} fontSize={"sm"}>No recent items yet.</Text>
                    </View>
                )}
            </View>

            <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} marginTop={3}>
                <Text color={"gray.500"} fontSize={"xs"}>{entries.length > 0 ? `Latest ${entries.length}` : "Ready when you are"}</Text>
                <Button borderRadius={8} onPress={() => navigation.navigate(item.route)} size={"sm"} variant={"outline"}>
                    <Text color={openScoreboardColor} fontWeight={"bold"}>View all</Text>
                </Button>
            </View>
        </View>
    );
}

function HomeSection({ description, items, navigation, onLayout, previews, title }) {
    return (
        <View
            alignSelf={"center"}
            marginTop={5}
            maxW={1180}
            onLayout={onLayout}
            width={"100%"}
        >
            <View marginBottom={3} paddingX={1}>
                <Text fontSize={"2xl"} color={"gray.900"} fontWeight={"bold"}>{title}</Text>
                <Text fontSize={"sm"} color={"gray.600"} marginTop={1}>{description}</Text>
            </View>
            <View flexDir={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                {items.map((item) => (
                    <View key={item.title} width={{ base: "100%", md: "48.5%" }} marginBottom={3}>
                        <FeaturePreviewCard item={item} navigation={navigation} preview={previews[item.route]} />
                    </View>
                ))}
            </View>
        </View>
    );
}

export default function Home(props) {
    const navigationSections = getAppNavigationSections();
    const scrollViewRef = useRef<any>(null);
    const [previews, setPreviews] = useState<Record<string, any>>({});
    const [sectionOffsets, setSectionOffsets] = useState<Record<string, number>>({});
    const [sectionContainerOffset, setSectionContainerOffset] = useState(0);

    function setSectionOffset(title, event) {
        const y = event?.nativeEvent?.layout?.y;
        if (typeof y !== "number") {
            return;
        }

        setSectionOffsets((currentOffsets) => ({
            ...currentOffsets,
            [title]: y,
        }));
    }

    function scrollToSection(title) {
        const y = sectionOffsets[title];
        if (typeof y !== "number") {
            return;
        }

        scrollViewRef.current?.scrollTo({
            animated: true,
            y: Math.max(sectionContainerOffset + y - 12, 0),
        });
    }

    function loadPreviews() {
        const items = navigationSections.flatMap((section) => section.items);
        const loadingState = items.reduce((nextState, item) => {
            nextState[item.route] = {
                entries: [],
                hasError: false,
                isLoading: true,
            };
            return nextState;
        }, {});
        setPreviews(loadingState);

        Promise.all(items.map(async (item) => {
            const loader = previewLoaders[item.route];
            if (!loader) {
                return [item.route, { entries: [], hasError: false, isLoading: false }];
            }

            try {
                const entries = await loader();
                return [item.route, { entries: entries.slice(0, PREVIEW_LIMIT), hasError: false, isLoading: false }];
            }
            catch (err) {
                console.error(err);
                return [item.route, { entries: [], hasError: true, isLoading: false }];
            }
        })).then((previewEntries) => {
            setPreviews(previewEntries.reduce((nextState, [route, preview]) => {
                nextState[route] = preview;
                return nextState;
            }, {}));
        });
    }

    useEffect(() => {
        loadPreviews();
        const unsubscribe = props.navigation.addListener("focus", loadPreviews);
        return unsubscribe;
    }, []);

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"} ref={scrollViewRef}>
                <View alignSelf={"center"} maxW={1180} paddingX={4} paddingTop={5} width={"100%"}>
                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        padding={5}
                    >
                        <Text color={"blue.700"} fontSize={"xs"} fontWeight={"bold"} textTransform={"uppercase"}>Dashboard</Text>
                        <Text color={"gray.900"} fontSize={{ base: "3xl", md: "4xl" }} fontWeight={"bold"} marginTop={2}>
                            Open Scoreboard Home
                        </Text>
                        <Text color={"gray.600"} fontSize={"md"} marginTop={2} maxW={860}>
                            Recent tables, scoreboards, player data, teams, competitions, and display links are shown here so you can jump back into active work quickly.
                        </Text>
                        <ScrollView horizontal marginTop={4} showsHorizontalScrollIndicator={false}>
                            {navigationSections.map((section) => (
                                <Pressable
                                    key={section.title}
                                    alignItems={"center"}
                                    backgroundColor={"blue.50"}
                                    borderColor={"blue.100"}
                                    borderRadius={999}
                                    borderWidth={1}
                                    flexDirection={"row"}
                                    marginRight={2}
                                    onPress={() => scrollToSection(section.title)}
                                    paddingX={3}
                                    paddingY={2}
                                    _hover={{ backgroundColor: "blue.100" }}
                                    _pressed={{ backgroundColor: "blue.100" }}
                                >
                                    <MaterialCommunityIcons name={section.icon as any} size={16} color={openScoreboardColor} />
                                    <Text color={"blue.800"} fontSize={"xs"} fontWeight={"bold"} marginLeft={1.5}>{section.title}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                <ArticleCarousel />

                <View
                    paddingX={4}
                    paddingBottom={4}
                    onLayout={(event) => setSectionContainerOffset(event?.nativeEvent?.layout?.y || 0)}
                >
                    {navigationSections.map((section) => (
                        <HomeSection
                            key={section.title}
                            title={section.title}
                            description={section.description}
                            items={section.items}
                            navigation={props.navigation}
                            onLayout={(event) => setSectionOffset(section.title, event)}
                            previews={previews}
                        />
                    ))}
                </View>
                <View height={6} />
            </ScrollView>
        </NativeBaseProvider>
    );
}
