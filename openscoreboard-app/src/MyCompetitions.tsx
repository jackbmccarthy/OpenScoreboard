import React, { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, FormControl, Input, Modal, NativeBaseProvider, ScrollView, Select, Spinner, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserPath } from '../database';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';
import LoadingPage from './LoadingPage';
import { bracketRoundConfig, createCompetitionGraphic, getMyCompetitions } from './functions/competitions';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';

function getCompetitionTypeLabel(type) {
    switch (type) {
        case "roundRobin":
            return "Round robin group";
        case "singleElimination":
            return "Single elimination bracket";
        default:
            return "Competition";
    }
}

function CompetitionCard({ item, onPress }) {
    const competition = item?.[1] || {};

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                backgroundColor: pressed ? "#F8FAFC" : "#FFFFFF",
                borderColor: "#E5E7EB",
                borderRadius: 8,
                borderWidth: 1,
                marginBottom: 12,
                opacity: pressed ? 0.84 : 1,
                padding: 16,
                width: "100%",
            })}
        >
            <View flexDirection={"row"} justifyContent={"space-between"}>
                <View flex={1} paddingRight={3}>
                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                        {getCompetitionTypeLabel(competition.type)}
                    </Text>
                    <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"} marginTop={1}>
                        {competition.title || "Untitled competition"}
                    </Text>
                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                        {competition.sourceTitle || "Linked from scheduling manager"}
                    </Text>
                </View>
                <View
                    alignItems={"center"}
                    backgroundColor={"blue.50"}
                    borderColor={"blue.100"}
                    borderRadius={999}
                    borderWidth={1}
                    height={32}
                    justifyContent={"center"}
                    paddingX={3}
                >
                    <Text color={"blue.700"} fontSize={"xs"} fontWeight={"bold"}>
                        {competition.formatName || "Scheduled"}
                    </Text>
                </View>
                <MaterialCommunityIcons name="pencil-outline" size={20} color={openScoreboardColor} />
            </View>
            <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                <View
                    backgroundColor={"gray.50"}
                    borderColor={"gray.200"}
                    borderRadius={999}
                    borderWidth={1}
                    marginRight={2}
                    marginTop={2}
                    paddingX={3}
                    paddingY={1}
                >
                    <Text color={"gray.600"} fontSize={"xs"} fontWeight={"bold"}>
                        {competition.sourceTitle ? `Linked to ${competition.sourceTitle}` : "Not linked yet"}
                    </Text>
                </View>
                <View
                    backgroundColor={competition.showBoard === false ? "red.50" : "green.50"}
                    borderColor={competition.showBoard === false ? "red.200" : "green.200"}
                    borderRadius={999}
                    borderWidth={1}
                    marginRight={2}
                    marginTop={2}
                    paddingX={3}
                    paddingY={1}
                >
                    <Text color={competition.showBoard === false ? "red.700" : "green.700"} fontSize={"xs"} fontWeight={"bold"}>
                        {competition.showBoard === false ? "Hidden" : "Visible"}
                    </Text>
                </View>
            </View>
            <Text color={"gray.500"} fontSize={"xs"} marginTop={3}>
                Created {competition.createdOn ? new Date(competition.createdOn).toLocaleString() : "from scheduled matches"}
            </Text>
        </Pressable>
    );
}

function NewCompetitionModal({ isOpen, onClose, onCreated }) {
    const [title, setTitle] = useState("");
    const [type, setType] = useState("singleElimination");
    const [largestRound, setLargestRound] = useState("Quarterfinals");
    const [groupCount, setGroupCount] = useState("1");
    const [saving, setSaving] = useState(false);

    async function createGraphic() {
        if (!title.trim()) {
            return;
        }

        setSaving(true);
        try {
            const competition = await createCompetitionGraphic({
                groupCount,
                largestRound,
                title,
                type,
            });
            setTitle("");
            setType("singleElimination");
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
                <Modal.Header>New bracket or group graphic</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        <FormControl.Label>Graphic name</FormControl.Label>
                        <Input
                            backgroundColor={"white"}
                            color={"gray.900"}
                            onChangeText={setTitle}
                            placeholder={"Event bracket, Group A standings, etc."}
                            value={title}
                        />
                    </FormControl>
                    <FormControl marginTop={3}>
                        <FormControl.Label>Graphic type</FormControl.Label>
                        <Select selectedValue={type} onValueChange={setType}>
                            <Select.Item label="Single elimination bracket" value="singleElimination" />
                            <Select.Item label="Round robin group board" value="roundRobin" />
                        </Select>
                    </FormControl>
                    {type === "singleElimination" ? (
                        <FormControl marginTop={3}>
                            <FormControl.Label>Largest round</FormControl.Label>
                            <Select selectedValue={largestRound} onValueChange={setLargestRound}>
                                {bracketRoundConfig.map((round) => (
                                    <Select.Item key={round.name} label={round.name} value={round.name} />
                                ))}
                            </Select>
                        </FormControl>
                    ) : (
                        <FormControl marginTop={3}>
                            <FormControl.Label>Starting groups</FormControl.Label>
                            <Select selectedValue={groupCount} onValueChange={setGroupCount}>
                                {["1", "2", "4", "8"].map((count) => (
                                    <Select.Item key={count} label={count} value={count} />
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} marginTop={4} padding={3}>
                        <Text color={"blue.900"} fontSize={"sm"}>
                            This creates the graphic styling and bracket/group structure. You can link scheduled table matches into it from the scheduling flow.
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
                        onPress={createGraphic}
                    >
                        {saving ? (
                            <Spinner color={openScoreboardButtonTextColor} />
                        ) : (
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Create graphic</Text>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}

export default function MyCompetitions(props) {
    const [competitions, setCompetitions] = useState([]);
    const [doneLoading, setDoneLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    async function loadCompetitions() {
        setDoneLoading(false);
        setCompetitions(await getMyCompetitions(getUserPath()));
        setDoneLoading(true);
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
                        <Text color={"gray.900"} fontSize={"3xl"} fontWeight={"bold"}>Brackets & Groups</Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                            Create bracket and round-robin graphics, edit their layout and styling, then link scheduled table matches so results can update the graphic.
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
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"} marginLeft={2}>Create graphic</Text>
                            </View>
                        </Button>
                    </View>

                    {competitions.length > 0 ? (
                        <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                            {competitions.map((competition) => (
                                <View key={competition?.[0]} width={{ base: "100%", md: "48.5%" }}>
                                    <CompetitionCard
                                        item={competition}
                                        onPress={() => props.navigation.navigate("CompetitionEditor", {
                                            competitionID: competition?.[1]?.id,
                                        })}
                                    />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View
                            alignItems={"center"}
                            backgroundColor={"white"}
                            borderColor={"gray.200"}
                            borderRadius={8}
                            borderWidth={1}
                            padding={6}
                        >
                            <Spinner color={openScoreboardColor} display={"none"} />
                            <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>No brackets or groups yet</Text>
                            <Text color={"gray.600"} fontSize={"sm"} marginTop={2} textAlign={"center"}>
                                Create a bracket or group graphic from scheduled table matches to get started.
                            </Text>
                        </View>
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
