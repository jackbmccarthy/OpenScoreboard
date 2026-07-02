import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, FormControl, Input, Modal, NativeBaseProvider, ScrollView, Select, Spinner, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserPath } from '../database';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';
import { scoreboardBaseURL } from '../openscoreboard.config';
import LoadingPage from './LoadingPage';
import { getMyCompetitions } from './functions/competitions';
import { createBracketGroupStyle, getMyBracketGroupStyles } from './functions/bracketGroupStyles';
import {
    createDynamicBracketGroupDisplay,
    deleteDynamicBracketGroupDisplay,
    getMyDynamicBracketGroupDisplays,
    updateDynamicBracketGroupDisplay,
} from './functions/dynamicBracketGroups';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';
import { CopyInputRightButton } from './components/CopyButton';
import { EmptyState, ListPageHeader, ListToolbar, PageScaffold } from './components/ListPage';
import { compareByCreatedDesc } from './functions/listSorting';

const displaySearchSortOptions = [
    { label: "Recently created", value: "createdDesc" },
    { label: "Name A-Z", value: "nameAsc" },
    { label: "Name Z-A", value: "nameDesc" },
    { label: "Dynamic URLs first", value: "displaysFirst" },
    { label: "Styles first", value: "stylesFirst" },
];

function getDisplayTypeLabel(type) {
    return type === "roundRobin" ? "Round robin group" : "Single elimination bracket";
}

function getDisplayPath(type) {
    return type === "roundRobin" ? "groups" : "brackets";
}

function getDynamicDisplayURL(displayID, displayType) {
    return `${scoreboardBaseURL}/scoreboard/${getDisplayPath(displayType)}/?dynid=${displayID}`;
}

function getCameraModeLabel(cameraMode = "auto") {
    if (cameraMode === "fit") {
        return "Fit, no motion";
    }
    if (cameraMode === "free") {
        return "Manual camera";
    }
    return "Auto pan";
}

function getCompetitionTitle(competition) {
    return competition?.data?.title || competition?.title || "Competition";
}

function competitionSupportsDisplayType(competition, displayType) {
    if (displayType === "roundRobin") {
        return competition.type === "roundRobin" || competition.type === "roundRobinThenSingleElimination";
    }

    return competition.type === "singleElimination" || competition.type === "roundRobinThenSingleElimination";
}

function getStyleTitle(style) {
    return style?.title || "Display style";
}

function openDisplayURL(url) {
    if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
    }
}

function getDisplaySearchText(displayEntry) {
    const [, display = {}] = displayEntry || [];

    return [
        display.id,
        display.title,
        display.displayType,
        display.competitionTitle,
        display.styleTitle,
        getDisplayTypeLabel(display.displayType),
        getCameraModeLabel(display.cameraMode),
        "dynamic url stable production",
    ].filter(Boolean).join(" ").toLowerCase();
}

function getStyleSearchText(styleEntry) {
    const [, style = {}] = styleEntry || [];

    return [
        style.id,
        style.title,
        style.displayType,
        getStyleTitle(style),
        getDisplayTypeLabel(style.displayType),
        "style reusable display",
    ].filter(Boolean).join(" ").toLowerCase();
}

function sortDisplayEntries(entries, sortBy) {
    return [...entries].sort((firstEntry, secondEntry) => {
        const firstTypeRank = firstEntry.entryType === "display" ? 0 : 1;
        const secondTypeRank = secondEntry.entryType === "display" ? 0 : 1;
        const firstTitle = `${firstEntry.entryType === "display" ? firstEntry.entry?.[1]?.title : getStyleTitle(firstEntry.entry?.[1])}`.toLowerCase();
        const secondTitle = `${secondEntry.entryType === "display" ? secondEntry.entry?.[1]?.title : getStyleTitle(secondEntry.entry?.[1])}`.toLowerCase();

        if (sortBy === "nameDesc") {
            return secondTitle.localeCompare(firstTitle);
        }

        if (sortBy === "nameAsc") {
            return firstTitle.localeCompare(secondTitle);
        }

        if (sortBy === "displaysFirst") {
            return firstTypeRank - secondTypeRank || firstTitle.localeCompare(secondTitle);
        }

        if (sortBy === "stylesFirst") {
            return secondTypeRank - firstTypeRank || firstTitle.localeCompare(secondTitle);
        }

        return compareByCreatedDesc(firstEntry.entry, secondEntry.entry) || firstTitle.localeCompare(secondTitle);
    });
}

