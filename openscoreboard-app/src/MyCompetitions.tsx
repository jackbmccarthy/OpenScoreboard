import React, { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, FormControl, Input, Modal, NativeBaseProvider, ScrollView, Select, Spinner, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserPath } from '../database';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';
import LoadingPage from './LoadingPage';
import { archiveCompetition, bracketRoundConfig, createCompetition as createCompetitionRecord, getCompetitionSportLabel, getMyCompetitions, getSupportedCompetitionSports } from './functions/competitions';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';

function getCompetitionTypeLabel(type) {
    switch (type) {
        case "roundRobin":
            return "Round robin group";
        case "singleElimination":
            return "Single elimination bracket";
        case "roundRobinThenSingleElimination":
            return "Groups + single elimination";
        default:
            return "Competition";
    }
}

function isCompetitionArchived(competition) {
    return competition?.archived === true || !!competition?.archivedOn;
}

function getCompetitionStats(competition) {
    const entrantLabel = competition.participantType === "team" ? "team" : "player";
    if (competition.type === "roundRobin" || competition.type === "roundRobinThenSingleElimination") {
        const groups: any[] = Object.values(competition.groups || {});
        const playerCount = groups.reduce((count, group: any) => count + Object.keys(group.players || {}).length, 0);
        const matchCount = groups.reduce((count, group: any) => count + Object.keys(group.matches || {}).length, 0);
        const bestOf = competition.data?.roundRobinBestOf || 5;
        const baseStats = [
            `${groups.length || 0} group${groups.length === 1 ? "" : "s"}`,
            `${playerCount} ${entrantLabel}${playerCount === 1 ? "" : "s"}`,
            `${matchCount} group match${matchCount === 1 ? "" : "es"}`,
            `Best of ${bestOf}`,
        ];

        if (competition.type === "roundRobin") {
            return baseStats;
        }

        const rounds = competition.data?.brackets || [];
        const firstRound = rounds[0] || {};
        const slotCount = (firstRound.seeds || []).length * 2;
        return [
            ...baseStats,
            `${slotCount} bracket slot${slotCount === 1 ? "" : "s"}`,
        ];
    }

    const rounds = competition.data?.brackets || [];
    const firstRound = rounds[0] || {};
    const slotCount = (firstRound.seeds || []).length * 2;
    const matchCount = rounds.reduce((count, round: any) => count + (round.seeds || []).length, 0);
    const defaultBestOf = competition.data?.bracketDefaultBestOf || 5;
    const upgradeRound = competition.data?.bracketUpgradeRound || "";
    const upgradeBestOf = competition.data?.bracketUpgradeBestOf || "";

    return [
        `Starts at ${competition.data?.largestRound || firstRound.title || "Final"}`,
        `${slotCount} slot${slotCount === 1 ? "" : "s"}`,
        `${matchCount} match${matchCount === 1 ? "" : "es"}`,
        upgradeRound ? `Best of ${defaultBestOf}, ${upgradeBestOf} from ${upgradeRound}` : `Best of ${defaultBestOf}`,
    ];
}

