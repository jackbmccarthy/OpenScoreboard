import React, { useState } from 'react';
import { Button, View, Text, Input } from 'native-base';
import { scoreboardBaseURL } from '../../openscoreboard.config';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { deleteDynamicURL, openEmail } from '../functions/dynamicurls';
import CopyButton from '../components/CopyButton';

export function DynamicURLItem(props) {


    const matchInfo = props.item[1]
    let subTitle = ""
    let scoreKeepingURL
    if(props.isTeamMatch){
        scoreKeepingURL = `${window.location.origin}/teamscoring/teammatch/true/${matchInfo.teammatchID}/?name=${encodeURI(`${matchInfo.teamAName} VS ${matchInfo.teamBName}`)}`;
        
    }
    else{
   
    }

    if(matchInfo["tableID"] && matchInfo["tableID"].length >0){
        subTitle = "Table: " +matchInfo["tableName"]
        scoreKeepingURL = `${window.location.origin}/scoring/table/${matchInfo.tableID}/${matchInfo.tableName}/${matchInfo.password}`
    }
    else if (matchInfo["teammatchID"] && matchInfo["teammatchID"].length>0){
        subTitle = `Team Match: ${matchInfo["teamAName"]} vs ${matchInfo["teamBName"]} T${matchInfo["tableNumber"]}(${matchInfo["teamMatchStartTime"]})`
        scoreKeepingURL = `${window.location.origin}/teamscoring/teammatch/true/${matchInfo.teammatchID}/${matchInfo["tableNumber"]}/?name=${encodeURI(`${matchInfo.teamAName} VS ${matchInfo.teamBName}`)}`;

    }
    let [showDelete, setShowDelete] = useState(false)
    return (
        <View padding={1}>
            <View>
                <Text fontSize={"xl"} fontWeight={"bold"}>{props.item[1].dynamicURLName}</Text>
                <Text font={"sm"}>{subTitle}</Text>
            </View>
            <View>
                <Text >Scoreboard URL:</Text>
              <View flex={1} flexDirection={"row"} alignItems="center" >
                <Input flex={1} isReadOnly value={`${scoreboardBaseURL}/scoreboard/?dynid=${props.item[1].id}`}  ></Input>
                <CopyButton text={`${scoreboardBaseURL}/scoreboard/?dynid=${props.item[1].id}`}  ></CopyButton>
            </View>  
            </View>
            
            
            <Text >Score Keeping URL:</Text>
            <View flex={1} flexDirection={"row"} alignItems="center" >
                <Input flex={1} isReadOnly value={scoreKeepingURL}  ></Input>
                <CopyButton text={scoreKeepingURL}  ></CopyButton>
            </View>
            <View flexDirection={"row"} justifyContent="center" alignItems={"center"}>
                <View>
                    <Button
                        onPress={() => {
                            props.openEditDynamicURLModal(props.item[0], { ...props.item[1] });
                        }}
                        variant={"ghost"}>
                        <FontAwesome size={24} color={openScoreboardColor} name="edit"></FontAwesome>
                    </Button>
                </View>
                <View>
                    <Button
                        onPress={() => {

                            openEmail(subTitle, `Thank you for using ProScoreboard.\nPlease use the follow links below:\nScoreboard URL: ${`${scoreboardBaseURL}/scoreboard/?dynid=${props.item[1].id}`}\nScore Keeping URL: ${scoreKeepingURL} `)
                        }}
                        variant={"ghost"}>
                          
                        <MaterialCommunityIcons size={24} color={openScoreboardColor} name="email-fast-outline"></MaterialCommunityIcons>
                    </Button>
                </View>
                {
                    showDelete ?
                    <View flexDirection={"row"} alignItems="center"  >
                        <Text fontWeight={"bold"}>Delete?</Text>
                        <Button variant={"ghost"}
                        onPress={async ()=>{
                            await deleteDynamicURL(props.item[0])
                            props.reload()
                        }}
                        >
                            <Text>Yes</Text>
                        </Button>
                        <Button
                        onPress={()=>{
                            setShowDelete(false)
                        }}
                        >
                            <Text color={openScoreboardButtonTextColor}>No</Text>
                        </Button>
                    </View>
                    :
                   <View>
                    <Button
                        onPress={async () => {
                           setShowDelete(true)
                            
                        }}
                        variant={"ghost"}>
                        <FontAwesome size={24} color={openScoreboardColor} name="trash"></FontAwesome>
                    </Button>
                </View> 
                }
                
            </View>

        </View>
    );
}
