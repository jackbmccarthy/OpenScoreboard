import React, { useState } from 'react';
import { View, Input, Text, Button, FormControl } from 'native-base';
import { FontAwesome } from '@expo/vector-icons';

export function EditTextItem(props) {

    let [isEditing, setIsEditing] = useState(false);
    let [value, setValue] = useState(props.value);
    let [fieldName, setFieldName] = useState(props.fieldName);

    return (
        <View padding={1}>
            <View flexDirection={"row"} maxW={"lg"} justifyContent="space-between" alignItems={"center"}>
                <FormControl>
                    <FormControl.Label>{fieldName}</FormControl.Label>
                    <FormControl flexDirection={"row"}>
                        {isEditing ?
                            <Input flex={1}
                                value={value}
                                onChangeText={setValue}
                            ></Input>
                            : <>


                                <Text flex={1}>{value}</Text>


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
                                <FontAwesome color="white" name='save' />
                                : <FontAwesome color="white" name="edit" />}

                        </Button>
                    </FormControl>


                </FormControl>
                {/* <View>
                    <Text>{fieldName}</Text>
                </View> */}
                {/* {isEditing ?
                    <Input
                        value={value}
                        onChangeText={setValue}
                    ></Input>
                    : <>

                        <View>
                            <Text>{value}</Text>
                        </View>

                    </>} */}
                {/* <View padding={1}>
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
                        <FontAwesome  name='save' />
                        : <FontAwesome name="edit" />}

                </Button>     
                    </View> */}

            </View>
        </View>
    );
}
