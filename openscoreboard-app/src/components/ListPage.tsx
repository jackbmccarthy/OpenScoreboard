import React from 'react';
import { Button, Input, Select, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openScoreboardButtonTextColor, openScoreboardColor } from '../../openscoreboardtheme';

export function PageScaffold({ children }) {
    return (
        <View backgroundColor={"gray.50"} flex={1} height={"100%"} width={"100%"}>
            <View alignSelf={"center"} flex={1} maxWidth={1180} width={"100%"}>
                {children}
            </View>
        </View>
    );
}

export function ListPageHeader({
    actionIcon = "plus",
    actionLabel = "",
    description,
    onAction,
    onSecondaryAction,
    secondaryActionIcon = "plus",
    secondaryActionLabel = "",
    title,
}) {
    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            margin={3}
            padding={4}
        >
            <View alignItems={"flex-start"} flexDirection={{ base: "column", md: "row" }} justifyContent={"space-between"}>
                <View flex={1} paddingRight={{ base: 0, md: 4 }}>
                    <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>{title}</Text>
                    {description ? (
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                            {description}
                        </Text>
                    ) : null}
                </View>
                <View flexDirection={"row"} flexWrap={"wrap"} marginTop={{ base: 3, md: 0 }}>
                    {actionLabel && onAction ? (
                        <Button
                            backgroundColor={openScoreboardColor}
                            borderRadius={8}
                            marginRight={secondaryActionLabel && onSecondaryAction ? 2 : 0}
                            marginTop={secondaryActionLabel && onSecondaryAction ? 1 : 0}
                            onPress={onAction}
                        >
                            <View alignItems={"center"} flexDirection={"row"}>
                                <MaterialCommunityIcons name={actionIcon as any} size={18} color={openScoreboardButtonTextColor} />
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"} marginLeft={2}>{actionLabel}</Text>
                            </View>
                        </Button>
                    ) : null}
                    {secondaryActionLabel && onSecondaryAction ? (
                        <Button
                            borderRadius={8}
                            marginTop={1}
                            onPress={onSecondaryAction}
                            variant={"outline"}
                        >
                            <View alignItems={"center"} flexDirection={"row"}>
                                <MaterialCommunityIcons name={secondaryActionIcon as any} size={18} color={openScoreboardColor} />
                                <Text color={openScoreboardColor} fontWeight={"bold"} marginLeft={2}>{secondaryActionLabel}</Text>
                            </View>
                        </Button>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

export function ListToolbar({
    countLabel,
    onSearchChange,
    onSortChange,
    searchPlaceholder = "Search",
    searchValue = "",
    sortOptions = [],
    sortValue = "",
}) {
    return (
        <View
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginX={3}
            marginBottom={2}
            padding={3}
        >
            <View flexDirection={{ base: "column", md: "row" }}>
                {onSearchChange ? (
                    <View flex={1} marginRight={{ base: 0, md: 2 }}>
                        <Input
                            InputLeftElement={(
                                <View marginLeft={3}>
                                    <MaterialCommunityIcons name="magnify" size={20} color={"#6B7280"} />
                                </View>
                            )}
                            onChangeText={onSearchChange}
                            placeholder={searchPlaceholder}
                            value={searchValue}
                        />
                    </View>
                ) : null}
                {sortOptions.length > 0 && onSortChange ? (
                    <View marginLeft={{ base: 0, md: 2 }} marginTop={{ base: onSearchChange ? 3 : 0, md: 0 }} minWidth={{ base: "100%", md: 230 }}>
                        <Select selectedValue={sortValue} onValueChange={onSortChange}>
                            {sortOptions.map((option) => (
                                <Select.Item key={option.value} label={option.label} value={option.value} />
                            ))}
                        </Select>
                    </View>
                ) : null}
            </View>
            {countLabel ? (
                <Text color={"gray.500"} fontSize={"xs"} marginTop={2}>
                    {countLabel}
                </Text>
            ) : null}
        </View>
    );
}

export function BulkActionToolbar({
    actionIcon = "archive-outline",
    actionLabel = "Archive selected",
    confirmActionLabel = "Confirm",
    confirmMessage = "",
    isConfirming = false,
    isLoading = false,
    onAction,
    onCancelConfirm,
    onClearSelection,
    onConfirmAction,
    onSelectVisible,
    selectedCount = 0,
    visibleCount = 0,
}) {
    if (selectedCount <= 0) {
        return null;
    }

    return (
        <View
            backgroundColor={isConfirming ? "red.50" : "blue.50"}
            borderColor={isConfirming ? "red.200" : "blue.100"}
            borderRadius={8}
            borderWidth={1}
            marginX={3}
            marginBottom={2}
            padding={3}
        >
            <View alignItems={{ base: "stretch", md: "center" }} flexDirection={{ base: "column", md: "row" }}>
                <View flex={1} paddingRight={{ base: 0, md: 3 }}>
                    <Text color={isConfirming ? "red.900" : "blue.900"} fontSize={"sm"} fontWeight={"bold"}>
                        {selectedCount} selected
                    </Text>
                    <Text color={isConfirming ? "red.800" : "blue.800"} fontSize={"xs"} marginTop={1}>
                        {isConfirming ? confirmMessage : "Bulk actions apply to the selected items only."}
                    </Text>
                </View>
                <View flexDirection={"row"} flexWrap={"wrap"} marginTop={{ base: 3, md: 0 }}>
                    {visibleCount > 0 && !isConfirming ? (
                        <Button borderRadius={8} marginRight={2} marginTop={1} onPress={onSelectVisible} size={"sm"} variant={"outline"}>
                            <Text color={"blue.700"} fontWeight={"bold"}>Select visible</Text>
                        </Button>
                    ) : null}
                    {!isConfirming ? (
                        <Button borderRadius={8} marginRight={2} marginTop={1} onPress={onClearSelection} size={"sm"} variant={"ghost"}>
                            <Text color={"gray.700"} fontWeight={"bold"}>Clear</Text>
                        </Button>
                    ) : null}
                    {isConfirming ? (
                        <>
                            <Button
                                backgroundColor={"red.700"}
                                borderRadius={8}
                                isLoading={isLoading}
                                marginRight={2}
                                marginTop={1}
                                onPress={onConfirmAction}
                                size={"sm"}
                            >
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>{confirmActionLabel}</Text>
                            </Button>
                            <Button borderRadius={8} marginTop={1} onPress={onCancelConfirm} size={"sm"} variant={"ghost"}>
                                <Text color={"gray.700"} fontWeight={"bold"}>Cancel</Text>
                            </Button>
                        </>
                    ) : (
                        <Button
                            backgroundColor={"red.700"}
                            borderRadius={8}
                            marginTop={1}
                            onPress={onAction}
                            size={"sm"}
                        >
                            <View alignItems={"center"} flexDirection={"row"}>
                                <MaterialCommunityIcons name={actionIcon as any} size={17} color={openScoreboardButtonTextColor} />
                                <Text color={openScoreboardButtonTextColor} fontWeight={"bold"} marginLeft={2}>{actionLabel}</Text>
                            </View>
                        </Button>
                    )}
                </View>
            </View>
        </View>
    );
}

export function EmptyState({ actionLabel = "", description = "", icon = "playlist-remove", onAction, title }) {
    return (
        <View alignItems={"center"} justifyContent={"center"} padding={4}>
            <View
                alignItems={"center"}
                backgroundColor={"white"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                maxWidth={440}
                padding={6}
                width={"100%"}
            >
                <View
                    alignItems={"center"}
                    backgroundColor={"blue.50"}
                    borderRadius={999}
                    height={52}
                    justifyContent={"center"}
                    width={52}
                >
                    <MaterialCommunityIcons name={icon as any} size={26} color={openScoreboardColor} />
                </View>
                <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"} marginTop={3} textAlign={"center"}>{title}</Text>
                {description ? (
                    <Text color={"gray.600"} fontSize={"sm"} marginTop={1} textAlign={"center"}>
                        {description}
                    </Text>
                ) : null}
                {actionLabel && onAction ? (
                    <Button borderRadius={8} marginTop={4} onPress={onAction} variant={"outline"}>
                        <Text color={"blue.700"} fontWeight={"bold"}>{actionLabel}</Text>
                    </Button>
                ) : null}
            </View>
        </View>
    );
}

export function MetadataPill({ label, value }) {
    return (
        <View
            backgroundColor={"gray.50"}
            borderColor={"gray.200"}
            borderRadius={999}
            borderWidth={1}
            marginRight={2}
            marginTop={2}
            paddingX={3}
            paddingY={1}
        >
            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                {label}
            </Text>
            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>
                {value}
            </Text>
        </View>
    );
}

export function ResourceAction({ icon, isLoading = false, isPrimary = false, label, onPress, tone = "default" }) {
    const isDanger = tone === "danger";
    const foreground = isDanger ? "#B91C1C" : isPrimary ? openScoreboardButtonTextColor : openScoreboardColor;
    const textColor = isDanger ? "red.700" : isPrimary ? openScoreboardButtonTextColor : "blue.700";

    return (
        <Button
            backgroundColor={isPrimary ? openScoreboardColor : "white"}
            borderColor={isDanger ? "red.200" : isPrimary ? openScoreboardColor : "blue.100"}
            borderRadius={8}
            borderWidth={1}
            isDisabled={isLoading}
            isLoading={isLoading}
            justifyContent={"flex-start"}
            marginRight={2}
            marginTop={2}
            minHeight={44}
            onPress={onPress}
            paddingX={3}
            variant={isPrimary ? "solid" : "outline"}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                {icon(foreground)}
                <Text color={textColor} fontSize={"sm"} fontWeight={"bold"} marginLeft={2}>
                    {label}
                </Text>
            </View>
        </Button>
    );
}

export function ResourceCard({ actions = null, children = null, icon = null, meta = null, onPress = null, status = null, subtitle = "", title }) {
    const CardWrapper = View;

    return (
        <CardWrapper
            backgroundColor={"white"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginX={3}
            marginY={2}
            padding={4}
            width={"auto"}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                {icon ? (
                    <View
                        alignItems={"center"}
                        backgroundColor={"blue.50"}
                        borderColor={"blue.100"}
                        borderRadius={8}
                        borderWidth={1}
                        height={46}
                        justifyContent={"center"}
                        marginRight={3}
                        width={46}
                    >
                        {icon(openScoreboardColor)}
                    </View>
                ) : null}
                <View flex={1} paddingRight={3}>
                    <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"} numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
                {status}
            </View>
            {meta ? (
                <View flexDirection={"row"} flexWrap={"wrap"} marginTop={2}>
                    {meta}
                </View>
            ) : null}
            {children}
            {actions ? (
                <View flexDirection={"row"} flexWrap={"wrap"} marginTop={3}>
                    {actions}
                </View>
            ) : null}
        </CardWrapper>
    );
}
