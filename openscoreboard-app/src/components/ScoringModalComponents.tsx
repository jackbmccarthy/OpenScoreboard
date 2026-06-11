import React from 'react';
import { Button, Text, View } from 'native-base';

const primaryColor = "#111827";
const activeBlue = "#1D4ED8";
const borderColor = "#E5E7EB";
const mutedText = "#6B7280";

export function ScoringModalHeader({ description, title }) {
    return (
        <View paddingRight={8}>
            <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"}>{title}</Text>
            {description ? (
                <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>{description}</Text>
            ) : null}
        </View>
    );
}

export function ScoringModalSection({ children, compact = false, description, title }) {
    return (
        <View
            backgroundColor={"white"}
            borderColor={borderColor}
            borderRadius={compact ? 8 : 12}
            borderWidth={1}
            marginBottom={compact ? 2 : 3}
            padding={compact ? 2 : 3}
        >
            {title ? (
                <Text color={"gray.900"} fontSize={compact ? "sm" : "md"} fontWeight={"bold"}>{title}</Text>
            ) : null}
            {description ? (
                <Text color={"gray.600"} fontSize={compact ? "2xs" : "xs"} marginTop={compact ? 0.5 : 1}>{description}</Text>
            ) : null}
            <View marginTop={title || description ? compact ? 1.5 : 3 : 0}>
                {children}
            </View>
        </View>
    );
}

export function ScoringChoiceButton({
    compact = false,
    description = null,
    disabled = false,
    icon = null,
    onPress,
    selected = false,
    selectedBackgroundColor = activeBlue,
    selectedTextColor = "white",
    title,
}) {
    return (
        <Button
            backgroundColor={selected ? selectedBackgroundColor : "white"}
            borderColor={selected ? selectedBackgroundColor : "#BFDBFE"}
            borderRadius={compact ? 8 : 10}
            borderWidth={1}
            disabled={disabled}
            minHeight={compact ? description ? 46 : 36 : description ? 66 : 44}
            onPress={onPress}
            paddingX={compact ? 2 : 3}
            paddingY={compact ? 1 : 2}
            _disabled={{ opacity: 0.55 }}
            _pressed={{ backgroundColor: selected ? selectedBackgroundColor : "blue.50" }}
        >
            <View alignItems={"center"} flexDirection={"row"} justifyContent={"center"}>
                {icon ? (
                    <View marginRight={compact ? 1 : 2}>{icon}</View>
                ) : null}
                <View flexShrink={1}>
                    <Text color={selected ? selectedTextColor : "gray.900"} fontSize={compact ? "xs" : "sm"} fontWeight={"bold"} numberOfLines={1} textAlign={"center"}>
                        {title}
                    </Text>
                    {description ? (
                        <Text color={selected ? selectedTextColor : mutedText} fontSize={"2xs"} lineHeight={"xs"} marginTop={compact ? 0 : 0.5} numberOfLines={1} textAlign={"center"}>
                            {description}
                        </Text>
                    ) : null}
                </View>
            </View>
        </Button>
    );
}

export function ScoringPrimaryButton({ children, disabled = false, isLoading = false, onPress }) {
    return (
        <Button
            backgroundColor={primaryColor}
            borderRadius={10}
            disabled={disabled}
            isLoading={isLoading}
            minHeight={44}
            onPress={onPress}
            paddingX={4}
            _pressed={{ backgroundColor: "#000000" }}
        >
            {children}
        </Button>
    );
}

export function ScoringDangerButton({ children, disabled = false, isLoading = false, onPress }) {
    return (
        <Button
            backgroundColor={"red.600"}
            borderRadius={10}
            disabled={disabled}
            isLoading={isLoading}
            minHeight={44}
            onPress={onPress}
            paddingX={4}
            _pressed={{ backgroundColor: "red.700" }}
        >
            {children}
        </Button>
    );
}

export function ScoringSecondaryButton({ children, disabled = false, onPress }) {
    return (
        <Button
            backgroundColor={"white"}
            borderColor={"#BFDBFE"}
            borderRadius={10}
            borderWidth={1}
            disabled={disabled}
            minHeight={44}
            onPress={onPress}
            paddingX={4}
            _pressed={{ backgroundColor: "blue.50" }}
        >
            {children}
        </Button>
    );
}

export function ScoringSegmentedTabs({ onChange, tabs, value }) {
    return (
        <View
            backgroundColor={"gray.100"}
            borderRadius={12}
            flexDirection={"row"}
            marginBottom={3}
            padding={1}
        >
            {tabs.map((tab) => {
                const selected = tab.value === value;
                return (
                    <View flex={1} key={tab.value} padding={0.5}>
                        <Button
                            backgroundColor={selected ? "white" : "transparent"}
                            borderColor={selected ? borderColor : "transparent"}
                            borderRadius={9}
                            borderWidth={1}
                            minHeight={38}
                            onPress={() => onChange(tab.value)}
                            paddingX={2}
                            paddingY={1}
                            _pressed={{ backgroundColor: selected ? "white" : "gray.200" }}
                        >
                            <Text color={selected ? "gray.900" : "gray.600"} fontSize={"sm"} fontWeight={"bold"}>{tab.label}</Text>
                        </Button>
                    </View>
                );
            })}
        </View>
    );
}
