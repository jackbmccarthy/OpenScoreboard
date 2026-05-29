import React, { useEffect, useState } from 'react';
import { Text, ScrollView, NativeBaseProvider, View, Pressable, Spinner, Image } from 'native-base';
import { openScoreboardColor, openScoreboardTheme } from "../openscoreboardtheme";
import { openBrowserAsync } from 'expo-web-browser';
import i18n from './translations/translate';
import { HomeItem } from './listitems/HomeItem';
import { isFirebaseAuthRequired } from '../openscoreboard.config';

const ARTICLE_API_URL = "https://openscoreboard.com/wp-json/wp/v2/posts?per_page=6&_embed=1";

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
        <View marginTop={4}>
            <View paddingX={4} marginBottom={3}>
                <Text fontSize={"2xl"} fontWeight={"bold"} color={"gray.900"}>Latest from Open Scoreboard</Text>
                <Text fontSize={"sm"} color={"gray.600"} marginTop={1}>Updates, release notes, and practical setup notes from openscoreboard.com.</Text>
            </View>
            {isLoading ? (
                <View padding={6} alignItems={"center"}>
                    <Spinner color={openScoreboardColor} />
                </View>
            ) : hasError ? (
                <View marginX={4} padding={4} backgroundColor={"gray.100"} borderRadius={8}>
                    <Text color={"gray.600"}>Articles are not available right now.</Text>
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} paddingLeft={4} paddingBottom={2}>
                    {articles.map((article) => (
                        <Pressable
                            key={article.id}
                            width={280}
                            minHeight={article.imageUrl ? 270 : 170}
                            marginRight={3}
                            padding={4}
                            borderRadius={8}
                            backgroundColor={"white"}
                            borderWidth={1}
                            borderColor={"gray.200"}
                            _hover={{ backgroundColor: "gray.50" }}
                            onPress={() => openBrowserAsync(article.link)}
                        >
                            {article.imageUrl ? (
                                <Image
                                    source={{ uri: article.imageUrl }}
                                    alt={article.title}
                                    width={"100%"}
                                    height={110}
                                    borderRadius={8}
                                    marginBottom={3}
                                    resizeMode={"cover"}
                                />
                            ) : null}
                            <Text fontSize={"xs"} color={"blue.700"} fontWeight={"semibold"}>{article.date}</Text>
                            <Text fontSize={"md"} color={"gray.900"} fontWeight={"bold"} marginTop={2}>{article.title}</Text>
                            <Text fontSize={"sm"} color={"gray.600"} marginTop={2} numberOfLines={3}>{article.excerpt}</Text>
                            <Text fontSize={"sm"} color={"blue.700"} fontWeight={"semibold"} marginTop={3}>Read article</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

function HomeSection({ title, description, items, navigation }) {
    return (
        <View
            width={"100%"}
            maxW={1040}
            alignSelf={"center"}
            marginTop={5}
            padding={4}
            borderRadius={8}
            backgroundColor={"white"}
            borderWidth={1}
            borderColor={"gray.200"}
        >
            <View marginBottom={4}>
                <Text fontSize={"2xl"} color={"gray.900"} fontWeight={"bold"}>{title}</Text>
                <Text fontSize={"sm"} color={"gray.600"} marginTop={1}>{description}</Text>
            </View>
            <View flexDir={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                {items.map((item) => (
                    <View key={item.title} width={{ base: "100%", md: "48.5%" }} marginBottom={3}>
                        <HomeItem item={item} navigation={navigation} />
                    </View>
                ))}
            </View>
        </View>
    );
}

export default function Home(props) {

    const scoringScreens = [
        {
            route: "MyTables",
            title: i18n.t("tables"),
            description: i18n.t("tableDescription"),
            options: ["Live scoring", "Share scorekeeper links", "Table settings"],

        },
        {
            route: "MyTeamMatches",
            title: i18n.t("teamMatches"),
            description: i18n.t("teamMatchDescription"),
            options: ["Team lineups", "Court assignments", "Match archive"],

        },
    ]
    const importables = [
        {
            route: "MyPlayerLists",
            title: i18n.t("players"),
            description: i18n.t("playersDescription"),
            options: ["Player lists", "CSV import", "Jersey colors"],

        },
        {
            route: "MyTeams",
            title: i18n.t("teams"),
            description: i18n.t("teamDescription"),
            options: ["Team rosters", "Player order", "Team logos"],

        },

    ]
    const scoreboards = [
        {
            route: "MyScoreboards",
            title: i18n.t("scoreboards"),
            description: i18n.t("scoreboardsDescription"),
            options: ["Overlay editor", "Display rules", "Launch links"],

        },
        {
            route: "DynamicURLS",
            title: i18n.t("dynamicURLs"),
            description: i18n.t("dynamicURLDescription"),
            options: ["Reusable URLs", "Swap assigned matches", "Email links"],

        }
    ]

    if (window.location.hostname === 'app.openscoreboard.com') {
        scoreboards.push({
            route: "TableLiveScoringLink",
            title: i18n.t("tableLiveScoring"),
            description: i18n.t("tableLiveScoringDescription"),
            options: ["Online scoring", "Table share links"],

        })
    }

    const account = isFirebaseAuthRequired ? [

        {
            route: "MyAccount",
            title: i18n.t("accountSettings"),
            description: i18n.t("accountSettingsDescription"),
            options: ["Profile", "Sign out"],

        },
        {
            route: "",
            title: `${i18n.t("tutorials")}(${i18n.t("comingSoon")})`,
            description: i18n.t("tutorialsDescription"),
            disabled: true,
            options: ["Guides", "Examples"],

        },
    ] : []


    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView
                backgroundColor={"gray.50"}
            >
                <ArticleCarousel />

                <View paddingX={4} paddingBottom={6}>
                    <HomeSection
                        title={i18n.t("scoring")}
                        description={"Create scorekeeping surfaces for tables, courts, and team formats."}
                        items={scoringScreens}
                        navigation={props.navigation}
                    />
                    <HomeSection
                        title={i18n.t("importablePlayersTeams")}
                        description={"Prepare reusable people and team data before match day."}
                        items={importables}
                        navigation={props.navigation}
                    />
                    <HomeSection
                        title={i18n.t("scoreboardsOverlays")}
                        description={"Design and publish graphics for streams, venues, and remote viewers."}
                        items={scoreboards}
                        navigation={props.navigation}
                    />
                    {account.length ? (
                        <HomeSection
                            title={i18n.t("account")}
                            description={"Manage your account and help resources."}
                            items={account}
                            navigation={props.navigation}
                        />
                    ) : null}
                </View>





            </ScrollView>
        </NativeBaseProvider>
    )
}
