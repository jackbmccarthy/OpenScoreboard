

import React, { useEffect, useRef, useState } from 'react';
import { Text, View, NativeBaseProvider } from 'native-base';
import { FontAwesome5 } from '@expo/vector-icons';
import { openScoreboardColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import i18n from './translations/translate';



export default function LoadingPage() {

    let [paddleNumber, setPaddleNumber] = useState(0)
    let counter = useRef(0)
    let [failedToLoad, setFailedToLoad] = useState(false)

    useEffect(() => {
        let intervalID = setInterval(() => {
            counter.current = counter.current + 1
            setPaddleNumber(counter.current % 4)
            if (counter.current === 20) {
                setFailedToLoad(true)
            }

        }, 500)

        return () => {
            clearInterval(intervalID)
        }
    }, [])

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <View justifyContent={"center"} height="100%" width={"100%"} flex={1} alignItems="center">
                {
                    failedToLoad ?
                        <>
                            <Text fontSize={"5xl"} color={openScoreboardColor}>{i18n.t("failedToLoad")}</Text>
                            <Text color={openScoreboardColor}>{i18n.t("tryAgainLater")}</Text>
                        </>

                        :
                        <>
                            <Text fontSize={"5xl"} color={openScoreboardColor}>{i18n.t("loading")}{
                                paddleNumber >= 1 ?
                                    <FontAwesome5 name="table-tennis" size={24} color={openScoreboardColor} />
                                    : "."
                            }{
                                    paddleNumber >= 2 ?
                                        <FontAwesome5 name="table-tennis" size={24} color={openScoreboardColor} />
                                        : "."
                                }
                                {
                                    paddleNumber >= 3 ?
                                        <FontAwesome5 name="table-tennis" size={24} color={openScoreboardColor} />
                                        : "."
                                }</Text>
                        </>
                }


            </View>
        </NativeBaseProvider>
    )
}