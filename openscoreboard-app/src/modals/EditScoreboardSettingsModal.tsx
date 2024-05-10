import React, { useEffect, useRef, useState } from 'react';
import { Button, Text, View, Modal, FormControl, Switch, Divider, Radio, Select } from 'native-base';
import { openScoreboardButtonTextColor, openScoreboardColor } from "../../openscoreboardtheme";
import { getScoreboardSettings, setScoreboardSettings } from '../functions/scoreboards';
import LoadingPage from '../LoadingPage';
import i18n from '../translations/translate';
export function EditScoreboardSettingsModal(props) {
    let [doneLoading, setDoneLoading] = useState(false)
    let [showDuringActiveMatch, setShowDuringActiveMatch] = useState(false)
    let [showDuringTimeOuts, setShowDuringTimeOuts] = useState(false)
    let [alwaysShow, setAlwaysShow] = useState(false)
    let [showInBetweenGames, setShowInBetweenGames] = useState(false)
    let [radioButtonSetting, setRadioButtonSetting] = useState("")

    let [loadingScoreboardSettings, setLoadingScoreboardSettings] = useState(false)
    async function loadScoreboardSettings() {
        setDoneLoading(false)
        let settings = await getScoreboardSettings(props.scoreboardID)
        setShowDuringActiveMatch(settings.showDuringActiveMatch)
        setShowDuringTimeOuts(settings.showDuringTimeOuts)
        setShowInBetweenGames(settings.showInBetweenGames)
        setAlwaysShow(settings.alwaysShow)
        if (settings.alwaysShow) {
            setRadioButtonSetting("alwaysShow")
        }
        if (settings.showInBetweenGames) {
            setRadioButtonSetting("showInBetweenGames")
        }
        if (settings.showDuringActiveMatch) {
            setRadioButtonSetting("showDuringActiveMatch")
        }

        setDoneLoading(true)
    }

    const onSelectedRadioButton = (selectedRadio) => {
        setRadioButtonSetting(selectedRadio)
        switch (selectedRadio) {
            case "alwaysShow":
                setAlwaysShow(true)
                setShowDuringActiveMatch(false)
                setShowInBetweenGames(false)
                break;

            case "showDuringActiveMatch":
                setShowDuringActiveMatch(true)
                setShowInBetweenGames(false)
                setAlwaysShow(false)
                break;
            case "showInBetweenGames":
                setShowDuringActiveMatch(false)
                setShowInBetweenGames(true)
                setAlwaysShow(false)
                break;

            default:
                setShowDuringActiveMatch(false)
                setShowInBetweenGames(false)
                break;
        }
    }

    useEffect(() => {
        loadScoreboardSettings()
    }, [])
    return (
        <Modal onClose={() => { props.onClose(); }} isOpen={props.isOpen}>
            <Modal.Content>
                <Modal.CloseButton></Modal.CloseButton>
                <Modal.Header>{i18n.t("scoreboardSettings")}</Modal.Header>
                <Modal.Body>
                    {
                        doneLoading ?


                            <View >
                                <FormControl>
                                    <FormControl.Label>{i18n.t("visibility")}:</FormControl.Label>
                                    <Select
                                        selectedValue={radioButtonSetting}
                                        onValueChange={onSelectedRadioButton}
                                    >
                                        <Select.Item value='alwaysShow' label={i18n.t("alwaysShow")}></Select.Item>
                                        <Select.Item value='showInBetweenGames' label={i18n.t("showInBetweenGames")} ></Select.Item>
                                        <Select.Item value='showDuringActiveMatch' label={i18n.t("showDuringGames")} ></Select.Item>
                                    </Select>
                                </FormControl>

                            </View>



                            : <LoadingPage></LoadingPage>

                    }

                    <View padding={1} alignItems="center" flexDirection={"row"}>
                        <View flex={1} padding={1}>
                            <Button
                                onPress={() => {
                                    setLoadingScoreboardSettings(true)
                                    setScoreboardSettings(props.scoreboardID, showDuringActiveMatch, showDuringTimeOuts, showInBetweenGames, alwaysShow)
                                    setLoadingScoreboardSettings(false)
                                    props.onClose()
                                }}
                            >
                                <Text color={openScoreboardButtonTextColor}>{i18n.t("save")}</Text>
                            </Button>
                        </View>
                        <View flex={1} padding={1}>
                            <Button variant={"ghost"}
                                onPress={() => {
                                    props.onClose()
                                }}
                            >
                                <Text >{i18n.t("close")}</Text>
                            </Button>
                        </View>
                    </View>

                </Modal.Body>

            </Modal.Content>
        </Modal>
    );
}
