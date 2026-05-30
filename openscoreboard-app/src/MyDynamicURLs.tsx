

import React, { useEffect, useState } from 'react';
import { Button, View, NativeBaseProvider, FlatList, Text } from 'native-base';

import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";

import LoadingPage from './LoadingPage';
import { getMyDynamicURLs } from './functions/dynamicurls';
import { DynamicURLItem } from './listitems/DynamicURLItem';
import { EditDynamicURLModal } from './modals/EditDynamicURLModal';
import { CreateDynamicURLModal } from './modals/CreateDynamicURLModal';
import i18n from './translations/translate';
import { HeaderActions, HeaderIconButton } from './components/HeaderActions';

export default function MyDynamicURLs(props) {

    let [showNewDynamicURLModal, setShowNewDynamicURLModal] = useState(false)
    let [doneLoading, setDoneLoading] = useState(false)
    let [dynamicURLList, setDynamicURLList] = useState([])
    let [showEditDynamicURLModal, setShowEditDynamicModal] = useState(false)
    let [editDynamicURL, setEditDynamicURL] = useState({})


    async function loadMyDynamicURLs() {
        setDoneLoading(false)
        let myURLs = await getMyDynamicURLs(true)
        setDynamicURLList(myURLs)
        setDoneLoading(true)
    }

    const openEditDynamicURLModal = (myDynamicURLID, dynamicURLSettings) => {
        setEditDynamicURL({ ...dynamicURLSettings, myID: myDynamicURLID })
        setShowEditDynamicModal(true)

    }



    useEffect(() => {



        props.navigation.setOptions({
            headerRight: () => (
                <HeaderActions
                    navigation={props.navigation}
                    action={<HeaderIconButton label={i18n.t("createOne")} onPress={() => {
                        setShowNewDynamicURLModal(true)
                    }} />}
                />
            ),
        });

        loadMyDynamicURLs()
    }, [])

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View height={"100%"} width={"100%"}>
                    <View backgroundColor={"gray.50"} flex={1}>
                        {
                            dynamicURLList.length > 0 ?
                                <FlatList
                                    alignSelf={"center"}
                                    contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
                                    //contentContainerStyle={{alignItems:"center", width:"100%"}}
                                    data={dynamicURLList}
                                    maxW={1040}
                                    renderItem={(item) => {
                                        return (
                                            <DynamicURLItem
                                                reload={() => { loadMyDynamicURLs() }}
                                                openEditDynamicURLModal={openEditDynamicURLModal}
                                                {...item} />

                                        )
                                    }}
                                    width={"100%"}
                                >

                                </FlatList>
                                :
                                <View flex={1} justifyContent={"center"} alignItems="center" padding={4}>
                                    <View
                                        backgroundColor={"white"}
                                        borderColor={"gray.200"}
                                        borderRadius={8}
                                        borderWidth={1}
                                        maxW={420}
                                        padding={4}
                                        width={"100%"}
                                    >
                                        <Text color={"gray.900"} fontSize={"xl"} fontWeight="bold">{i18n.t("noDynamicURLs")}</Text>
                                        <View padding={2}>
                                            <Button
                                                backgroundColor={"black"}
                                                onPress={() => {
                                                    setShowNewDynamicURLModal(true)
                                                }}
                                            >
                                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{i18n.t("createOne")}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                </View>
                        }
                    </View>



                    {showNewDynamicURLModal ?
                        <CreateDynamicURLModal isOpen={showNewDynamicURLModal}
                            onClose={(reload) => {
                                setShowNewDynamicURLModal(false)
                                if (reload) {
                                    loadMyDynamicURLs()
                                }
                            }}
                        ></CreateDynamicURLModal>
                        : null
                    }
                    {showEditDynamicURLModal ?
                        <EditDynamicURLModal {...editDynamicURL}
                            isOpen={showEditDynamicURLModal}
                            onClose={(reload) => {

                                setShowEditDynamicModal(false)
                                if (reload) {
                                    loadMyDynamicURLs()
                                }
                            }}
                        ></EditDynamicURLModal>
                        : null
                    }


                </View>
            </NativeBaseProvider>
        )
    }
    else {
        return (
            <LoadingPage></LoadingPage>
        )
    }



}
