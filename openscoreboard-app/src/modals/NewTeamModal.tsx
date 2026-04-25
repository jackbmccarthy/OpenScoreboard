import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Dialog } from 'heroui-native/dialog';
import { Input } from 'heroui-native/input';
import { Spinner } from 'heroui-native/spinner';
import { openScoreboardColor } from "../../openscoreboardtheme";
import { addNewTeam, getTeam, updateMyTeam, updateTeam } from '../functions/teams';
import { newImportedPlayer } from '../classes/Player';
import { newTeam } from '../classes/Team';
import { v4 as uuidv4 } from 'uuid';
import { TeamPlayerItem } from '../listitems/TeamPlayerItem';
import i18n from '../translations/translate';

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
        if (!props.isEditingTeam && (!teamName || teamName.trim().length === 0)) {
            return;
        }
        if (props.isEditingTeam) {
            setLoadingNewTeam(true);
            try {
                await updateTeam(props.editingTeamID, { ...editingTeam.current, teamName: teamName, teamLogoURL: teamLogoURL, players: JSON.parse(JSON.stringify(players)) });
                await updateMyTeam(props.editingMyTeamID, teamName);
                props.onClose();
            }
            finally {
                setLoadingNewTeam(false);
            }
        }
        else {
            setLoadingNewTeam(true);
            try {
                let formattedTeam = newTeam(teamName.trim(), teamLogoURL, players);
                await addNewTeam(formattedTeam);
                props.onClose();
            }
            finally {
                setLoadingNewTeam(false);
            }
        }

    }

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
                setLoadingEditTeam(false);

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

    }, [props.editingTeamID, props.isEditingTeam]);

    useEffect(() => {
        setTimeout(() => {
            if (teamNameRef.current?.focus) {
                teamNameRef.current.focus()
            }
        }, 200);


    }, [])

    useEffect(() => {
        setTimeout(() => {
            if (showAddPlayer && firstNameRef.current?.focus) {
                firstNameRef.current.focus()

            }

        }, 200);


    }, [showAddPlayer])

    const resetPlayerDraft = () => {
        setFirstName("");
        setLastName("");
        setImageURL("");
    }

    return (
        <Dialog
            isOpen={props.isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    props.onClose(false);
                    setShowAddPlayer(false);
                }
            }}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content>
                    <Dialog.Close />
                    <Dialog.Title>{showAddPlayer ? i18n.t("addTeamPlayer") : i18n.t("newTeam")}</Dialog.Title>
                    <Text style={styles.description}>{showAddPlayer ? "Add a player to this roster before saving the team." : "Create or edit a team identity with logo and player roster."}</Text>
                    {loadingEditTeam ?
                        <View style={styles.loadingWrap}>
                            <Spinner />
                        </View>
                        :
                        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                            {showAddPlayer ?
                                <View style={styles.formStack}>
                                    <Text style={styles.label}>{i18n.t("firstName")}<Text style={styles.required}>*</Text></Text>
                                    <Input ref={firstNameRef} value={firstName} onChangeText={setFirstName}></Input>
                                    <Text style={styles.label}>{i18n.t("lastName")}</Text>
                                    <Input value={lastName} onChangeText={setLastName}></Input>
                                    <Text style={styles.label}>{i18n.t("imageURL")}</Text>
                                    <Input value={imageURL} onChangeText={setImageURL}></Input>

                                    <View style={styles.rowButtons}>
                                        <Button
                                            style={styles.rowButton}
                                            onPress={async () => {
                                                setPlayers({ ...players, [uuidv4()]: newImportedPlayer(firstName, lastName, imageURL, "") });
                                                setShowAddPlayer(false);
                                                resetPlayerDraft();
                                            }}
                                        >
                                            <Button.Label>{i18n.t("add")}</Button.Label>
                                        </Button>
                                        <Button variant={"outline"}
                                            style={styles.rowButton}
                                            onPress={async () => {
                                                setShowAddPlayer(false);
                                                resetPlayerDraft();
                                            }}
                                        >
                                            <Button.Label style={{ color: openScoreboardColor }}>{i18n.t("back")}</Button.Label>
                                        </Button>
                                    </View>

                                </View> :
                                <View style={styles.formStack}>
                                    <Text style={styles.label}>{i18n.t("teamName")}</Text>
                                    <Input
                                        onSubmitEditing={(event) => {
                                            if (!showAddPlayer && teamName.length > 0) {
                                                onAddTeam()
                                            }
                                        }}
                                        ref={teamNameRef} value={teamName} onChangeText={setTeamName}></Input>
                                    <Text style={styles.label}>{i18n.t("teamLogoURL")}</Text>
                                    <Input value={teamLogoURL} onChangeText={setTeamLogoURL}></Input>
                                    <View style={styles.playersHeader}>
                                        <Text style={styles.label}>{i18n.t("players")}</Text>
                                        <Button
                                            isIconOnly
                                            variant={"ghost"}
                                            onPress={() => {
                                                setShowAddPlayer(true);
                                            }}
                                        >
                                            <Button.Label>+</Button.Label>
                                        </Button>
                                    </View>
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
                                                    onDelete={(id) => {
                                                        let newPlayerList = { ...players };
                                                        delete newPlayerList[id]
                                                        setPlayers(newPlayerList);
                                                    }}
                                                    id={player[0]} {...player[1]}></TeamPlayerItem>
                                            </View>
                                        );
                                    })}
                                </View>
                            }
                        </ScrollView>
                    }
                    <View style={styles.footer}>
                        <Pressable
                            disabled={showAddPlayer || loadingNewTeam || teamName.trim().length === 0}
                            onPress={async () => {
                                await onAddTeam();
                            }}
                            style={({ pressed }) => [
                                styles.primaryAction,
                                pressed ? styles.actionPressed : null,
                                showAddPlayer || loadingNewTeam || teamName.trim().length === 0 ? styles.actionDisabled : null,
                            ]}
                        >
                            {loadingNewTeam ?
                                <Spinner></Spinner>
                                :
                                <Text style={styles.primaryActionLabel}>{props.isEditingTeam ? i18n.t("save") : i18n.t("add")}</Text>}

                        </Pressable>
                        <Pressable
                            onPress={() => {
                                setShowAddPlayer(false);
                                props.onClose(false);
                            }}
                            style={({ pressed }) => [styles.secondaryAction, pressed ? styles.actionPressed : null]}
                        ><Text style={styles.secondaryActionLabel}>{i18n.t("close")}</Text>
                        </Pressable>
                    </View>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}

