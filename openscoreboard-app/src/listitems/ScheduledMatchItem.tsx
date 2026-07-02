import React, { useState } from 'react';
import { View, Text, Button } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { deleteScheduledTableMatch } from '../functions/scoring';
import i18n from '../translations/translate';
import { MetadataPill, ResourceAction, ResourceCard } from '../components/ListPage';

function getPlayerName(value) {
    return value && value.length > 0 ? value : "TBD";
}

function getScheduledMatchTitle(match) {
    return `${getPlayerName(match?.playerA)} vs ${getPlayerName(match?.playerB)}`;
}

function getScheduledMatchTime(match) {
    const date = new Date(match?.startTime || "");

    if (Number.isNaN(date.getTime())) {
        return "Time not set";
    }

    return date.toLocaleString();
}

export function ScheduledMatchItem(props) {

    let [deleteMatch, setDeleteMatch] = useState(false);
    let [loadingDelete, setLoadingDelete] = useState(false);
    const { item } = props;
    const scheduledMatch = item?.[1] || {};
    return (
        <ResourceCard
            icon={(color) => <MaterialCommunityIcons name="calendar-clock" size={22} color={color} />}
            title={getScheduledMatchTitle(scheduledMatch)}
            subtitle={getScheduledMatchTime(scheduledMatch)}
            meta={(
                <>
                    {scheduledMatch.eventName ? <MetadataPill label={"Event"} value={scheduledMatch.eventName} /> : null}
                    {scheduledMatch.roundName || scheduledMatch.roundLabel ? <MetadataPill label={"Round"} value={scheduledMatch.roundName || scheduledMatch.roundLabel} /> : null}
                    {scheduledMatch.matchDetails ? <MetadataPill label={"Details"} value={scheduledMatch.matchDetails} /> : null}
                </>
            )}
        >
            {deleteMatch ? (
                <View backgroundColor={"red.50"} borderColor={"red.200"} borderRadius={8} borderWidth={1} marginTop={3} padding={3}>
                    <Text color={"red.800"} fontSize={"sm"} fontWeight={"bold"}>{i18n.t("areYouSureDeleteMatch")}?</Text>
                    <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                        <Button
                            backgroundColor={"red.700"}
                            borderRadius={8}
                            isDisabled={loadingDelete}
                            marginRight={2}
                            marginTop={2}
                            onPress={async () => {
                                setLoadingDelete(true);
                                await deleteScheduledTableMatch(props.route.params.tableID, item[0]);
                                setLoadingDelete(false);
                                props.reload();
                            }}
                        >
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("yes")}</Text>
                        </Button>
                        <Button
                            borderRadius={8}
                            marginTop={2}
                            onPress={() => {
                                setDeleteMatch(false);
                            }}
                            variant={"ghost"}
                        >
                            <Text color={"gray.700"} fontWeight={"bold"}>{i18n.t("no")}</Text>
                        </Button>
                    </View>
                </View>
            ) : (
                <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                    <ResourceAction
                        icon={(color) => <MaterialCommunityIcons name="pencil-outline" size={18} color={color} />}
                        label={"Edit"}
                        onPress={async () => {
                            props.setEditMatch({
                                matchID: scheduledMatch.matchID,
                                scheduledMatchID: item[0],
                                schedMatchStartTime: scheduledMatch.startTime
                            });
                            props.setShowEditScheduledMatch(true);
                        }}
                    />
                    <ResourceAction
                        icon={(color) => <MaterialCommunityIcons name="trash-can-outline" size={18} color={color} />}
                        label={"Delete"}
                        onPress={async () => {
                            setDeleteMatch(true);
                        }}
                        tone={"danger"}
                    />
                </View>
            )}
        </ResourceCard>
    );
}
