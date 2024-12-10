

import React, {  useEffect, useState } from 'react';
import { Button, View, NativeBaseProvider, FlatList, Fab, AddIcon, ChevronRightIcon, Text, Divider } from 'native-base';

import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";

import LoadingPage from './LoadingPage';
import { getMyDynamicURLs } from './functions/dynamicurls';
import { DynamicURLItem } from './listitems/DynamicURLItem';
import { EditDynamicURLModal } from './modals/EditDynamicURLModal';
import { CreateDynamicURLModal } from './modals/CreateDynamicURLModal';
import i18n from './translations/translate';

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
        setEditDynamicURL({...dynamicURLSettings, myID:myDynamicURLID})
        setShowEditDynamicModal(true)

    }



    useEffect(() => {



        props.navigation.setOptions({
            headerRight: () => (
                <NativeBaseProvider>
                    <Button height={"100%"} width={"100%"} variant={"ghost"} onPress={() => {
                        setShowNewDynamicURLModal(true)
                    }} >
                        <AddIcon size="xl" color={openScoreboardButtonTextColor}  ></AddIcon>
                    </Button>
                </NativeBaseProvider>

            ),
        });

        loadMyDynamicURLs()
    }, [])

    if (doneLoading) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View height={"100%"} width={"100%"}>
                    <View flex={1}>
{
                        dynamicURLList.length > 0 ?
                            <FlatList maxW={"lg"} width={"100%"} alignSelf="center"
                                //contentContainerStyle={{alignItems:"center", width:"100%"}}
                                data={dynamicURLList}
                                renderItem={(item) => {
                                    return (
                                        <>
                                            <DynamicURLItem
                                            reload={()=>{loadMyDynamicURLs()}}
                                            openEditDynamicURLModal={openEditDynamicURLModal}
                                            {...item} ></DynamicURLItem>
                                            <Divider></Divider>
                                        </>

                                    )
                                }}
                            >

                            </FlatList>
                            :
                            <View justifyContent={"center"} alignItems="center">
                                <View>
                                    <Text fontSize={"xl"} fontWeight="bold">{i18n.t("noDynamicURLs")}</Text>
                                    <View padding={2}>
                                        <Button
                                            onPress={() => {
                                                setShowNewDynamicURLModal(true)
                                            }}
                                        >
                                            <Text color={openScoreboardButtonTextColor}>{i18n.t("createOne")}</Text>
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