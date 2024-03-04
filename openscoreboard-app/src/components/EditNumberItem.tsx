import React, { useState } from 'react';
import { View, Text, Button, AddIcon, MinusIcon } from 'native-base';
import { FontAwesome } from '@expo/vector-icons';

function EditNumberItem(props) {

    let [isEditing, setIsEditing] = useState(false);
    let [value, setValue] = useState(props.value);
    let [fieldName, setFieldName] = useState(props.fieldName);

    return (
        <View padding={1}>
            <View flexDirection={"row"} justifyContent="space-between" alignItems={"center"}>
                <View>
                    <Text>{fieldName}</Text>
                </View>
                {isEditing ?
                    <View flexDirection={"row"}>
                        <View padding={2}>
                            <Button
                                onPress={() => {
                                    if (value >= 0) {
                                        setValue(value + 1);
                                    }
                                }}
                            >
                                <AddIcon></AddIcon>
                            </Button>
                        </View>
                        <View>
                            <Text>{value}</Text>
                        </View>
                        <View padding={2}>
                            <Button
                                onPress={() => {
                                    if (value > 0) {
                                        setValue(value - 1);
                                    }
                                }}
                            >
                                <MinusIcon></MinusIcon>
                            </Button>
                        </View>
                    </View>
                    : <>

                        <View>
                            <Text>{value}</Text>
                        </View>

                    </>}

                <Button
                    onPress={() => {
                        if (isEditing) {
                            props.onSubmit(value);
                            setIsEditing(false);
                        }
                        else {
                            setIsEditing(true);
                        }
                    }}
                >
                    {isEditing ?
                        <FontAwesome name='save' />
                        : <FontAwesome name="edit" />}

                </Button>
            </View>
        </View>
    );
}
