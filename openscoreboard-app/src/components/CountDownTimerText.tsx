import { useEffect, useRef, useState } from "react";

const { Text, View } = require("native-base");


export default function CountDownTimerText(props){
   //let [startTime, setStartTime] = useState(new Date())
    let [isTimeUp, setIsTimeUp] = useState(false)
    let gameBreakCounterInterval = useRef()
    let [counter, setCounter] = useState(props.counterStart)
    

    const startCountDownTimer = (startTime) => {
        if (startTime.length === 0) {
            startTime = new Date().toISOString()
        }
        gameBreakCounterInterval.current = setInterval(() => {
            let timeDifference = new Date().getTime() - new Date(startTime).getTime();
            let timeElapsed = Math.floor(timeDifference / 1000);
            let timeLeft = props.counterStart - timeElapsed;
            if (timeLeft < 0) {
                stopCountDownTimer();
                setIsTimeUp(true)
                setCounter(60)
            }
            else {
                setCounter(timeLeft);
            }

        }, 1000);

    };
    const stopCountDownTimer = () => {
        clearInterval(gameBreakCounterInterval.current);
        if(typeof props.onFinish !== "undefined"){
            props.onFinish()
        }
    };

    useEffect(() => {
        
        if (props.isOpen === true) {
            startCountDownTimer(props.startTime)

        }
    }, [props.isOpen])

    if(props.isOpen){
        return (

        <Text fontSize={props.fontSize}>{counter}</Text>
    )
    }
    else{
        return <View></View>
    }

    

}