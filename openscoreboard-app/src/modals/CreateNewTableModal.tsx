import React, { Component, useEffect, useRef, useState } from 'react';
import {View,  Input, Item, Label, Text, Button, DatePicker, Left, Right, ListItem, NativeBaseProvider, Modal, FormControl, Divider, Select, Spinner, } from 'native-base';
import { ScrollView, Platform, Dimensions } from 'react-native';

//import DatePicker from 'react-native-datepicker';
import db, { getUserPath } from '../../database';
import { openScoreboardTheme } from "../../openscoreboardtheme";
import Table from '../classes/Table';
import { getMyPlayerLists } from '../functions/players';
import { supportedSports } from '../functions/sports';
import { createNewTable } from '../functions/tables';




export default function CreateNewTableModal(props){

    let [tableName, setTableName] = useState("")
    let [isLoadingTable, setIsLoadingTable] = useState(false)
let [myPlayerLists, setMyPlayerLists] = useState([])
    let [selectedPlayerListID, setSelectedPlayerListID] = useState("")
    let [selectedSport, setSelectedSport] = useState("tableTennis")
    let [selectedScoringType, setSelectedScoringType] = useState("")

    let tableNameInput = useRef()


    async function loadPlayerLists(){
   
        let playerLists = await getMyPlayerLists()
        setMyPlayerLists(playerLists)

    }

    useEffect(()=>{
        loadPlayerLists()
        setTimeout(() => {
            document.getElementById(tableNameInput.current.id).focus()
        }, 200);
        
    }, [])

    return (

    <Modal avoidKeyboard isOpen={props.isOpen} onClose={() => { props.onClose()}}>
                    <Modal.Content>
                        <Modal.CloseButton></Modal.CloseButton>
                        <Modal.Header>New Table</Modal.Header>
                        <Modal.Body>
                            <FormControl >
                                <FormControl.Label>Table Name</FormControl.Label>
                                <Input ref={tableNameInput} onChangeText={setTableName} />
                            </FormControl>
                            {
                        
                        myPlayerLists.length > 0 ?
<FormControl>
                        <FormControl.Label>Select Player List</FormControl.Label>

                        <Select onValueChange={(text)=>{
                            setSelectedPlayerListID(text)
                        }} selectedValue={selectedPlayerListID}>
                            {
                                myPlayerLists.map((playerList)=>{
                                    return (
                                        <Select.Item key={playerList[1].id} label={playerList[1].playerListName} value={playerList[1].id} />
                                    )
                                })
                            }
                        </Select>

                        
                    </FormControl>
                    :
                    null
                    }
                    <FormControl>
                        <FormControl.Label>
                            Sport
                        </FormControl.Label>
                        <Select selectedValue={selectedSport}
                        onValueChange={(sport)=>{
                            setSelectedSport(sport)
                            if( supportedSports[sport]?.hasScoringTypes){
                                setSelectedScoringType(Object.keys(supportedSports[sport]?.scoringTypes)[0])
                            }
                        }}
                        >
                                {
                                    Object.entries(supportedSports).map(([id, {displayName}])=>{
                                        return <Select.Item label={displayName} value={id}></Select.Item>
                                    })
                                }
                            </Select>

                            {
                                supportedSports[selectedSport]?.hasScoringTypes ?
<>
<FormControl.Label>
                            Scoring Type
                        </FormControl.Label>
                        <Select selectedValue={selectedScoringType}
                        onValueChange={(type)=>{
                            setSelectedScoringType(type)
                        }}
                        >
                                {
                                    Object.entries(supportedSports[selectedSport]?.scoringTypes || {}).map(([id, {displayName}])=>{
                                        return <Select.Item label={displayName} value={id}></Select.Item>
                                    })
                                }
                            </Select>
</>

                                :null
                            }
                    </FormControl>


                            <View padding={2} >
                               <Button onPress={async () => {
                                setIsLoadingTable(true)
                                await createNewTable(tableName, selectedPlayerListID, selectedSport, selectedScoringType)
                                setIsLoadingTable(false)
                                props.onClose(true)

                            }} >
                                {
                                    isLoadingTable ?
                                    <Spinner></Spinner>:
                                    <Text color={"white"}>Create Table</Text>
                                }
                                
                            </Button> 
                            </View>
                            
                        </Modal.Body>
                    </Modal.Content>
                </Modal>



    )
}

