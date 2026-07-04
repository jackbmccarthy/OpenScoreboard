import { useEffect, useRef, useState } from "react";

const { Text, View } = require("native-base");


export default function CountDownTimerText(props) {
    let gameBreakCounterInterval = useRef()
    let didFinishRef = useRef(false)
    let [counter, setCounter] = useState(props.counterStart)


    const startCountDownTimer = (startTime) => {
        const normalizedStartTime = startTime || new Date().toISOString()
        const updateCounter = () => {
            let timeDifference = new Date().getTime() - new Date(normalizedStartTime).getTime();
            let timeElapsed = Math.floor(timeDifference / 1000);
            let timeLeft = props.counterStart - timeElapsed;
            if (timeLeft <= 0) {
                stopCountDownTimer(true);
                setCounter(0)
            }
            else {
                setCounter(timeLeft);
            }

        }

        updateCounter()
        gameBreakCounterInterval.current = setInterval(updateCounter, 1000);

    };
    const stopCountDownTimer = (notify = false) => {
        clearInterval(gameBreakCounterInterval.current);
        if (notify && !didFinishRef.current && typeof props.onFinish !== "undefined") {
            didFinishRef.current = true
            props.onFinish()
        }
    };

    useEffect(() => {
        stopCountDownTimer(false)
        didFinishRef.current = false

        if (props.isOpen === true) {
            startCountDownTimer(props.startTime)

        }

        return () => stopCountDownTimer(false)
    }, [props.counterStart, props.isOpen, props.startTime])

    if (props.isOpen) {
        return (

            <Text fontSize={props.fontSize}>{counter}</Text>
        )
    }
    else {
        return <View></View>
    }



}