function CompetitionCard({
    archiveLoadingID,
    confirmArchiveID,
    item,
    onArchive,
    onCancelArchive,
    onPress,
    onRequestArchive,
}) {
    const myCompetitionID = item?.[0] || "";
    const competition = item?.[1] || {};
    const archived = isCompetitionArchived(competition);
    const showArchiveConfirm = confirmArchiveID === myCompetitionID;
    const stats = getCompetitionStats(competition);
    const sportLabel = getCompetitionSportLabel(competition.sportName || "tableTennis");

    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginBottom={3}
            overflow={"hidden"}
            width={"100%"}
        >
            <Pressable
                onPress={onPress}
                style={({ pressed }) => ({
                    backgroundColor: pressed ? "#F8FAFC" : "#FFFFFF",
                    opacity: pressed ? 0.84 : 1,
                    padding: 16,
                    width: "100%",
                })}
            >
                <View flexDirection={"row"} justifyContent={"space-between"}>
                    <View flex={1} paddingRight={3}>
                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                            {competition.participantType === "team" ? "Team tournament · " : ""}{getCompetitionTypeLabel(competition.type)} / {sportLabel}
                        </Text>
                        <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"} marginTop={1}>
                            {competition.title || "Untitled competition"}
                        </Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                            {stats.join(" • ")}
                        </Text>
                    </View>
                    <MaterialCommunityIcons name="pencil-outline" size={20} color={openScoreboardColor} />
                </View>
                <Text color={"gray.500"} fontSize={"xs"} marginTop={3}>
                    {archived ?
                        `Archived ${competition.archivedOn ? new Date(competition.archivedOn).toLocaleString() : ""}`
                        : `Created ${competition.createdOn ? new Date(competition.createdOn).toLocaleString() : "recently"}`}
                </Text>
            </Pressable>

            {!archived ? (
                <View borderColor={"gray.100"} borderTopWidth={1} padding={3}>
                    {showArchiveConfirm ? (
                        <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                            <View flex={1} minWidth={190} paddingRight={2}>
                                <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>Archive this competition?</Text>
                                <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                                    It will leave the current list and stay available in Archived for reference.
                                </Text>
                            </View>
                            <View alignItems={"center"} flexDirection={"row"} marginTop={2}>
                                <Button borderRadius={8} marginRight={2} onPress={onCancelArchive} size={"sm"} variant={"ghost"}>
                                    <Text color={"gray.700"} fontWeight={"bold"}>Cancel</Text>
                                </Button>
                                <Button
                                    backgroundColor={"red.700"}
                                    borderRadius={8}
                                    isDisabled={archiveLoadingID === myCompetitionID}
                                    onPress={onArchive}
                                    size={"sm"}
                                >
                                    {archiveLoadingID === myCompetitionID ? (
                                        <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                                    ) : (
                                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Archive</Text>
                                    )}
                                </Button>
                            </View>
                        </View>
                    ) : (
                        <View alignItems={"center"} flexDirection={"row"} flexWrap={"wrap"}>
                            <Button backgroundColor={openScoreboardColor} borderRadius={8} marginRight={2} marginTop={1} onPress={onPress} size={"sm"}>
                                <View alignItems={"center"} flexDirection={"row"}>
                                    <MaterialCommunityIcons name="cog-outline" size={16} color={openScoreboardButtonTextColor} />
                                    <Text color={openScoreboardButtonTextColor} fontSize={"xs"} fontWeight={"bold"} marginLeft={1}>Manage</Text>
                                </View>
                            </Button>
                            <Button borderRadius={8} marginTop={1} onPress={onRequestArchive} size={"sm"} variant={"outline"}>
                                <View alignItems={"center"} flexDirection={"row"}>
                                    <MaterialCommunityIcons name="archive-outline" size={16} color={"#B91C1C"} />
                                    <Text color={"red.700"} fontSize={"xs"} fontWeight={"bold"} marginLeft={1}>Archive</Text>
                                </View>
                            </Button>
                        </View>
                    )}
                </View>
            ) : null}
        </View>
    );
}

function CompetitionTabs({ activeTab, archivedCount, currentCount, setActiveTab }) {
    const tabs = [
        { count: currentCount, label: "Current", value: "current" },
        { count: archivedCount, label: "Archived", value: "archived" },
    ];

    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            flexDirection={"row"}
            marginBottom={4}
            padding={1}
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.value;

                return (
                    <Button
                        key={tab.value}
                        backgroundColor={isActive ? openScoreboardColor : "white"}
                        borderRadius={7}
                        flex={1}
                        onPress={() => setActiveTab(tab.value)}
                        variant={"ghost"}
                    >
                        <Text color={isActive ? openScoreboardButtonTextColor : openScoreboardColor} fontWeight={"bold"}>
                            {tab.label} ({tab.count})
                        </Text>
                    </Button>
                );
            })}
        </View>
    );
}

function EmptyCompetitions({ activeTab }) {
    return (
        <View
            alignItems={"center"}
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            padding={6}
        >
            <Spinner color={openScoreboardColor} display={"none"} />
            <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>
                {activeTab === "archived" ? "No archived competitions" : "No current competitions yet"}
            </Text>
            <Text color={"gray.600"} fontSize={"sm"} marginTop={2} textAlign={"center"}>
                {activeTab === "archived" ?
                    "Archived competitions will appear here after you move them out of the current list."
                    : "Create a bracket or group competition to get started."}
            </Text>
        </View>
    );
}

