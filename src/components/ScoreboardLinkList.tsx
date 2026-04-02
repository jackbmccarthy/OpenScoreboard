import React, { useEffect, useState } from 'react';
import { View, Input, Text, Button, FormControl, ScrollView, FlatList } from 'native-base';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { getMyScoreboards } from '../functions/scoreboards';
import { getUserPath } from '../../database';
import LoadingPage from '../LoadingPage';
import { scoreboardBaseURL, subFolderPath } from '../../openscoreboard.config';
import CopyButton from './CopyButton';
import i18n from '../translations/translate';


export default function ScoreboardLinkList(props) {
    let [selectedIndex, setSelectedIndex] = useState("")
    let [loadingDone, setLoadingDone] = useState(false)
    let [myScoreboards, setMyScoreboards] = useState([])

    async function loadScoreboards() {
        setLoadingDone(false)
        let myScoreboard = await getMyScoreboards(getUserPath())
        setMyScoreboards(myScoreboard)
        setLoadingDone(true)
    }

    let defaultScoreboardURL
    if (props.isTeamMatch) {
        defaultScoreboardURL = `${scoreboardBaseURL}/scoreboard/?tmid=${props.teamMatchID}&t=table&table=${props.tableID}`
    }
    else {
        defaultScoreboardURL = `${scoreboardBaseURL}/scoreboard/?tid=${props.tableID}&t=table`
    }

    useEffect(() => {
        loadScoreboards()

    }, [])
    if (loadingDone) {
        return (

            <>
                <View>
                    <FormControl>
                        <FormControl.Label>{i18n.t("default")}</FormControl.Label>
                        <View flexDirection={"row"}>
                            <Input flex={1} isReadOnly value={defaultScoreboardURL}></Input>
                            <CopyButton text={defaultScoreboardURL}></CopyButton>
                        </View>
                    </FormControl>
                </View>
                <FlatList
                    data={myScoreboards}
                    renderItem={(scoreboard) => {
                        let scoreboardURL //= `${scoreboardBaseURL}/scoreboard/?sid=${scoreboard.item[1].id}&tid=${props.tableID}&t=table`
                        if (props.isTeamMatch) {
                            scoreboardURL = `${scoreboardBaseURL}/scoreboard/?tmid=${props.teamMatchID}&t=table&table=${props.tableID}&sid=${scoreboard.item[1].id}`
                        }
                        else {
                            scoreboardURL = `${scoreboardBaseURL}/scoreboard/?tid=${props.tableID}&t=table&sid=${scoreboard.item[1].id}`
                        }
                        return (
                            <View>
                                <FormControl>
                                    <FormControl.Label>{scoreboard.item[1]["name"]}</FormControl.Label>
                                    <View flexDirection={"row"}>
                                        <Input flex={1} isReadOnly value={scoreboardURL}></Input>
                                        <CopyButton text={scoreboardURL}></CopyButton>
                                    </View>
                                </FormControl>
                            </View>
                        )
                    }}
                />
            </>

        )
    }
    else {
        return <LoadingPage></LoadingPage>
    }

}