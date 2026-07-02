import React, { useEffect, useState } from 'react';
import { Button, FormControl, Input, NativeBaseProvider, ScrollView, Select, Spinner, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserPath } from '../database';
import { scoreboardBaseURL } from '../openscoreboard.config';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';
import LoadingPage from './LoadingPage';
import { CopyInputRightButton } from './components/CopyButton';
import { ListPageHeader, PageScaffold } from './components/ListPage';
import { getMyBracketGroupStyles } from './functions/bracketGroupStyles';
import { getMyCompetitions } from './functions/competitions';
import { getMyDynamicBracketGroupDisplays, updateDynamicBracketGroupDisplay } from './functions/dynamicBracketGroups';

function FieldSection({ children, title, subtitle }) {
    return (
        <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} margin={3} padding={4}>
            <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>{title}</Text>
            {subtitle ? (
                <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{subtitle}</Text>
            ) : null}
            <View marginTop={3}>{children}</View>
        </View>
    );
}

function getDisplayTypeLabel(type) {
    return type === "roundRobin" ? "Round robin group" : "Single elimination bracket";
}

function getDisplayPath(type) {
    return type === "roundRobin" ? "groups" : "brackets";
}

function getDynamicDisplayURL(displayID, displayType) {
    return displayID ? `${scoreboardBaseURL}/scoreboard/${getDisplayPath(displayType)}/?dynid=${displayID}` : "";
}

function getCompetitionTitle(competition) {
    return competition?.data?.title || competition?.title || "Competition";
}

function getStyleTitle(style) {
    return style?.title || "Display style";
}

