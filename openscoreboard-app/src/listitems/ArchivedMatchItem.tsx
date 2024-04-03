import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Text, View, Spinner, Divider, Button } from 'native-base';
import { getMatchData, getSignificantPoints } from '../functions/scoring';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openScoreboardColor } from "../../openscoreboardtheme";
import i18n from '../translations/translate';

export function ArchivedMatchItem(props) {
    const index = props.index;
    const id = props.item[0];
    const matchDetails = props.item[1];

    let [significantPoints, setSignificantPoints] = useState()
    let [loadingSigPoints, setLoadingSigPoints] = useState()

    async function loadSigPoints(matchID){
        setLoadingSigPoints(true)
        let matchSigPoints = await getSignificantPoints(matchID)
        setSignificantPoints(matchSigPoints)
        setLoadingSigPoints(false)
        setSigPointsExpanded(true)
    }

    let [loadingAdditionalGameScores, setLoadingAdditionalGameScores] = useState(false);
    let [loadedGamesScores, setLoadedGameScores] = useState(false);
    let [expanded, setExpanded] = useState(false);
    let [sigPointsExpanded, setSigPointsExpanded] = useState(false)
    let [additionalFields, setAdditionalFields] = useState({});

    return (
        <View>
            <TouchableOpacity
            >
                <View flex={1} padding={1}>
                    <View justifyContent={"space-between"} alignItems="center" flexDirection={"row"}>
                        <View flex={1} >
                            <Text textAlign={"center"} fontSize={"md"}>{matchDetails["playerA"]}</Text>
                        </View>
                        <View>
                            <Text textAlign={"center"} fontSize={"md"}><Text fontWeight={"bold"}>{matchDetails["AScore"]}</Text> - <Text fontWeight={"bold"}>{matchDetails["BScore"]}</Text></Text>
                        <View padding={1}>

                        

                    </View>
                    </View>
                        <View flex={1} >
                            <Text textAlign={"center"} fontSize={"md"}>{matchDetails["playerB"]}</Text>
                        </View>

                    </View>
                    
                </View>
                <View padding={1} flexDirection={"row"} justifyContent="center" >
                    <View>
                        <Button
                       onPress={async () => {
                        if (loadedGamesScores === false) {
                            setLoadingAdditionalGameScores(true);
                            let matchInfo = await getMatchData(matchDetails.matchID);
                            setAdditionalFields(matchInfo);
                            setLoadingAdditionalGameScores(false);
                            setLoadedGameScores(true);
                            setExpanded(expanded ? false : true);
    
                        }
                        else {
                            setExpanded(expanded ? false : true);
                        }
    
    
                    }}
                        variant={"ghost"}>
                            {
                                expanded ?
                                <MaterialCommunityIcons name="arrow-collapse-vertical" size={24} color={openScoreboardColor}  />

                                :
                        <MaterialCommunityIcons name="arrow-expand-vertical" size={24} color={openScoreboardColor}  />

                            }

                        </Button>

                    </View>
                <View padding={1}>
                    <Button
                    onPress={()=>{
                        if(sigPointsExpanded){
                            setSigPointsExpanded(false)
                        }
                        else{
                            loadSigPoints(matchDetails.matchID)
                            setSigPointsExpanded(true)
                        }
                        
                    }}
                    variant={"ghost"}>
                     <MaterialCommunityIcons name="hand-clap" size={24} color={openScoreboardColor} />   
                    </Button>
                
                </View>
                </View>

                <View  justifyContent="center" alignItems={"center"}>
                    {expanded ?


                        loadingAdditionalGameScores ?
                            <Spinner></Spinner> :

                            [1, 2, 3, 4, 5, 6, 7, 8, 9].map((numb) => {
                                if (additionalFields[`isGame${numb}Started`]) {
                                    return (
                                        <View width={"100%"} flex={1} key={`game${numb}`}>
                                            <View padding={1} justifyContent={"space-evenly"} alignItems={"center"} flexDirection={"row"}>
                                                <View padding={2}>
                                                    <Text textAlign={"center"}  fontSize={"lg"} fontWeight="bold">{additionalFields[`game${numb}AScore`]}</Text>
                                                </View>
                                                <View padding={2}>
                                                    <Text>{i18n.t("game")} {numb}</Text>
                                                </View>
                                                <View padding={2}>
                                                    <Text textAlign={"center"}  fontSize={"lg"} fontWeight="bold">{additionalFields[`game${numb}BScore`]}</Text>
                                                </View>
                                            </View>
                                            <Divider></Divider>
                                        </View>
                                    );
                                }
                            })



                        : null}
                        {sigPointsExpanded ?


loadingSigPoints ?
    <Spinner></Spinner> :
           
    significantPoints.length > 0 ?
    <>
    <Text fontWeight={"bold"} textAlign={"center"}>{i18n.t("significantPoints")}</Text>
    {
       significantPoints.map((sigPoint) => {
            return (
                <View width={"100%"} flex={1} key={sigPoint[0]}>
                    <View padding={1} justifyContent={"space-evenly"} alignItems={"center"} flexDirection={"row"}>
                        <View padding={2}>
                            <Text textAlign={"center"}  fontSize={"lg"} fontWeight="bold">{sigPoint[1].playerAScore}</Text>
                        </View>
                        <View padding={2}>
                            <Text>{i18n.t("game")} {sigPoint[1].gameNumber} </Text>
                        </View>
                        <View padding={2}>
                            <Text textAlign={"center"}  fontSize={"lg"} fontWeight="bold">{sigPoint[1].playerBScore}</Text>
                        </View>
                    </View>
                    <Divider></Divider>
                </View>
            );
        
    }) 
    }
    </>
    
    :
    <Text>{i18n.t("noSignificantPoints")}</Text>



: null}


                </View>

            </TouchableOpacity>

        </View>
    );
}