function NewCompetitionModal({ isOpen, onClose, onCreated }) {
    const [title, setTitle] = useState("");
    const [type, setType] = useState("singleElimination");
    const [participantType, setParticipantType] = useState("individual");
    const [sportName, setSportName] = useState("tableTennis");
    const [largestRound, setLargestRound] = useState("Quarterfinals");
    const [groupCount, setGroupCount] = useState("1");
    const [saving, setSaving] = useState(false);

    async function handleCreateCompetition() {
        if (!title.trim()) {
            return;
        }

        setSaving(true);
        try {
            const competition = await createCompetitionRecord({
                groupCount: Number(groupCount),
                largestRound,
                participantType,
                sportName,
                title,
                type,
            });
            setTitle("");
            setType("singleElimination");
            setParticipantType("individual");
            setSportName("tableTennis");
            setLargestRound("Quarterfinals");
            setGroupCount("1");
            onCreated(competition);
        }
        finally {
            setSaving(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={() => onClose(false)} size={"lg"}>
            <Modal.Content>
                <Modal.CloseButton />
                <Modal.Header>New competition</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        <FormControl.Label>Competition name</FormControl.Label>
                        <Input
                            backgroundColor={"white"}
                            color={"gray.900"}
                            onChangeText={setTitle}
                            placeholder={"Event bracket, Group A standings, etc."}
                            value={title}
                        />
                    </FormControl>
                    <FormControl marginTop={3}>
                        <FormControl.Label>Entrants</FormControl.Label>
                        <Select selectedValue={participantType} onValueChange={setParticipantType}>
                            <Select.Item label="Individual players" value="individual" />
                            <Select.Item label="Teams playing team ties" value="team" />
                        </Select>
                    </FormControl>
                    <FormControl marginTop={3}>
                        <FormControl.Label>Competition type</FormControl.Label>
                        <Select selectedValue={type} onValueChange={setType}>
                            <Select.Item label="Single elimination bracket" value="singleElimination" />
                            <Select.Item label="Round robin group" value="roundRobin" />
                            <Select.Item label="Group stage + single elimination" value="roundRobinThenSingleElimination" />
                        </Select>
                    </FormControl>
                    <FormControl marginTop={3}>
                        <FormControl.Label>Sport</FormControl.Label>
                        <Select selectedValue={sportName} onValueChange={setSportName}>
                            {getSupportedCompetitionSports().map((sport) => (
                                <Select.Item key={sport.value} label={sport.label} value={sport.value} />
                            ))}
                        </Select>
                    </FormControl>
                    {type === "singleElimination" || type === "roundRobinThenSingleElimination" ? (
                        <FormControl marginTop={3}>
                            <FormControl.Label>Maximum match round</FormControl.Label>
                            <Select selectedValue={largestRound} onValueChange={setLargestRound}>
                                {bracketRoundConfig.map((round) => (
                                    <Select.Item key={round.name} label={round.name} value={round.name} />
                                ))}
                            </Select>
                        </FormControl>
                    ) : null}
                    {type === "roundRobin" || type === "roundRobinThenSingleElimination" ? (
                        <FormControl marginTop={3}>
                            <FormControl.Label>Starting groups</FormControl.Label>
                            <Select selectedValue={groupCount} onValueChange={setGroupCount}>
                                {["1", "2", "4", "8"].map((count) => (
                                    <Select.Item key={count} label={count} value={count} />
                                ))}
                            </Select>
                        </FormControl>
                    ) : null}
                    <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} marginTop={4} padding={3}>
                        <Text color={"blue.900"} fontSize={"sm"}>
                            {participantType === "team" ?
                                "Each competition match becomes a configurable team tie. You will seed teams, submit lineups in stages, and schedule the ready individual matches after creation."
                                : "This creates the competition structure. You can style how it displays and link scheduled table matches after creation."}
                        </Text>
                    </View>
                </Modal.Body>
                <Modal.Footer>
                    <Button borderRadius={8} marginRight={2} onPress={() => onClose(false)} variant={"ghost"}>
                        <Text color={"gray.700"} fontWeight={"bold"}>Cancel</Text>
                    </Button>
                    <Button
                        backgroundColor={openScoreboardColor}
                        borderRadius={8}
                        isDisabled={saving || !title.trim()}
                        onPress={handleCreateCompetition}
                    >
                        {saving ? (
                            <Spinner color={openScoreboardButtonTextColor} />
                        ) : (
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Create competition</Text>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}

export default function MyCompetitions(props) {
    const [activeTab, setActiveTab] = useState("current");
    const [archiveLoadingID, setArchiveLoadingID] = useState("");
    const [confirmArchiveID, setConfirmArchiveID] = useState("");
    const [competitions, setCompetitions] = useState([]);
    const [doneLoading, setDoneLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const currentCompetitions = competitions.filter((competition) => !isCompetitionArchived(competition?.[1] || {}));
    const archivedCompetitions = competitions.filter((competition) => isCompetitionArchived(competition?.[1] || {}));
    const displayedCompetitions = activeTab === "archived" ? archivedCompetitions : currentCompetitions;

    async function loadCompetitions() {
        setDoneLoading(false);
        setCompetitions(await getMyCompetitions(getUserPath()));
        setDoneLoading(true);
    }

    async function handleArchiveCompetition(competition) {
        const myCompetitionID = competition?.[0] || "";
        const competitionID = competition?.[1]?.id || "";

        if (!myCompetitionID || !competitionID) {
            return;
        }

        setArchiveLoadingID(myCompetitionID);
        try {
            await archiveCompetition(myCompetitionID, competitionID);
            setConfirmArchiveID("");
            await loadCompetitions();
        }
        finally {
            setArchiveLoadingID("");
        }
    }

    useFocusEffect(
        useCallback(() => {
            props.navigation.setOptions({
                headerRight: () => (
                    <HeaderActions
                        navigation={props.navigation}
                        action={<HeaderIconButton label={"Create bracket or group"} onPress={() => setShowCreateModal(true)} />}
                    />
                ),
            });
            loadCompetitions();
        }, [props.navigation])
    );

    if (!doneLoading) {
        return <LoadingPage />;
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"}>
                <View padding={4}>
                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        marginBottom={4}
                        padding={4}
                    >
                        <Text color={"gray.900"} fontSize={"3xl"} fontWeight={"bold"}>My Competitions</Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                            Create individual or team competitions, manage their structure, then schedule matches to tables as needed.
                        </Text>
                        <Button
                            alignSelf={"flex-start"}
                            backgroundColor={openScoreboardColor}
                            borderRadius={8}
                            marginTop={4}
                            onPress={() => setShowCreateModal(true)}
                        >
                            <View alignItems={"center"} flexDirection={"row"}>
                                <MaterialCommunityIcons name="plus" size={18} color={openScoreboardButtonTextColor} />
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"} marginLeft={2}>Create competition</Text>
                            </View>
                        </Button>
                    </View>

                    <CompetitionTabs
                        activeTab={activeTab}
                        archivedCount={archivedCompetitions.length}
                        currentCount={currentCompetitions.length}
                        setActiveTab={setActiveTab}
                    />

                    {displayedCompetitions.length > 0 ? (
                        <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                            {displayedCompetitions.map((competition) => (
                                <View key={competition?.[0]} width={{ base: "100%", md: "48.5%" }}>
                                    <CompetitionCard
                                        archiveLoadingID={archiveLoadingID}
                                        confirmArchiveID={confirmArchiveID}
                                        item={competition}
                                        onArchive={() => handleArchiveCompetition(competition)}
                                        onCancelArchive={() => setConfirmArchiveID("")}
                                        onPress={() => props.navigation.navigate("CompetitionEditor", {
                                            competitionID: competition?.[1]?.id,
                                        })}
                                        onRequestArchive={() => setConfirmArchiveID(competition?.[0] || "")}
                                    />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <EmptyCompetitions activeTab={activeTab} />
                    )}
                </View>
            </ScrollView>
            <NewCompetitionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={(competition) => {
                    setShowCreateModal(false);
                    loadCompetitions();
                    props.navigation.navigate("CompetitionEditor", {
                        competitionID: competition.id,
                    });
                }}
            />
        </NativeBaseProvider>
    );
}
