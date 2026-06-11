import React, { useEffect, useState } from 'react';
import { View, Modal } from 'native-base';
import { setRedFlag, setYellowFlag } from '../functions/scoring';
import { getCombinedPlayerNames } from '../functions/players';
import i18n from '../translations/translate';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScoringChoiceButton, ScoringModalHeader, ScoringModalSection } from '../components/ScoringModalComponents';

function PenaltySideCard({ isRed, isYellow, name, onRedPress, onYellowPress }) {
    return (
        <ScoringModalSection
            title={name}
            description={"Toggle any penalty cards currently assigned to this side."}
        >
            <View flexDirection={"row"}>
                <View flex={1} paddingRight={1}>
                    <ScoringChoiceButton
                        icon={<MaterialCommunityIcons name="card" size={18} color={isYellow ? "#111827" : "#A16207"} />}
                        onPress={onYellowPress}
                        selected={isYellow}
                        selectedBackgroundColor={"#FDE047"}
                        selectedTextColor={"#111827"}
                        title={i18n.t("yellowCard")}
                    />
                </View>
                <View flex={1} paddingLeft={1}>
                    <ScoringChoiceButton
                        icon={<MaterialCommunityIcons name="card" size={18} color={isRed ? "white" : "#B91C1C"} />}
                        onPress={onRedPress}
                        selected={isRed}
                        selectedBackgroundColor={"#DC2626"}
                        title={i18n.t("redCard")}
                    />
                </View>
            </View>
        </ScoringModalSection>
    );
}

export function MatchPenaltyButtonModal(props) {
    const { isAYellowCarded, isBYellowCarded, isARedCarded, isBRedCarded, playerA, playerB, playerA2, playerB2 } = props;

    let [isAYellow, setIsAYellow] = useState(isAYellowCarded);
    let [isBYellow, setIsBYellow] = useState(isBYellowCarded);
    let [isARed, setIsARed] = useState(isARedCarded);
    let [isBRed, setIsBRed] = useState(isBRedCarded);

    useEffect(() => {
        setIsARed(isARedCarded);
        setIsBRed(isBRedCarded);
        setIsAYellow(isAYellowCarded);
        setIsBYellow(isBYellowCarded);


    }, [isAYellowCarded, isBYellowCarded, isARedCarded, isBRedCarded]);

    return (
        <Modal onClose={() => { props.onClose(); }} isOpen={props.isOpen}>
            <Modal.Content maxW={520} width={"92%"}>
                <Modal.CloseButton />
                <Modal.Header>
                    <ScoringModalHeader
                        title={"Penalties"}
                        description={"Track yellow and red penalty cards for either side of the current match."}
                    />
                </Modal.Header>
                <Modal.Body backgroundColor={"gray.50"}>
                    <PenaltySideCard
                        isRed={isARed}
                        isYellow={isAYellow}
                        name={getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).a}
                        onRedPress={() => {
                            setIsARed(isARed ? false : true);
                            setRedFlag(props.matchID, "A", isARed ? false : true);
                        }}
                        onYellowPress={() => {
                            setIsAYellow(isAYellow ? false : true);
                            setYellowFlag(props.matchID, "A", isAYellow ? false : true);
                        }}
                    />
                    <PenaltySideCard
                        isRed={isBRed}
                        isYellow={isBYellow}
                        name={getCombinedPlayerNames(playerA, playerB, playerA2, playerB2).b}
                        onRedPress={() => {
                            setIsBRed(isBRed ? false : true);
                            setRedFlag(props.matchID, "B", isBRed ? false : true);
                        }}
                        onYellowPress={() => {
                            setIsBYellow(isBYellow ? false : true);
                            setYellowFlag(props.matchID, "B", isBYellow ? false : true);
                        }}
                    />
                </Modal.Body>
            </Modal.Content>
        </Modal>
    );
}
