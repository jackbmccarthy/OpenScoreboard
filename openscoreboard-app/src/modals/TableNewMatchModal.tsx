import React, { Component, useState } from 'react';
import { Icon, Button, Text, Modal, FormControl,View, Spinner, } from 'native-base';
import { openScoreboardButtonTextColor } from "../../openscoreboardtheme";
import { createNewMatch } from '../functions/scoring';
import { createTeamMatchNewMatch } from '../functions/teammatches';
import { supportedSports } from '../functions/sports';


export default function TableNewMatchModal(props){

    let [selectedGames, setSelectedGames] = useState(supportedSports[props.route.params.sportName]?.defaults?.bestOf )
    let [loadingNewMatch, setLoadingNewMatch] = useState(false)




    return (
        <Modal avoidKeyboard isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>Create New Match</Modal.Header>
                <Modal.Body>
                    <Text>A match has not been created for this table/court yet.</Text>
                </Modal.Body>
                <Modal.Footer>
                    <Button disabled={loadingNewMatch}
                    onPress={ async()=>{
                        setLoadingNewMatch(true)
                        if(props.isTeamMatch === true){
                            await createTeamMatchNewMatch(props.teamMatchID, props.tableNumber, props.route.params.sportName, null,props.route.params.scoringType)
                        }
                        else {
                            await createNewMatch(props.route.params.tableID, props.route.params.sportName, null, null, props.route.params.scoringType)
                        }
                        
                        
                        props.onClose()
                        setLoadingNewMatch(false)
                    }}
                    >
                        {loadingNewMatch ? 
                        <Spinner color={openScoreboardButtonTextColor}></Spinner>
                        :
                        <Text color={openScoreboardButtonTextColor}>Create Match</Text>

                    }
                        
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    )
}