function DynamicDisplayCard({ item, onDelete, onEdit }) {
    const display = item?.[1] || {};
    const displayURL = getDynamicDisplayURL(display.id, display.displayType);

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
                onPress={onEdit}
                style={({ pressed }) => ({
                    backgroundColor: pressed ? "#F8FAFC" : "#FFFFFF",
                    opacity: pressed ? 0.86 : 1,
                    padding: 16,
                    width: "100%",
                })}
            >
                <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"}>
                    <View flex={1} paddingRight={3}>
                        <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                            Dynamic {getDisplayTypeLabel(display.displayType)}
                        </Text>
                        <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"} marginTop={1}>
                            {display.title || "Dynamic bracket/group display"}
                        </Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                            {display.competitionTitle || "No competition selected"} • {display.styleID ? display.styleTitle || "Display style" : "Default style"}
                        </Text>
                    </View>
                    <MaterialCommunityIcons name="link-variant" size={22} color={openScoreboardColor} />
                </View>
                <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                    <View
                        backgroundColor={"blue.50"}
                        borderColor={"blue.100"}
                        borderRadius={999}
                        borderWidth={1}
                        marginRight={2}
                        marginTop={2}
                        paddingX={3}
                        paddingY={1}
                    >
                        <Text color={"blue.700"} fontSize={"xs"} fontWeight={"bold"}>
                            Stable URL
                        </Text>
                    </View>
                    <View
                        backgroundColor={display.competitionID ? "green.50" : "amber.50"}
                        borderColor={display.competitionID ? "green.200" : "amber.200"}
                        borderRadius={999}
                        borderWidth={1}
                        marginRight={2}
                        marginTop={2}
                        paddingX={3}
                        paddingY={1}
                    >
                        <Text color={display.competitionID ? "green.700" : "amber.800"} fontSize={"xs"} fontWeight={"bold"}>
                            {display.competitionID ? "Competition linked" : "Needs competition"}
                        </Text>
                    </View>
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
                        <Text color={"gray.700"} fontSize={"xs"} fontWeight={"bold"}>
                            {getCameraModeLabel(display.cameraMode)}
                        </Text>
                    </View>
                </View>
                <Text color={"gray.500"} fontSize={"xs"} marginTop={3}>
                    Updated {display.updatedOn ? new Date(display.updatedOn).toLocaleString() : "recently"}
                </Text>
            </Pressable>
            <View borderColor={"gray.100"} borderTopWidth={1} padding={3}>
                <FormControl>
                    <FormControl.Label>Production URL</FormControl.Label>
                    <Input
                        backgroundColor={"gray.50"}
                        color={"gray.900"}
                        isReadOnly
                        InputRightElement={<CopyInputRightButton text={displayURL} />}
                        value={displayURL}
                    />
                </FormControl>
                <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                    <Button borderRadius={8} marginRight={2} marginTop={2} onPress={() => openDisplayURL(displayURL)} variant={"outline"}>
                        <View alignItems={"center"} flexDirection={"row"}>
                            <MaterialCommunityIcons name="open-in-new" size={16} color={openScoreboardColor} />
                            <Text color={openScoreboardColor} fontWeight={"bold"} marginLeft={1}>Open</Text>
                        </View>
                    </Button>
                    <Button backgroundColor={openScoreboardColor} borderRadius={8} marginRight={2} marginTop={2} onPress={onEdit}>
                        <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Manage</Text>
                    </Button>
                    <Button borderRadius={8} marginTop={2} onPress={onDelete} variant={"ghost"}>
                        <Text color={"red.700"} fontWeight={"bold"}>Delete</Text>
                    </Button>
                </View>
            </View>
        </View>
    );
}