function competitionSupportsDisplayType(competition, displayType) {
    if (displayType === "roundRobin") {
        return competition.type === "roundRobin" || competition.type === "roundRobinThenSingleElimination";
    }

    return competition.type === "singleElimination" || competition.type === "roundRobinThenSingleElimination";
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

export default function DynamicBracketGroupDisplayEditor(props) {
    const routeParams = props.route?.params || {};
    const [doneLoading, setDoneLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [myDisplayID, setMyDisplayID] = useState(routeParams.myDisplayID || "");
    const [displayID, setDisplayID] = useState(routeParams.displayID || "");
    const [title, setTitle] = useState("");
    const [displayType, setDisplayType] = useState("singleElimination");
    const [competitionID, setCompetitionID] = useState("");
    const [styleID, setStyleID] = useState("");
    const [cameraMode, setCameraMode] = useState("auto");
    const [competitions, setCompetitions] = useState([]);
    const [styles, setStyles] = useState([]);
    const [display, setDisplay] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    const compatibleCompetitions = (competitions || []).filter((competitionEntry) => {
        const competition = competitionEntry?.[1] || {};
        return competitionSupportsDisplayType(competition, displayType) && competition.archived !== true;
    });
    const compatibleStyles = (styles || []).filter((styleEntry) => {
        const style = styleEntry?.[1] || {};
        return !style.displayType || style.displayType === displayType;
    });
    const productionURL = getDynamicDisplayURL(displayID, displayType);
    const selectedCompetition = compatibleCompetitions.find((competitionEntry) => competitionEntry?.[1]?.id === competitionID)?.[1];
    const selectedStyle = compatibleStyles.find((styleEntry) => styleEntry?.[1]?.id === styleID || styleEntry?.[0] === styleID)?.[1];

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

    async function loadPage() {
        setDoneLoading(false);
        const [displays, nextCompetitions, nextStyles] = await Promise.all([
            getMyDynamicBracketGroupDisplays(getUserPath()),
            getMyCompetitions(getUserPath()),
            getMyBracketGroupStyles(getUserPath()),
        ]);
        const displayEntry = displays.find((entry) => {
            return entry?.[0] === routeParams.myDisplayID || entry?.[1]?.id === routeParams.displayID;
        });

        if (!displayEntry) {
            setNotFound(true);
            setDoneLoading(true);
            return;
        }

        const nextDisplay = displayEntry?.[1] || {};
        setNotFound(false);
        setMyDisplayID(displayEntry?.[0] || "");
        setDisplayID(nextDisplay.id || "");
        setDisplay(nextDisplay);
        setTitle(nextDisplay.title || "");
        setDisplayType(nextDisplay.displayType || "singleElimination");
        setCompetitionID(nextDisplay.competitionID || "");
        setStyleID(nextDisplay.styleID || "");
        setCameraMode(nextDisplay.cameraMode || "auto");
        setCompetitions(nextCompetitions);
        setStyles(nextStyles);
        setDoneLoading(true);
    }

    async function saveDisplay() {
        if (!competitionID || !myDisplayID) {
            return;
        }

        setSaving(true);
        setSaveMessage("");
        try {
            await updateDynamicBracketGroupDisplay(myDisplayID, {
                cameraMode,
                competitionID,
                displayType,
                styleID,
                title,
            });
            setSaveMessage("Dynamic display saved.");
            await loadPage();
        }
        finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        loadPage();
    }, [routeParams.myDisplayID, routeParams.displayID]);

    if (!doneLoading) {
        return <LoadingPage />;
    }

    if (notFound) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <PageScaffold>
                    <ListPageHeader
                        title={"Dynamic display not found"}
                        description={"This dynamic bracket/group display could not be found under your account."}
                    />
                </PageScaffold>
            </NativeBaseProvider>
        );
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"} contentContainerStyle={{ paddingBottom: 36 }}>
                <PageScaffold>
                    <ListPageHeader
                        actionIcon={"content-save"}
                        actionLabel={"Save changes"}
                        description={"Manage which competition, style, and camera behavior this stable bracket/group display URL uses."}
                        onAction={saveDisplay}
                        title={title || "Manage dynamic display"}
                    />
                    {saveMessage ? (
                        <View backgroundColor={"green.50"} borderColor={"green.200"} borderRadius={8} borderWidth={1} marginX={3} marginBottom={2} padding={3}>
                            <Text color={"green.800"} fontWeight={"bold"}>{saveMessage}</Text>
                        </View>
                    ) : null}
                    <FieldSection title={"Stable production link"} subtitle={"Use this URL for your stream, TV, or venue display. Editing below keeps the same production URL."}>
                        <FormControl.Label>Production URL</FormControl.Label>
                        <Input
                            backgroundColor={"white"}
                            color={"gray.900"}
                            isReadOnly
                            InputRightElement={<CopyInputRightButton text={productionURL} />}
                            value={productionURL}
                        />
                        <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                            <Button borderRadius={8} marginRight={2} marginTop={1} onPress={() => window.open(productionURL, "_blank", "noopener,noreferrer")} variant={"outline"}>
                                <View alignItems={"center"} flexDirection={"row"}>
                                    <MaterialCommunityIcons name="open-in-new" size={16} color={openScoreboardColor} />
                                    <Text color={openScoreboardColor} fontWeight={"bold"} marginLeft={2}>Open display</Text>
                                </View>
                            </Button>
                        </View>
                    </FieldSection>
                    <FieldSection title={"Display setup"} subtitle={"Choose the display type and the competition data this URL should load."}>
                        <FormControl.Label>Display name</FormControl.Label>
                        <Input
                            backgroundColor={"white"}
                            color={"gray.900"}
                            onChangeText={setTitle}
                            placeholder={"Main TV bracket, lobby group board, etc."}
                            value={title}
                        />
                        <FormControl.Label marginTop={3}>Display type</FormControl.Label>
                        <Select selectedValue={displayType} onValueChange={setType}>
                            <Select.Item label="Single elimination bracket" value="singleElimination" />
                            <Select.Item label="Round robin group" value="roundRobin" />
                        </Select>
                        <FormControl.Label marginTop={3}>Competition</FormControl.Label>
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
                    </FieldSection>
                    <FieldSection title={"Look and motion"} subtitle={"Pick the reusable style and how the bracket/group camera should behave on display."}>
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
                        <FormControl.Label marginTop={3}>Camera behavior</FormControl.Label>
                        <Select selectedValue={cameraMode} onValueChange={setCameraMode}>
                            <Select.Item label="Auto pan through sections" value="auto" />
                            <Select.Item label="Fit whole bracket/group, no motion" value="fit" />
                        </Select>
                    </FieldSection>
                    <View backgroundColor={"blue.50"} borderColor={"blue.100"} borderRadius={8} borderWidth={1} margin={3} padding={3}>
                        <Text color={"blue.900"} fontSize={"sm"} fontWeight={"bold"}>Current display summary</Text>
                        <Text color={"blue.800"} fontSize={"sm"} marginTop={1}>
                            {getDisplayTypeLabel(displayType)} / {selectedCompetition ? getCompetitionTitle(selectedCompetition) : display?.competitionTitle || "No competition selected"} / {selectedStyle ? getStyleTitle(selectedStyle) : "Default style"} / {getCameraModeLabel(cameraMode)}
                        </Text>
                    </View>
                    <View marginX={3} marginTop={1}>
                        <Button backgroundColor={openScoreboardColor} borderRadius={8} isDisabled={!competitionID || saving} onPress={saveDisplay}>
                            {saving ? (
                                <Spinner color={openScoreboardButtonTextColor} size={"sm"} />
                            ) : (
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Save display</Text>
                            )}
                        </Button>
                    </View>
                </PageScaffold>
            </ScrollView>
        </NativeBaseProvider>
    );
}
