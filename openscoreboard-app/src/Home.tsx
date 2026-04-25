import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from 'heroui-native/card';
import i18n from './translations/translate';
import { HomeItem } from './listitems/HomeItem';

export default function Home(props) {

    const scoringScreens = [
        {
            route: "MyTables",
            title: i18n.t("tables"),
            description: i18n.t("tableDescription"),

        },
        {
            route: "MyTeamMatches",
            title: i18n.t("teamMatches"),
            description: i18n.t("teamMatchDescription"),

        },
    ]
    const importables = [
        {
            route: "MyPlayerLists",
            title: i18n.t("players"),
            description: i18n.t("playersDescription"),

        },
        {
            route: "MyTeams",
            title: i18n.t("teams"),
            description: i18n.t("teamDescription"),

        },

    ]
    const scoreboards = [
        {
            route: "MyScoreboards",
            title: i18n.t("scoreboards"),
            description: i18n.t("scoreboardsDescription"),

        },
        {
            route: "DynamicURLS",
            title: i18n.t("dynamicURLs"),
            description: i18n.t("dynamicURLDescription"),

        }
    ]

    console.log(window.location.hostname)
    if (window.location.hostname === 'app.openscoreboard.com') {
        scoreboards.push({
            route: "TableLiveScoringLink",
            title: i18n.t("tableLiveScoring"),
            description: i18n.t("tableLiveScoringDescription"),

        })
    }

    const account = [

        {
            route: "MyAccount",
            title: i18n.t("accountSettings"),
            description: i18n.t("accountSettingsDescription"),

        },
        {
            route: "",
            title: `${i18n.t("tutorials")}(${i18n.t("comingSoon")})`,
            description: i18n.t("tutorialsDescription"),

        },
    ]


    const sections = [
        {
            title: i18n.t("scoring"),
            accentColor: "#2563eb",
            data: scoringScreens,
            description: "Run live scores and team competition workflows.",
        },
        {
            title: i18n.t("importablePlayersTeams"),
            accentColor: "#16a34a",
            data: importables,
            description: "Organize reusable player and team records.",
        },
        {
            title: i18n.t("scoreboardsOverlays"),
            accentColor: "#dc2626",
            data: scoreboards,
            description: "Design overlays and share dynamic scoreboard links.",
        },
        {
            title: i18n.t("account"),
            accentColor: "#7c3aed",
            data: account,
            description: "Manage your workspace and support resources.",
        },
    ];

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.eyebrow}>Open Scoreboard</Text>
                <Text style={styles.headline}>Match control center</Text>
                <Text style={styles.headerText}>Jump into scoring, roster setup, overlays, and account tools from one workspace.</Text>
            </View>
            <View style={styles.sectionGrid}>
            {sections.map((section) => {
                return (
                    <View style={styles.section} key={section.title}>
                        <Card style={styles.sectionCard}>
                            <Card.Body style={styles.sectionBody}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionAccent, { backgroundColor: section.accentColor }]}></View>
                                    <View style={styles.sectionCopy}>
                                        <Text style={styles.sectionTitle}>{section.title}</Text>
                                        <Text style={styles.sectionDescription}>{section.description}</Text>
                                    </View>
                                </View>
                                {section.data.map((item, index) => {
                                    return (
                                        <HomeItem
                                            accentColor={section.accentColor}
                                            item={item}
                                            key={`${section.title}-${item.route}-${index}`}
                                            isLast={index === section.data.length - 1}
                                            navigation={props.navigation}
                                        ></HomeItem>
                                    )
                                })}
                            </Card.Body>
                        </Card>
                    </View>
                )
            })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#f4f6f8",
    },
    content: {
        alignItems: "center",
        gap: 18,
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 36,
    },
    header: {
        maxWidth: 900,
        width: "100%",
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    eyebrow: {
        color: "#2563eb",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 0,
        textTransform: "uppercase",
    },
    headline: {
        color: "#111827",
        fontSize: 30,
        fontWeight: "800",
        lineHeight: 36,
        marginTop: 4,
    },
    headerText: {
        color: "#4b5563",
        fontSize: 15,
        lineHeight: 22,
        marginTop: 6,
        maxWidth: 620,
    },
    sectionGrid: {
        alignItems: "stretch",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        justifyContent: "center",
        maxWidth: 900,
        width: "100%",
    },
    section: {
        flexBasis: 420,
        flexGrow: 1,
        maxWidth: 560,
        minWidth: 300,
        width: "100%",
    },
    sectionCard: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        minHeight: 238,
        width: "100%",
    },
    sectionBody: {
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 12,
    },
    sectionHeader: {
        alignItems: "flex-start",
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 4,
        paddingBottom: 4,
    },
    sectionAccent: {
        borderRadius: 4,
        height: 34,
        width: 6,
    },
    sectionCopy: {
        flex: 1,
        minWidth: 0,
    },
    sectionTitle: {
        color: "#111827",
        fontSize: 18,
        fontWeight: "800",
        lineHeight: 24,
    },
    sectionDescription: {
        color: "#6b7280",
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
});
