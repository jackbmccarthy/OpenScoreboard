import { isFirebaseAuthRequired } from '../openscoreboard.config';
import i18n from './translations/translate';

export function getAppNavigationSections() {
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
    ];

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
    ];

    const competitions = [
        {
            route: "MyCompetitions",
            title: "My Competitions",
            description: "Create brackets and round-robin groups, then link scheduled table matches so results update automatically.",
            options: ["Brackets", "Round robin groups", "Scheduled matches"],
        },
    ];

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
        },
        {
            route: "MyBracketGroupStyles",
            title: "Dynamic Brackets & Groups",
            description: "Create stable bracket and round-robin display URLs that can swap competitions and styles without changing your stream setup.",
            options: ["Stable URLs", "Competition links", "Reusable styles"],
        },
    ];

    const account = [
        ...(isFirebaseAuthRequired ? [
            {
                route: "MyAccount",
                title: i18n.t("accountSettings"),
                description: i18n.t("accountSettingsDescription"),
                options: ["Profile", "Sign out"],
            },
        ] : []),
        {
            route: "Tutorials",
            title: "Documentation",
            description: "Learn how each Open Scoreboard feature works and when to use it.",
            options: ["Documentation", "Feature guides", "Workflows"],
        },
    ];

    return [
        {
            description: "Create scorekeeping surfaces for tables, courts, and team formats.",
            icon: "scoreboard-outline",
            items: scoringScreens,
            title: i18n.t("scoring"),
        },
        {
            description: "Prepare reusable people and team data before match day.",
            icon: "account-group-outline",
            items: importables,
            title: i18n.t("importablePlayersTeams"),
        },
        {
            description: "Build competition structures that can drive bracket and group displays.",
            icon: "tournament",
            items: competitions,
            title: "Competitions",
        },
        {
            description: "Design and publish graphics for streams, venues, and remote viewers.",
            icon: "monitor-dashboard",
            items: scoreboards,
            title: i18n.t("scoreboardsOverlays"),
        },
        {
            description: "Manage your account and help resources.",
            icon: "help-circle-outline",
            items: account,
            title: "Account & Help",
        },
    ].filter((section) => section.items.length > 0);
}
