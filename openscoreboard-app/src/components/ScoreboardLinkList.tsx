import React, { useEffect, useState } from 'react';
import { View, Input, Text, Button, FormControl, ScrollView, FlatList } from 'native-base';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { getMyScoreboards } from '../functions/scoreboards';
import { getUserPath } from '../../database';
import LoadingPage from '../LoadingPage';
import { scoreboardBaseURL, subFolderPath } from '../../openscoreboard.config';
import { CopyInputRightButton } from './CopyButton';
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
        const tableParam = props.tableID ? `&table=${props.tableID}` : "";
        defaultScoreboardURL = `${scoreboardBaseURL}/scoreboard/?tmid=${props.teamMatchID}&t=table${tableParam}`
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
                        <Input
                            isReadOnly
                            InputRightElement={<CopyInputRightButton text={defaultScoreboardURL} />}
                            value={defaultScoreboardURL}
                        />
                    </FormControl>
                </View>
                <FlatList
                    data={myScoreboards}
                    renderItem={(scoreboard) => {
                        let scoreboardURL //= `${scoreboardBaseURL}/scoreboard/?sid=${scoreboard.item[1].id}&tid=${props.tableID}&t=table`
                        if (props.isTeamMatch) {
                            const tableParam = props.tableID ? `&table=${props.tableID}` : "";
                            scoreboardURL = `${scoreboardBaseURL}/scoreboard/?tmid=${props.teamMatchID}&t=table${tableParam}&sid=${scoreboard.item[1].id}`
                        }
                        else {
                            scoreboardURL = `${scoreboardBaseURL}/scoreboard/?tid=${props.tableID}&t=table&sid=${scoreboard.item[1].id}`
                        }
                        return (
                            <View>
                                <FormControl>
                                    <FormControl.Label>{scoreboard.item[1]["name"]}</FormControl.Label>
                                    <Input
                                        isReadOnly
                                        InputRightElement={<CopyInputRightButton text={scoreboardURL} />}
                                        value={scoreboardURL}
                                    />
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
