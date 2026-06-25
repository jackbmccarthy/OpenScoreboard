import React, { useState } from 'react';
import { Button, View, Text, Input } from 'native-base';
import { scoreboardBaseURL } from '../../openscoreboard.config';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { deleteDynamicURL, openEmail } from '../functions/dynamicurls';
import { CopyInputRightButton } from '../components/CopyButton';
import i18n from '../translations/translate';

function getTargetInfo(matchInfo) {
    if (matchInfo["tableID"] && matchInfo["tableID"].length > 0) {
        return {
            title: matchInfo["tableName"] || "Table",
            targetLabel: "Table / Court",
            targetValue: matchInfo["tableName"] || "TBD",
            scoreKeepingURL: `${window.location.origin}/scoring/table/${matchInfo.tableID}/${matchInfo.tableName}/${matchInfo.password}`,
        };
    }

    if (matchInfo["teammatchID"] && matchInfo["teammatchID"].length > 0) {
        const teamMatchName = `${matchInfo["teamAName"] || "Team A"} vs ${matchInfo["teamBName"] || "Team B"}`;

        return {
            title: teamMatchName,
            targetLabel: i18n.t("teamMatch"),
            targetValue: matchInfo["tableNumber"] ? `${teamMatchName} - Table ${matchInfo["tableNumber"]}` : teamMatchName,
            scoreKeepingURL: matchInfo["tableNumber"] ?
                `${window.location.origin}/teamscoring/teammatch/true/${matchInfo.teammatchID}/${matchInfo["tableNumber"]}/?name=${encodeURI(`${matchInfo.teamAName} VS ${matchInfo.teamBName}`)}` :
                "",
        };
    }

    return {
        title: "No target selected",
        targetLabel: "Target",
        targetValue: "Unassigned",
        scoreKeepingURL: "",
    };
}

function InfoRow({ label, value }) {
    return (
        <View alignItems={"center"} flexDir={"row"} marginTop={2}>
            <View
                backgroundColor={"blue.50"}
                borderColor={"blue.100"}
                borderRadius={999}
                borderWidth={1}
                minW={104}
                paddingX={2}
                paddingY={1}
            >
                <Text color={"blue.700"} fontSize={"2xs"} fontWeight={"bold"} textAlign={"center"} textTransform={"uppercase"}>
                    {label}
                </Text>
            </View>
            <Text color={"gray.900"} flex={1} fontSize={"sm"} fontWeight={"bold"} marginLeft={3} numberOfLines={1}>{value}</Text>
        </View>
    );
}

function LinkField({ label, value }) {
    return (
        <View marginTop={2}>
            <Text color={"gray.700"} fontSize={"sm"} fontWeight={"bold"} marginBottom={1}>{label}</Text>
            <Input
                backgroundColor={"white"}
                borderColor={"gray.300"}
                color={"gray.900"}
                isReadOnly
                InputRightElement={<CopyInputRightButton text={value} />}
                value={value}
            />
        </View>
    );
}

function ActionButton({ icon, label, onPress, tone = "default" }) {
    const isDanger = tone === "danger";

    return (
        <Button
            backgroundColor={"white"}
            borderColor={isDanger ? "red.200" : "blue.100"}
            borderRadius={8}
            borderWidth={1}
            marginRight={2}
            marginTop={2}
            onPress={onPress}
            variant={"outline"}
        >
            <View alignItems={"center"} flexDir={"row"}>
                {icon(isDanger ? "#B91C1C" : openScoreboardColor)}
                <Text color={isDanger ? "red.700" : "blue.700"} fontSize={"sm"} fontWeight={"bold"} marginLeft={2}>{label}</Text>
            </View>
        </Button>
    );
}

export function DynamicURLItem(props) {
    const matchInfo = props.item[1]
    const targetInfo = getTargetInfo(matchInfo)
    const scoreboardURL = `${scoreboardBaseURL}/scoreboard/?dynid=${matchInfo.id}`;
    const scoreboardName = matchInfo.scoreboardName || (matchInfo.scoreboardID ? "Custom scoreboard" : "Default scoreboard");
    const emailSubject = `${matchInfo.dynamicURLName} - ${targetInfo.title}`;

    let [showDelete, setShowDelete] = useState(false)

    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginX={3}
            marginY={2}
            padding={3}
        >
            <View flexDir={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                <View flex={1} minW={220} paddingRight={3}>
                    <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"} numberOfLines={1}>
                        {matchInfo.dynamicURLName}
                    </Text>
                </View>
            </View>

            <View
                marginTop={2}
            >
                <InfoRow label={targetInfo.targetLabel} value={targetInfo.targetValue} />
                <InfoRow label={"Scoreboard"} value={scoreboardName} />
            </View>

            <LinkField label={i18n.t("scoreboardURL")} value={scoreboardURL} />
            {targetInfo.scoreKeepingURL ? <LinkField label={i18n.t("scoreKeepingURL")} value={targetInfo.scoreKeepingURL} /> : null}

            {showDelete ? (
                <View
                    backgroundColor={"red.50"}
                    borderColor={"red.200"}
                    borderRadius={8}
                    borderWidth={1}
                    marginTop={3}
                    padding={3}
                >
                    <Text color={"red.800"} fontSize={"sm"} fontWeight={"bold"}>{i18n.t("deleteDynamicURL")}?</Text>
                    <View flexDir={"row"} marginTop={3}>
                        <Button
                            backgroundColor={"red.700"}
                            borderRadius={8}
                            onPress={async () => {
                                await deleteDynamicURL(props.item[0])
                                props.reload()
                            }}
                        >
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("yes")}</Text>
                        </Button>
                        <Button
                            marginLeft={2}
                            onPress={() => {
                                setShowDelete(false)
                            }}
                            variant={"ghost"}
                        >
                            <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("no")}</Text>
                        </Button>
                    </View>
                </View>
            ) : (
                <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                    <ActionButton
                        icon={(color) => <FontAwesome size={16} color={color} name="edit" />}
                        label={"Edit"}
                        onPress={() => {
                            props.openEditDynamicURLModal(props.item[0], { ...matchInfo });
                        }}
                    />
                    <ActionButton
                        icon={(color) => <MaterialCommunityIcons size={18} color={color} name="email-fast-outline" />}
                        label={"Email"}
                        onPress={() => {
                            openEmail(
                                emailSubject,
                                `${i18n.t("emailMessage")}:\n${i18n.t("scoreboardURL")}: ${scoreboardURL}${targetInfo.scoreKeepingURL ? `\n${i18n.t("scoreKeepingURL")}: ${targetInfo.scoreKeepingURL}` : ""} `
                            )
                        }}
                    />
                    <ActionButton
                        icon={(color) => <FontAwesome size={16} color={color} name="trash" />}
                        label={"Delete"}
                        onPress={() => {
                            setShowDelete(true)
                        }}
                        tone={"danger"}
                    />
                </View>
            )}
        </View>
    );
}
