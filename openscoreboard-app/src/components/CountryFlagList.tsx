import { FlatList, View, Text, Input, Divider, Image } from "native-base";
import React, { useEffect, useRef, useState } from "react";
import { TouchableOpacity } from "react-native";
import jsonFlags from '../flags/countries.json'
import LoadingPage from "../LoadingPage";
import i18n from "../translations/translate";


function CountryFlagItem(props) {
    let [doneLoadingPhoto, setDoneLoadingPhoto] = useState(true)
    let [countryName, setCountryName] = useState(props.item[1])
    let [countryCode, setCountryCode] = useState(props.item[0])

    return (
        <>
        <TouchableOpacity 
        onPress={()=>{
            props.onSelection(countryCode.toLocaleLowerCase())
        }}
        >
               <View padding={0}>
                <View alignItems={"center"} flexDirection={"row"}>
                    {
                        doneLoadingPhoto ?
                            <Image resizeMode="cover" 
                            width={30} 
                            style={{ aspectRatio: "3/2" }} 
                            source={process.env.NODE_ENV ==="production" ? `/scoreboard/flags/${countryCode.toLowerCase()}.png` : (window.location.origin.replace(window.location.port,"3001")+`/scoreboard/flags/${countryCode.toLowerCase()}.png`)} />
                            : null
                    }
                    <View padding={1}>
                        <Text>{countryName}</Text>
                    </View>

                </View>

            </View>
        </TouchableOpacity>
         
            <Divider></Divider>
        </>

    )
}

export default function CountryFlagList(props) {

    let [countryList, setCountryList] = useState([])
    let [countrySearchText, setCountrySearchText] = useState("")
    let countryListRef = useRef([])
    let [doneLoading, setDoneLoading] = useState(false)

    useEffect(() => {

        async function loadFlagList() {
            setDoneLoading(false)
            let flagList = jsonFlags
            //setCountryList(Object.entries(flagList.default))
            countryListRef.current = Object.entries(flagList)
            let consoleFlags = ""
            for (const flag of countryListRef.current) {
                consoleFlags += '"'+flag[0]+'":'+flag[0]+",\n"
                //"export const "+flag[0]+" from './"+flag[0].toLocaleLowerCase()+".png'\n"
            }
            setDoneLoading(true)
        }
        loadFlagList()
    }, [])
    if(doneLoading){
        return (
        <View overflowY={"hidden"} flex={1}>
            <View padding={1}>
                <Input placeholder={i18n.t("searchCountries")}
                    value={countrySearchText}
                    onChangeText={setCountrySearchText}
                ></Input>
            </View>
            <Divider></Divider>
            <FlatList maxHeight={300} minHeight={300}
                keyExtractor={(item)=>{
                    return item[0]+item[1]
                }}
                renderItem={(info) => { return <CountryFlagItem {...info} onSelection={props.onSelection} ></CountryFlagItem> }}
                data={countryListRef.current
                    .filter((item) => {

                    
                    if (item[1].toLowerCase().includes(countrySearchText.toLocaleLowerCase())) {
                        return true
                    }
                    else {
                        return false
                    }
                }).sort((a, b) => {
                    return a[1].toLowerCase() > b[1].toLowerCase() ? 1 : -1
                })
            }
            ></FlatList>
        </View>

    )
    }
    else {
        return <LoadingPage></LoadingPage>
    }
    
}