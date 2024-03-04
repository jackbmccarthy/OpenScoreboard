import React, { useEffect, useRef, useState } from 'react';
import { Button, View, Modal, AddIcon, FormControl, Input, Text, Spinner } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { addNewTeam, getTeam, updateMyTeam, updateTeam } from '../functions/teams';
import { newImportedPlayer } from '../classes/Player';
import { newTeam } from '../classes/Team';
import { v4 as uuidv4 } from 'uuid';
import { TeamPlayerItem } from '../listitems/TeamPlayerItem';

export function NewTeamModal(props) {

    let [loadingNewTeam, setLoadingNewTeam] = useState(false);
    let [loadingEditTeam, setLoadingEditTeam] = useState(false);

    let [teamName, setTeamName] = useState("");
    let [teamLogoURL, setTeamLogoURL] = useState("");
    let [players, setPlayers] = useState({});

    let editingTeam = useRef({});

    let [showAddPlayer, setShowAddPlayer] = useState(false);

    let [firstName, setFirstName] = useState("");
    let [lastName, setLastName] = useState("");
    let [imageURL, setImageURL] = useState("");

    let teamNameRef = useRef()
    let firstNameRef = useRef()

    const onAddTeam = async () => {
        if (props.isEditingTeam) {
            setLoadingNewTeam(true);
            await updateTeam(props.editingTeamID, { ...editingTeam.current, teamName: teamName, teamLogoURL: teamLogoURL, players: JSON.parse(JSON.stringify(players)) });
            await updateMyTeam(props.editingMyTeamID, teamName);
            setLoadingNewTeam(false);

            props.onClose();
        }
        else {
            setLoadingNewTeam(true);
            let formattedTeam = newTeam(teamName, teamLogoURL, players);
            await addNewTeam(formattedTeam);
            props.onClose();

            setLoadingNewTeam(false);
        }

    }

    // useEffect(() => {
    //     setPlayers(props.players || [])
    //     setTeamName(props.teamName || "")
    //     setTeamLogoURL(props.teamLogoURL || "")
    // }, [props.teamName, props.teamLogoURL, props.players])
    useEffect(() => {
        async function loadEditTeam(teamID) {
            if (props.isEditingTeam) {
                setLoadingEditTeam(true);
                let team = await getTeam(teamID);
                editingTeam.current = team;
                const { teamName, teamLogoURL, players } = team;
                setTeamName(teamName);
                setTeamLogoURL(teamLogoURL);
                setPlayers(players);

            }
            else {
                setTeamName("");
                setLoadingEditTeam(false);
                setTeamLogoURL("");
                setPlayers({});
                editingTeam.current = null;
            }
        }
        loadEditTeam(props.editingTeamID);

    }, [props.isEditingTeam]);

    useEffect(()=>{
        setTimeout(() => {
            document.getElementById(teamNameRef.current.id).focus()
        }, 200);
        

    }, [])

    useEffect(()=>{
        setTimeout(() => {
            if(showAddPlayer){
            document.getElementById(firstNameRef.current.id).focus()

            }
            
        }, 200);
        

    }, [showAddPlayer])

    return (
        <Modal
        
        onClose={() => {
            props.onClose(false);
            setShowAddPlayer(false);
        }} isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{showAddPlayer ? "Add Team Player" : "New Team"}</Modal.Header>
                <Modal.Body>
                    {showAddPlayer ?
                        <FormControl>
                            <FormControl.Label>First Name<Text color={"red"}>*</Text></FormControl.Label>
                            <Input ref={firstNameRef} value={firstName} onChangeText={setFirstName}></Input>
                            <FormControl.Label>Last Name</FormControl.Label>
                            <Input value={lastName} onChangeText={setLastName}></Input>
                            <FormControl.Label>Image URL</FormControl.Label>
                            <Input value={imageURL} onChangeText={setImageURL}></Input>


                            {/* <FormControl.Label>Country</FormControl.Label> */}
                            <View flexDir={"row"}>
                                <View padding={1} flex={1}>
                                    <Button
                                        onPress={async () => {
                                            setPlayers({ ...players, [uuidv4()]: newImportedPlayer(firstName, lastName, imageURL, "") });
                                            setShowAddPlayer(false);
                                            setFirstName("");
                                            setLastName("");
                                            setImageURL("")
                                        }}
                                    >
                                        <Text color={openScoreboardButtonTextColor}>Add</Text>
                                    </Button>
                                </View>
                                <View padding={1} flex={1}>
                                    <Button variant={"outline"}
                                        onPress={async () => {
                                            setShowAddPlayer(false);
                                            setFirstName("");
                                            setLastName("");
                                            setImageURL("")
                                        }}
                                    >
                                        <Text color={openScoreboardColor}>Back</Text>
                                    </Button>
                                </View>
                            </View>

                        </FormControl> :
                        <FormControl>
                            <FormControl.Label>Team Name</FormControl.Label>
                            <Input
                            onSubmitEditing={(event)=>{
                                if(!showAddPlayer && teamName.length > 0){
                                    onAddTeam()
                                }
                            }}
                            ref={teamNameRef} value={teamName} onChangeText={setTeamName}></Input>
                            <FormControl.Label>Team Logo URL</FormControl.Label>
                            <Input value={teamLogoURL} onChangeText={setTeamLogoURL}></Input>
                            <FormControl.Label>Players</FormControl.Label>
                            {players && Object.entries(players).map((player, index) => {
                                return (
                                    <View key={player[0]}>
                                        <TeamPlayerItem
                                            onUpdate={(id, player) => {
                                                let newPlayerList = { ...players, [id]: player };
                                                setPlayers(newPlayerList);
                                            }}
                                            onSave={(player) => {
                                                let newPlayerList = { ...players, [uuidv4()]: player };
                                                setPlayers(newPlayerList);
                                            }}
                                            onDelete={(id)=>{
                                                let newPlayerList = { ...players};
                                                delete newPlayerList[id]
                                                setPlayers(newPlayerList);
                                            }}
                                            id={player[0]} {...player[1]}></TeamPlayerItem>
                                    </View>
                                );
                            })}
                            <Button
                                onPress={() => {
                                    setShowAddPlayer(true);
                                }}
                            >
                                <AddIcon color={openScoreboardButtonTextColor}></AddIcon>
                            </Button>
                        </FormControl>
                    }

                </Modal.Body>
                <Modal.Footer>
                    <View padding={1}>
                        <Button disabled={showAddPlayer}
                            onPress={async () => {
                                if (props.isEditingTeam) {
                                    setLoadingNewTeam(true);
                                    await updateTeam(props.editingTeamID, { ...editingTeam.current, teamName: teamName, teamLogoURL: teamLogoURL, players: JSON.parse(JSON.stringify(players)) });
                                    await updateMyTeam(props.editingMyTeamID, teamName);
                                    setLoadingNewTeam(false);

                                    props.onClose();
                                }
                                else {
                                    setLoadingNewTeam(true);
                                    let formattedTeam = newTeam(teamName, teamLogoURL, players);
                                    await addNewTeam(formattedTeam);
                                    props.onClose();

                                    setLoadingNewTeam(false);
                                }

                            }}
                        >
                            {loadingNewTeam ?
                                <Spinner></Spinner>
                                :
                                <Text color={openScoreboardButtonTextColor}>{props.isEditingTeam ? "Save" : "Add"}</Text>}

                        </Button>
                    </View>
                    <View padding={1}>
                        <Button

                            variant={"ghost"}
                            onPress={() => {
                                setShowAddPlayer(false);
                                props.onClose(false);
                            }}
                        ><Text>Close</Text>
                        </Button>
                    </View>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
