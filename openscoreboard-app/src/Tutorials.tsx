import React, { useMemo, useState } from 'react';
import { NativeBaseProvider, Pressable, ScrollView, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';

const tutorialSections = [
    {
        id: "getting-started",
        title: "Start Here",
        subtitle: "Understand the Open Scoreboard building blocks.",
        icon: "map-outline",
        purpose: "Open Scoreboard separates scorekeeping, scoreboard graphics, reusable data, and competition management so each event can be assembled from the pieces you need.",
        create: [
            "Create a table or court for every physical scoring station.",
            "Create player lists or teams if you want names, flags, images, ratings, or jersey colors to be reusable.",
            "Create a scoreboard or dynamic bracket/group display for the screen, TV, or stream output.",
            "Use competitions or the scheduling manager when matches should be pushed to scoring tables in order.",
        ],
        useFor: [
            "Small events with one table and a single scoreboard.",
            "Large events where organizers schedule matches and tables only score assigned matches.",
            "Streams where graphics need stable URLs and polished overlays.",
        ],
        tips: [
            "Tables are for scoring. Scoreboards are for display. Competitions are for structure. Dynamic URLs are for stable broadcast links.",
            "If a venue screen or stream needs to stay unchanged, use a dynamic URL and swap the assigned table, team match, bracket, or group behind it.",
        ],
        relatedRoutes: [
            { label: "Open Tables", route: "MyTables" },
            { label: "Open Scoreboards", route: "MyScoreboards" },
        ],
    },
    {
        id: "tables-scoring",
        title: "Tables And Scoring",
        subtitle: "Create scoring links for tables, courts, and kiosks.",
        icon: "table-tennis",
        purpose: "A table is the scoring surface. It stores the current match, scheduled queue, archived matches, table password, scoring type, and optional kiosk behavior.",
        create: [
            "Open My Tables and create a table for each table, court, or scoring device.",
            "Choose the sport and scoring type that match how the table will score.",
            "Share the scoring link with the scorekeeper or open it on the device at the table.",
            "For controlled events, enable kiosk mode so the table waits for scheduled matches instead of allowing manual match creation.",
        ],
        useFor: [
            "Normal scoring tables where a scorekeeper can create or select a match.",
            "Kiosk scoring stations where the organizer pushes matches to the table.",
            "Scorekeeping devices that should archive match history automatically.",
        ],
        tips: [
            "Use kiosk mode when match order matters or when teams must submit lineups before a match can start.",
            "Scheduled matches can still allow jersey color confirmation while locking players, format, and match settings.",
        ],
        relatedRoutes: [
            { label: "Open My Tables", route: "MyTables" },
        ],
    },
    {
        id: "player-lists",
        title: "Player Lists",
        subtitle: "Reusable player data for scoring, competitions, flags, and images.",
        icon: "account-group-outline",
        purpose: "Player lists keep player names and metadata in one place. Tables, competitions, registration pages, and scoreboards can reuse the same player records.",
        create: [
            "Open Player Lists and create a list for an event, club, league, or tournament.",
            "Add players manually, import a CSV, or enable self registration when players should add themselves.",
            "Add useful metadata such as country, image URL, rating, ranking, gender, and jersey color.",
            "Link the player list to a table if the scoring wizard should select players instead of typing names.",
        ],
        useFor: [
            "Events where scorekeepers should pick from a known player list.",
            "Scoreboard graphics that show flags, player photos, ratings, or rankings.",
            "Competitions where seeded players become bracket or group entrants.",
        ],
        tips: [
            "Flags and player images look best when both sides have values. If one player is missing a flag or image, scoreboard player media hides for both sides.",
            "Use image URL fields for hosted images. Keep them consistent in size for the cleanest overlays.",
        ],
        relatedRoutes: [
            { label: "Open Player Lists", route: "MyPlayerLists" },
            { label: "Bulk Add Players", route: "BulkAddPlayer" },
        ],
    },
    {
        id: "teams",
        title: "Teams",
        subtitle: "Build rosters, team colors, logos, and competition links.",
        icon: "account-multiple-check-outline",
        purpose: "Teams collect players into a reusable roster. Team details can drive team match scoring, team competitions, portal access, logos, and jersey colors.",
        create: [
            "Open My Teams and create a team for each club, school, league team, or event roster.",
            "Add players to the roster and keep team colors, logos, and manager details current.",
            "Use linked competitions to jump from a team to the competitions where that team is entered.",
            "Share the team manager link when a team should manage its own roster or competition portal access.",
        ],
        useFor: [
            "Team match scoring where team wins matter in addition to player match results.",
            "Team tournaments where each tie creates player matches from lineup selections.",
            "Scoreboards that need team names, logos, or team colors.",
        ],
        tips: [
            "Team jersey colors can be inherited by player matches when a team competition sends matches to a table.",
            "Keep rosters clean before the competition starts so lineup selections are easy for team managers.",
        ],
        relatedRoutes: [
            { label: "Open My Teams", route: "MyTeams" },
        ],
    },
    {
        id: "scheduling",
        title: "Scheduling Manager",
        subtitle: "Queue manual or assigned matches onto tables.",
        icon: "calendar-clock",
        purpose: "The scheduling manager controls a table or team match queue without requiring a full competition structure.",
        create: [
            "Open the scheduling manager from a table, team match, or related management page.",
            "Create manual scheduled matches, choose best of games, and set event or round labels when needed.",
            "Select linked players from the table player list when a table has one.",
            "Resolve, remove, reorder, or start scheduled matches from the queue.",
        ],
        useFor: [
            "Manual match queues for open play, leagues, or exhibition matches.",
            "Events where you know the next matches but do not need a bracket or group standings.",
            "Table assignment work where organizers need to control match order.",
        ],
        tips: [
            "Use competitions when standings or bracket advancement should update automatically.",
            "Use the scheduling manager when you simply need a table queue.",
        ],
        relatedRoutes: [
            { label: "Open Tables", route: "MyTables" },
        ],
    },
    {
        id: "scoreboards",
        title: "Scoreboards And Overlays",
        subtitle: "Design live graphics for screens, streams, and broadcasts.",
        icon: "monitor-dashboard",
        purpose: "Scoreboards read live match data and render it as a browser graphic. They can be used on venue screens, in OBS/browser sources, or as public display links.",
        create: [
            "Open My Scoreboards and create or edit a scoreboard.",
            "Add fields for names, scores, game scores, flags, player images, team details, timeouts, and point indicators.",
            "Set visibility rules such as always show, show during games, show during timeouts, or show between games.",
            "Open the scoreboard URL in a browser source, TV, or display browser.",
        ],
        useFor: [
            "Live stream overlays.",
            "Venue displays and table-side screens.",
            "Public scoreboard pages that follow a table or dynamic URL.",
        ],
        tips: [
            "Use show during games for overlays that should hide before setup and after a match ends.",
            "Use consistent player images and flags for both players so graphics stay balanced.",
            "Create separate scoreboard designs for TV fullscreen and stream overlays when they need different margins or borders.",
        ],
        relatedRoutes: [
            { label: "Open Scoreboards", route: "MyScoreboards" },
        ],
    },
    {
        id: "dynamic-urls",
        title: "Dynamic URLs",
        subtitle: "Stable display links that can be reassigned behind the scenes.",
        icon: "link-variant",
        purpose: "Dynamic URLs let you keep one permanent output URL while changing what data it shows. This is useful when a stream scene or venue display should never need a new browser source.",
        create: [
            "Open Dynamic URLs and create a URL for a stream, table, team match, or display role.",
            "Assign it to the table, team match, scoreboard, bracket, group, or competition output you want it to follow.",
            "Use the dynamic URL in your browser source or display device.",
            "When the event changes, update the assignment instead of changing the URL in your production setup.",
        ],
        useFor: [
            "OBS scenes where browser source URLs should stay stable.",
            "Venue screens that rotate between tables or matches.",
            "Competition displays where the active table or team match changes during the event.",
        ],
        tips: [
            "Name dynamic URLs by their role, such as Main Stream Table or Court 1 Overlay.",
            "Use competitions and tables to drive the data, then dynamic URLs to keep the output stable.",
        ],
        relatedRoutes: [
            { label: "Open Dynamic URLs", route: "DynamicURLS" },
        ],
    },
    {
        id: "competitions",
        title: "Individual Competitions",
        subtitle: "Create brackets, groups, and scheduled competition matches.",
        icon: "tournament",
        purpose: "Competitions organize players into round-robin groups, single-elimination brackets, or groups followed by a bracket. They can push matches to scoring tables and receive results back.",
        create: [
            "Open My Competitions and create a competition for a single event, division, or bracket.",
            "Choose the format: round robin, single elimination, or group stage plus bracket.",
            "Seed players from a player list or assign players manually.",
            "Generate group matches or bracket structure, then push ready matches to tables.",
            "As tables finish matches, results update the competition standings or bracket.",
        ],
        useFor: [
            "A singles or doubles event inside a larger tournament.",
            "Round-robin pools where standings matter.",
            "Single-elimination brackets that need live match scheduling.",
        ],
        tips: [
            "Use the competition name as the event name so scoreboards show the event correctly.",
            "Use match round for stage labels like Group Stage, Quarterfinals, Semifinals, or Final.",
            "Do not use play-round labels as broadcast round names; they are scheduling details.",
        ],
        relatedRoutes: [
            { label: "Open Competitions", route: "MyCompetitions" },
        ],
    },
    {
        id: "team-competitions",
        title: "Team Competitions",
        subtitle: "Team-versus-team ties with private lineup selection.",
        icon: "account-switch-outline",
        purpose: "Team competitions use the same competition structures as individual events, but each competition match is a team tie made of several player matches.",
        create: [
            "Create a team competition from My Competitions and add team entrants.",
            "Choose or create a team tie format with lineup positions such as A/B/C and X/Y/Z.",
            "Generate team contests from the group or bracket structure.",
            "Share team portal access so each team can submit private lineup selections.",
            "When both teams submit, player matches can be scheduled and pushed to normal tables or kiosk tables.",
        ],
        useFor: [
            "League ties where a team contest is best three out of five player matches.",
            "Team tournaments where lineups are revealed in stages.",
            "Formats where doubles and singles rules must be enforced.",
        ],
        tips: [
            "Lineup selections stay hidden until both teams submit for the active checkpoint.",
            "Kiosk tables are useful when multiple team-tie player matches can be played on either of several tables.",
            "The team competition portal should show the tie score, match history, and active lineup needs.",
        ],
        relatedRoutes: [
            { label: "Open Competitions", route: "MyCompetitions" },
            { label: "Open Teams", route: "MyTeams" },
        ],
    },
    {
        id: "bracket-group-displays",
        title: "Bracket And Group Displays",
        subtitle: "Canvas-rendered competition graphics for TVs and streams.",
        icon: "chart-tree",
        purpose: "Dynamic bracket and group displays turn competition data into a stable canvas output that can be styled for a fullscreen TV or a live stream overlay.",
        create: [
            "Open Dynamic Brackets & Groups from the scoreboard area.",
            "Create a reusable style for TV fullscreen or stream overlay use.",
            "Set fonts, colors, borders, background image URLs, player image/flag visibility, and sponsor image URLs.",
            "Link the display to a competition and use the output URL in a browser source or display browser.",
        ],
        useFor: [
            "A venue screen showing live bracket or group standings.",
            "A stream overlay showing a bracket, group table, or event sponsor area.",
            "Reusable visual styles that can be exported and reused across events.",
        ],
        tips: [
            "Use TV mode for fullscreen displays with square corners and no overlay border.",
            "Use stream overlay mode when the graphic needs rounded corners or a visible overlay boundary.",
            "Only enable player images or flags when your player data has values for the whole field.",
        ],
        relatedRoutes: [
            { label: "Open Displays", route: "MyBracketGroupStyles" },
        ],
    },
    {
        id: "scorekeeper-sessions",
        title: "Scorekeeper Sessions",
        subtitle: "Monitor table devices and court-side scorekeepers.",
        icon: "tablet-cellphone",
        purpose: "Scorekeeper sessions help organizers see which devices are connected to a table or team match and manage the devices allowed to score.",
        create: [
            "Open Scorekeeper Sessions from the home screen or table management area.",
            "Review active sessions by table, device, or team match.",
            "Block a device or session when a scoring link should no longer be allowed.",
            "Use the session panel during live events to understand which table devices are online.",
        ],
        useFor: [
            "Events with many shared scorekeeping links.",
            "Situations where a stale or wrong device should be blocked.",
            "Monitoring table scoring activity without opening every table.",
        ],
        tips: [
            "Use table passwords and session blocking together when scoring links are widely shared.",
            "If a table is in kiosk mode, session monitoring helps confirm the scoring device is ready before matches are pushed.",
        ],
        relatedRoutes: [
            { label: "Open Sessions", route: "ScorekeeperSessions" },
        ],
    },
    {
        id: "event-workflows",
        title: "Recommended Workflows",
        subtitle: "Common ways to combine the features on event day.",
        icon: "clipboard-check-outline",
        purpose: "Most events use a repeatable path: prepare data, create scoring surfaces, create displays, schedule matches, then monitor results.",
        create: [
            "Simple table: create a table, open the scoring link, create a scoreboard, and point the scoreboard at that table.",
            "Player-list event: create a player list, link it to a table, then let the scoring wizard select players.",
            "Individual tournament: create a competition, seed players, generate matches, push matches to tables, and show a bracket/group display.",
            "Team tournament: create teams, create a team competition, define tie format, share team portals, then push ready player matches to tables.",
            "Broadcast setup: create scoreboards and dynamic URLs first, then assign the active table, team match, bracket, or group as the event changes.",
        ],
        useFor: [
            "Planning event setup before match day.",
            "Training volunteers and scorekeepers.",
            "Choosing whether a feature is needed for a simple event or a full tournament.",
        ],
        tips: [
            "Start with the smallest structure that solves the event: tables only, scheduling manager, individual competition, or team competition.",
            "Use reusable data first. Clean player lists and team rosters make every later step smoother.",
        ],
        relatedRoutes: [
            { label: "Open Home", route: "Home" },
        ],
    },
];

function TutorialSectionHeading({ children }) {
    return (
        <View marginBottom={2} marginTop={5}>
            <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"}>{children}</Text>
            <View backgroundColor={"gray.200"} height={1} marginTop={2} />
        </View>
    );
}

function TutorialActionLink({ label, navigation, route }) {
    return (
        <Pressable
            onPress={() => navigation.navigate(route)}
            alignItems={"center"}
            flexDirection={"row"}
            marginBottom={2}
            marginRight={4}
        >
            <Text color={openScoreboardColor} fontSize={"sm"} fontWeight={"semibold"}>{label}</Text>
            <MaterialCommunityIcons name={"arrow-right"} size={14} color={openScoreboardColor} style={{ marginLeft: 4 }} />
        </Pressable>
    );
}

function NumberedList({ items }) {
    return (
        <View marginTop={2}>
            {items.map((item, index) => (
                <View key={`${item}-${index}`} alignItems={"flex-start"} flexDirection={"row"} marginBottom={3}>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginRight={2} minWidth={22}>
                        {index + 1}.
                    </Text>
                    <Text color={"gray.700"} flex={1} fontSize={"sm"}>{item}</Text>
                </View>
            ))}
        </View>
    );
}

function BulletList({ items }) {
    return (
        <View marginTop={2}>
            {items.map((item, index) => (
                <View key={`${item}-${index}`} alignItems={"flex-start"} flexDirection={"row"} marginBottom={2}>
                    <Text color={"gray.500"} fontSize={"sm"} marginRight={2}>•</Text>
                    <Text color={"gray.700"} flex={1} fontSize={"sm"}>{item}</Text>
                </View>
            ))}
        </View>
    );
}

function TutorialTopic({ navigation, section, isExpanded, onToggle }) {
    return (
        <View
            backgroundColor={"white"}
            borderBottomColor={"gray.200"}
            borderBottomWidth={1}
        >
            <Pressable
                onPress={onToggle}
                paddingY={5}
                _hover={{ backgroundColor: "gray.50" }}
            >
                <View alignItems={"center"} flexDirection={"row"}>
                    <View
                        alignItems={"center"}
                        height={32}
                        justifyContent={"center"}
                        marginRight={3}
                        width={32}
                    >
                        <MaterialCommunityIcons name={section.icon as any} size={22} color={isExpanded ? openScoreboardColor : "#52525B"} />
                    </View>
                    <View flex={1}>
                        <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"}>{section.title}</Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={0.5}>{section.subtitle}</Text>
                    </View>
                    <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={22} color={"#52525B"} />
                </View>
            </Pressable>
            {isExpanded ? (
                <View paddingBottom={6} paddingLeft={{ base: 0, md: 11 }}>
                    <TutorialSectionHeading>Purpose</TutorialSectionHeading>
                    <Text color={"gray.800"} fontSize={"sm"}>{section.purpose}</Text>

                    <TutorialSectionHeading>How To Create It</TutorialSectionHeading>
                    <NumberedList items={section.create} />

                    <TutorialSectionHeading>Use It For</TutorialSectionHeading>
                    <BulletList items={section.useFor} />

                    <TutorialSectionHeading>Notes</TutorialSectionHeading>
                    <View borderLeftColor={"gray.300"} borderLeftWidth={3} paddingLeft={3}>
                        <BulletList items={section.tips} />
                    </View>

                    {section.relatedRoutes?.length ? (
                        <View marginTop={5}>
                            <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginBottom={2}>Related Pages</Text>
                            <View flexDirection={"row"} flexWrap={"wrap"}>
                            {section.relatedRoutes.map((route) => (
                                <TutorialActionLink
                                    key={`${section.id}-${route.route}`}
                                    label={route.label}
                                    navigation={navigation}
                                    route={route.route}
                                />
                            ))}
                            </View>
                        </View>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}

export default function Tutorials(props) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        "getting-started": true,
    });
    const topicGroups = useMemo(() => ([
        {
            title: "Plan",
            ids: ["getting-started", "event-workflows"],
        },
        {
            title: "Score",
            ids: ["tables-scoring", "player-lists", "teams", "scheduling", "scorekeeper-sessions"],
        },
        {
            title: "Display",
            ids: ["scoreboards", "dynamic-urls", "bracket-group-displays"],
        },
        {
            title: "Compete",
            ids: ["competitions", "team-competitions"],
        },
    ]), []);

    function toggleSection(sectionID) {
        setExpandedSections((currentSections) => ({
            ...currentSections,
            [sectionID]: !currentSections[sectionID],
        }));
    }

    function expandGroup(ids) {
        setExpandedSections((currentSections) => {
            const nextSections = { ...currentSections };
            ids.forEach((id) => {
                nextSections[id] = true;
            });
            return nextSections;
        });
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"white"}>
                <View alignSelf={"center"} maxW={920} paddingX={5} paddingY={6} width={"100%"}>
                    <View
                        backgroundColor={"white"}
                        borderBottomColor={"gray.200"}
                        borderBottomWidth={1}
                        paddingBottom={6}
                    >
                        <Text color={"blue.700"} fontSize={"xs"} fontWeight={"bold"} textTransform={"uppercase"}>Documentation Home</Text>
                        <Text color={"gray.900"} fontSize={{ base: "3xl", md: "4xl" }} fontWeight={"bold"} marginTop={2}>
                            Open Scoreboard Tutorials
                        </Text>
                        <Text color={"gray.600"} fontSize={"md"} marginTop={2} maxW={820}>
                            Learn what each feature does, when to use it, and the basic path to create scoring surfaces,
                            displays, player data, competitions, and team events.
                        </Text>
                    </View>

                    <View
                        backgroundColor={"white"}
                        borderBottomColor={"gray.200"}
                        borderBottomWidth={1}
                        paddingY={5}
                    >
                        <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"}>Contents</Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>Open related tutorial sections for the part of the event you are building.</Text>
                        <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                            {topicGroups.map((group) => (
                                <Pressable
                                    key={group.title}
                                    onPress={() => expandGroup(group.ids)}
                                    marginBottom={2}
                                    marginRight={5}
                                    _hover={{ opacity: 0.75 }}
                                >
                                    <Text color={openScoreboardColor} fontSize={"sm"} fontWeight={"semibold"}>{group.title}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View>
                        {tutorialSections.map((section) => (
                            <TutorialTopic
                                key={section.id}
                                isExpanded={expandedSections[section.id] === true}
                                navigation={props.navigation}
                                onToggle={() => toggleSection(section.id)}
                                section={section}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>
        </NativeBaseProvider>
    );
}
