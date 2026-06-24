import React, { useState } from 'react';
import { Button, FormControl, Input, Modal, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import normalizeColor from 'normalize-css-color';
import { openScoreboardButtonTextColor, openScoreboardColor } from '../../openscoreboardtheme';
import JerseyColorOptions from './JerseyColorOptions';

export function isValidTeamColor(value) {
    const cleanValue = `${value || ""}`.trim();
    return cleanValue.length === 0 || normalizeColor(cleanValue.toLowerCase()) !== null;
}

export default function TeamColorField({
    helperText = "Used as the default player jersey color during team matches.",
    label = "Team color",
    onChange,
    value,
}) {
    const [showPicker, setShowPicker] = useState(false);
    const cleanValue = `${value || ""}`.trim();
    const isValid = isValidTeamColor(cleanValue);

    return (
        <>
            <FormControl isInvalid={!isValid}>
                <FormControl.Label>{label}</FormControl.Label>
                <View alignItems={"center"} flexDirection={"row"}>
                    <View
                        accessibilityLabel={cleanValue ? `Selected team color ${cleanValue}` : "No team color selected"}
                        backgroundColor={isValid && cleanValue ? cleanValue : "transparent"}
                        borderColor={isValid ? "gray.300" : "red.400"}
                        borderRadius={8}
                        borderWidth={1}
                        height={38}
                        marginRight={2}
                        width={38}
                    />
                    <Input
                        flex={1}
                        placeholder={"#0055FF, rgb(0, 85, 255), or blue"}
                        value={value}
                        onChangeText={onChange}
                    />
                    <Button
                        accessibilityLabel={"Open team color picker"}
                        borderColor={"gray.300"}
                        borderRadius={8}
                        marginLeft={2}
                        onPress={() => setShowPicker(true)}
                        paddingX={3}
                        variant={"outline"}
                    >
                        <MaterialCommunityIcons name="palette-outline" size={20} color={openScoreboardColor} />
                    </Button>
                </View>
                {!isValid ? (
                    <FormControl.ErrorMessage>
                        Enter a valid hex, RGB, HSL, or named color.
                    </FormControl.ErrorMessage>
                ) : (
                    <FormControl.HelperText>{helperText}</FormControl.HelperText>
                )}
            </FormControl>

            <Modal isOpen={showPicker} onClose={() => setShowPicker(false)}>
                <Modal.Content maxWidth={420} width={"92%"}>
                    <Modal.CloseButton />
                    <Modal.Header>Choose team color</Modal.Header>
                    <Modal.Body>
                        <JerseyColorOptions
                            color={isValid ? cleanValue : ""}
                            onSelect={(selectedColor) => {
                                onChange(selectedColor);
                            }}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            marginRight={2}
                            onPress={() => onChange("")}
                            variant={"ghost"}
                        >
                            <Text color={"gray.700"} fontWeight={"bold"}>Clear</Text>
                        </Button>
                        <Button
                            backgroundColor={openScoreboardColor}
                            borderRadius={8}
                            onPress={() => setShowPicker(false)}
                        >
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Done</Text>
                        </Button>
                    </Modal.Footer>
                </Modal.Content>
            </Modal>
        </>
    );
}