const styles = StyleSheet.create({
    loadingWrap: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: 120,
    },
    scroll: {
        maxHeight: 440,
        width: "100%",
    },
    scrollContent: {
        paddingTop: 8,
    },
    formStack: {
        gap: 6,
    },
    label: {
        color: "#374151",
        fontSize: 13,
        fontWeight: "600",
        marginTop: 4,
    },
    description: {
        color: "#6b7280",
        lineHeight: 20,
        marginBottom: 10,
    },
    required: {
        color: "#dc2626",
    },
    rowButtons: {
        flexDirection: "row",
        gap: 10,
        marginTop: 12,
    },
    rowButton: {
        flex: 1,
    },
    playersHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 4,
    },
    footer: {
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
        marginTop: 18,
    },
    primaryAction: {
        alignItems: "center",
        backgroundColor: "#2563eb",
        borderRadius: 10,
        justifyContent: "center",
        minHeight: 42,
        minWidth: 96,
        paddingHorizontal: 18,
    },
    primaryActionLabel: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "700",
    },
    secondaryAction: {
        alignItems: "center",
        backgroundColor: "#e5e7eb",
        borderRadius: 10,
        justifyContent: "center",
        minHeight: 42,
        minWidth: 96,
        paddingHorizontal: 18,
    },
    secondaryActionLabel: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "700",
    },
    actionPressed: {
        opacity: 0.8,
    },
    actionDisabled: {
        opacity: 0.55,
    },
});