function StyleCard({ item, onPress }) {
    const style = item?.[1] || {};

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
            <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"}>
                <View flex={1} paddingRight={3}>
                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                        Reusable display style
                    </Text>
                    <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"} marginTop={1}>
                        {getStyleTitle(style)}
                    </Text>
                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                        Available to all dynamic bracket/group displays.
                    </Text>
                </View>
                <MaterialCommunityIcons name="palette-outline" size={22} color={openScoreboardColor} />
            </View>
        </Pressable>
    );
}

function NewStyleModal({ isOpen, onClose, onCreated }) {
    const [title, setTitle] = useState("");
    const [displayType, setDisplayType] = useState("singleElimination");
    const [saving, setSaving] = useState(false);

    async function createStyle() {
        if (!title.trim()) {
            return;
        }

        setSaving(true);
        try {
            const style = await createBracketGroupStyle({
                displayType,
                title,
            });
            setTitle("");
            setDisplayType("singleElimination");
            onCreated(style);
        }
        finally {
            setSaving(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={() => onClose(false)} size={"lg"}>
            <Modal.Content>
                <Modal.CloseButton />
                <Modal.Header>New display style</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        <FormControl.Label>Style name</FormControl.Label>
                        <Input
                            backgroundColor={"white"}
                            color={"gray.900"}
                            onChangeText={setTitle}
                            placeholder={"Main stream bracket, group stage board, etc."}
                            value={title}
                        />
                    </FormControl>
                    <FormControl marginTop={3}>
                        <FormControl.Label>Preview type</FormControl.Label>
                        <Select selectedValue={displayType} onValueChange={setDisplayType}>
                            <Select.Item label="Single elimination bracket" value="singleElimination" />
                            <Select.Item label="Round robin group" value="roundRobin" />
                        </Select>
                    </FormControl>
                    <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} marginTop={4} padding={3}>
                        <Text color={"blue.900"} fontSize={"sm"}>
                            Styles are reusable. Create the style here, then choose it on any dynamic display URL.
                        </Text>
                    </View>
                </Modal.Body>
                <Modal.Footer>
                    <Button borderRadius={8} marginRight={2} onPress={() => onClose(false)} variant={"ghost"}>
                        <Text color={"gray.700"} fontWeight={"bold"}>Cancel</Text>
                    </Button>
                    <Button backgroundColor={openScoreboardColor} borderRadius={8} isDisabled={saving || !title.trim()} onPress={createStyle}>
                        {saving ? (
                            <Spinner color={openScoreboardButtonTextColor} />
                        ) : (
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Create style</Text>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}

function DynamicDisplayModal({ competitions, display, isOpen, onClose, onSaved, styles }) {
    const isEditing = Boolean(display?.myID);
    const [title, setTitle] = useState(display?.title || "");
    const [displayType, setDisplayType] = useState(display?.displayType || "singleElimination");
    const [competitionID, setCompetitionID] = useState(display?.competitionID || "");
    const [styleID, setStyleID] = useState(display?.styleID || "");
    const [cameraMode, setCameraMode] = useState(display?.cameraMode || "auto");
    const [saving, setSaving] = useState(false);
    const compatibleCompetitions = (competitions || []).filter((competitionEntry) => {
        const competition = competitionEntry?.[1] || {};
        return competitionSupportsDisplayType(competition, displayType) && competition.archived !== true;
    });
    const compatibleStyles = (styles || []).filter((styleEntry) => {
        const style = styleEntry?.[1] || {};
        return !style.displayType || style.displayType === displayType;
    });

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setTitle(display?.title || "");
        setDisplayType(display?.displayType || "singleElimination");
        setCompetitionID(display?.competitionID || "");
        setStyleID(display?.styleID || "");
        setCameraMode(display?.cameraMode || "auto");
    }, [display, isOpen]);

    function setType(nextType) {
        const nextCompatibleCompetitions = (competitions || []).filter((competitionEntry) => {
            const competition = competitionEntry?.[1] || {};
            return competitionSupportsDisplayType(competition, nextType) && competition.archived !== true;
        });
        const nextCompatibleStyles = (styles || []).filter((styleEntry) => {
            const style = styleEntry?.[1] || {};
            return !style.displayType || style.displayType === nextType;
        });

        setDisplayType(nextType);
        if (!nextCompatibleCompetitions.some((competitionEntry) => competitionEntry?.[1]?.id === competitionID)) {
            setCompetitionID("");
        }
        if (!nextCompatibleStyles.some((styleEntry) => styleEntry?.[1]?.id === styleID || styleEntry?.[0] === styleID)) {
            setStyleID("");
        }
    }

    async function saveDisplay() {
        if (!competitionID) {
            return;
        }

        setSaving(true);
        try {
            const updates = {
                cameraMode,
                competitionID,
                displayType,
                styleID,
                title,
            };

            if (isEditing) {
                await updateDynamicBracketGroupDisplay(display.myID, updates);
            }
            else {
                await createDynamicBracketGroupDisplay(updates);
            }

            onSaved();
        }
        finally {
            setSaving(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={() => onClose(false)} size={"xl"}>
            <Modal.Content>
                <Modal.CloseButton />
                <Modal.Header>{isEditing ? "Manage dynamic display" : "New dynamic display"}</Modal.Header>
                <Modal.Body>
                    <FormControl>
                        <FormControl.Label>Display name</FormControl.Label>
                        <Input
                            backgroundColor={"white"}
                            color={"gray.900"}
                            onChangeText={setTitle}
                            placeholder={"Main TV bracket, lobby group board, etc."}
                            value={title}
                        />
                    </FormControl>
                    <FormControl marginTop={3}>
                        <FormControl.Label>Display type</FormControl.Label>
                        <Select selectedValue={displayType} onValueChange={setType}>
                            <Select.Item label="Single elimination bracket" value="singleElimination" />
                            <Select.Item label="Round robin group" value="roundRobin" />
                        </Select>
                    </FormControl>
                    <FormControl marginTop={3}>
                        <FormControl.Label>Competition</FormControl.Label>
                        <Select
                            placeholder={compatibleCompetitions.length ? "Select competition" : "No matching competitions"}
                            selectedValue={competitionID}
                            onValueChange={setCompetitionID}
                        >
                            {compatibleCompetitions.map((competitionEntry) => {
                                const competition = competitionEntry?.[1] || {};

                                return (
                                    <Select.Item
                                        key={competition.id}
                                        label={getCompetitionTitle(competition)}
                                        value={competition.id}
                                    />
                                );
                            })}
                        </Select>
                    </FormControl>
                    <FormControl marginTop={3}>
                        <FormControl.Label>Display style</FormControl.Label>
                        <Select selectedValue={styleID || "__default__"} onValueChange={(nextStyleID) => setStyleID(nextStyleID === "__default__" ? "" : nextStyleID)}>
                            <Select.Item label="Default style" value="__default__" />
                            {compatibleStyles.map((styleEntry) => {
                                const style = styleEntry?.[1] || {};

                                return (
                                    <Select.Item
                                        key={style.id}
                                        label={getStyleTitle(style)}
                                        value={style.id}
                                    />
                                );
                            })}
                        </Select>
                    </FormControl>
                    <FormControl marginTop={3}>
                        <FormControl.Label>Camera behavior</FormControl.Label>
                        <Select selectedValue={cameraMode} onValueChange={setCameraMode}>
                            <Select.Item label="Auto pan through sections" value="auto" />
                            <Select.Item label="Fit whole bracket/group, no motion" value="fit" />
                        </Select>
                    </FormControl>
                    {isEditing ? (
                        <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} marginTop={4} padding={3}>
                            <Text color={"blue.900"} fontSize={"sm"}>
                                Your production URL stays the same. Saving only changes which competition and style it loads.
                            </Text>
                        </View>
                    ) : null}
                </Modal.Body>
                <Modal.Footer>
                    <Button borderRadius={8} marginRight={2} onPress={() => onClose(false)} variant={"ghost"}>
                        <Text color={"gray.700"} fontWeight={"bold"}>Cancel</Text>
                    </Button>
                    <Button
                        backgroundColor={openScoreboardColor}
                        borderRadius={8}
                        isDisabled={saving || !competitionID}
                        onPress={saveDisplay}
                    >
                        {saving ? (
                            <Spinner color={openScoreboardButtonTextColor} />
                        ) : (
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{isEditing ? "Save display" : "Create display"}</Text>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}

export default function MyBracketGroupStyles(props) {
    const [competitions, setCompetitions] = useState([]);
    const [doneLoading, setDoneLoading] = useState(false);
    const [dynamicDisplays, setDynamicDisplays] = useState([]);
    const [showCreateDisplayModal, setShowCreateDisplayModal] = useState(false);
    const [showCreateStyleModal, setShowCreateStyleModal] = useState(false);
    const [displaySearch, setDisplaySearch] = useState("");
    const [displaySort, setDisplaySort] = useState("createdDesc");
    const [styles, setStyles] = useState([]);
    const displayEntries = useMemo(() => {
        const entries = [
            ...dynamicDisplays.map((entry) => ({ entry, entryType: "display" })),
            ...styles.map((entry) => ({ entry, entryType: "style" })),
        ];
        const normalizedSearch = displaySearch.trim().toLowerCase();
        const filteredEntries = normalizedSearch ?
            entries.filter(({ entry, entryType }) => {
                return entryType === "display" ?
                    getDisplaySearchText(entry).includes(normalizedSearch) :
                    getStyleSearchText(entry).includes(normalizedSearch);
            }) :
            entries;

        return sortDisplayEntries(filteredEntries, displaySort);
    }, [displaySearch, displaySort, dynamicDisplays, styles]);
    const visibleDynamicDisplays = displayEntries.filter((entry) => entry.entryType === "display").map((entry) => entry.entry);
    const visibleStyles = displayEntries.filter((entry) => entry.entryType === "style").map((entry) => entry.entry);

    async function loadPage() {
        setDoneLoading(false);
        const [nextDisplays, nextStyles, nextCompetitions] = await Promise.all([
            getMyDynamicBracketGroupDisplays(getUserPath()),
            getMyBracketGroupStyles(getUserPath()),
            getMyCompetitions(getUserPath()),
        ]);
        setDynamicDisplays(nextDisplays);
        setStyles(nextStyles);
        setCompetitions(nextCompetitions);
        setDoneLoading(true);
    }

    useFocusEffect(
        useCallback(() => {
            props.navigation.setOptions({
                headerRight: () => (
                    <HeaderActions
                        navigation={props.navigation}
                        action={<HeaderIconButton label={"Create dynamic display"} onPress={() => setShowCreateDisplayModal(true)} />}
                    />
                ),
            });
            loadPage();
        }, [])
    );

    if (!doneLoading) {
        return <LoadingPage />;
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"}>
                <PageScaffold>
                    <ListPageHeader
                        actionIcon={"link-plus"}
                        actionLabel={"Create dynamic URL"}
                        description={"Create stable production URLs that dynamically point to the competition and display style you choose."}
                        onAction={() => setShowCreateDisplayModal(true)}
                        onSecondaryAction={() => setShowCreateStyleModal(true)}
                        secondaryActionIcon={"palette-outline"}
                        secondaryActionLabel={"Create style"}
                        title={"Dynamic Brackets & Groups"}
                    />
                    {dynamicDisplays.length > 0 || styles.length > 0 ? (
                        <ListToolbar
                            countLabel={`Showing ${displayEntries.length} of ${dynamicDisplays.length + styles.length} bracket/group resource${dynamicDisplays.length + styles.length === 1 ? "" : "s"}.`}
                            onSearchChange={setDisplaySearch}
                            onSortChange={setDisplaySort}
                            searchPlaceholder={"Search display URLs, competitions, styles, or camera behavior"}
                            searchValue={displaySearch}
                            sortOptions={displaySearchSortOptions}
                            sortValue={displaySort}
                        />
                    ) : null}

                    <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"} marginBottom={3} marginX={3}>Dynamic display URLs</Text>
                    {visibleDynamicDisplays.length > 0 ? (
                        <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"} marginX={3}>
                            {visibleDynamicDisplays.map((display) => (
                                <View key={display?.[0]} width={{ base: "100%", lg: "48.5%" }}>
	                                    <DynamicDisplayCard
	                                        item={display}
	                                        onDelete={async () => {
	                                            await deleteDynamicBracketGroupDisplay(display?.[0]);
	                                            loadPage();
	                                        }}
	                                        onEdit={() => props.navigation.navigate("DynamicBracketGroupDisplayEditor", {
	                                            displayID: display?.[1]?.id,
	                                            myDisplayID: display?.[0],
	                                        })}
	                                    />
                                </View>
                            ))}
                        </View>
                    ) : dynamicDisplays.length > 0 && displaySearch.trim().length > 0 ? (
                        <EmptyState
                            actionLabel={"Clear search"}
                            description={"Try another display URL name, competition, style, or camera behavior."}
                            icon={"link-variant-off"}
                            onAction={() => setDisplaySearch("")}
                            title={"No dynamic display URLs match your search"}
                        />
                    ) : (
                        <EmptyState
                            actionLabel={"Create dynamic URL"}
                            description={"Create one stable URL for your TV or stream, then update the competition or style whenever you need."}
                            icon={"link-plus"}
                            onAction={() => setShowCreateDisplayModal(true)}
                            title={"No dynamic bracket/group URLs yet"}
                        />
                    )}

                    <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} marginBottom={3} marginTop={4} marginX={3}>
                        <View flex={1} paddingRight={3}>
                            <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>Reusable display styles</Text>
                            <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                Styles created here can be assigned to any new or existing dynamic display URL.
                            </Text>
                        </View>
                        <Button borderRadius={8} onPress={() => setShowCreateStyleModal(true)} size={"sm"} variant={"outline"}>
                            <Text color={openScoreboardColor} fontWeight={"bold"}>New style</Text>
                        </Button>
                    </View>
                    {visibleStyles.length > 0 ? (
                        <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"} marginX={3}>
                            {visibleStyles.map((style) => (
                                <View key={style?.[0]} width={{ base: "100%", md: "48.5%" }}>
                                    <StyleCard
                                        item={style}
                                        onPress={() => props.navigation.navigate("BracketGroupStyleEditor", {
                                            styleID: style?.[1]?.id,
                                        })}
                                    />
                                </View>
                            ))}
                        </View>
                    ) : styles.length > 0 && displaySearch.trim().length > 0 ? (
                        <EmptyState
                            actionLabel={"Clear search"}
                            description={"Try another style name or display type."}
                            icon={"palette-outline"}
                            onAction={() => setDisplaySearch("")}
                            title={"No display styles match your search"}
                        />
                    ) : (
                        <EmptyState
                            actionLabel={"Create style"}
                            description={"Dynamic displays can use the default style until you create a custom one."}
                            icon={"palette-outline"}
                            onAction={() => setShowCreateStyleModal(true)}
                            title={"No custom styles yet"}
                        />
                    )}
                </PageScaffold>
            </ScrollView>
            <DynamicDisplayModal
                competitions={competitions}
                display={null}
                isOpen={showCreateDisplayModal}
                onClose={() => {
                    setShowCreateDisplayModal(false);
                }}
                onSaved={() => {
                    setShowCreateDisplayModal(false);
                    loadPage();
                }}
                styles={styles}
            />
            <NewStyleModal
                isOpen={showCreateStyleModal}
                onClose={() => setShowCreateStyleModal(false)}
                onCreated={(style) => {
                    setShowCreateStyleModal(false);
                    loadPage();
                    props.navigation.navigate("BracketGroupStyleEditor", {
                        styleID: style.id,
                    });
                }}
            />
        </NativeBaseProvider>
    );
}
