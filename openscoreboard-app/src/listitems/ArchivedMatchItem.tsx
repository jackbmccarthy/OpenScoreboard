import React from 'react';
import { Text, View } from 'native-base';

const GAME_SCORE_COLUMN_WIDTH = 44;
const TOTAL_SCORE_COLUMN_WIDTH = 34;

function getWinnerSide(matchDetails) {
    if ((matchDetails?.AScore || 0) > (matchDetails?.BScore || 0)) {
        return "A";
    }

    if ((matchDetails?.BScore || 0) > (matchDetails?.AScore || 0)) {
        return "B";
    }

    return "";
}

function getGameScores(matchDetails) {
    if (Array.isArray(matchDetails?.gameScores)) {
        return matchDetails.gameScores;
    }

    return [1, 2, 3, 4, 5, 6, 7, 8, 9]
        .filter((gameNumber) => matchDetails?.[`isGame${gameNumber}Started`] || matchDetails?.[`isGame${gameNumber}Finished`])
        .map((gameNumber) => ({
            gameNumber,
            a: matchDetails?.[`game${gameNumber}AScore`] ?? 0,
            b: matchDetails?.[`game${gameNumber}BScore`] ?? 0,
        }));
}

function getValidDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
    const date = getValidDate(value);
    return date ? date.toLocaleDateString() : "";
}

function formatTime(value) {
    const date = getValidDate(value);
    return date ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
}

function getDateLabel(matchDetails) {
    return formatDate(matchDetails?.startTime) || formatDate(matchDetails?.archivedOn) || "Date unavailable";
}

function getTimeLabel(matchDetails) {
    const startTime = formatTime(matchDetails?.startTime);
    const endTime = formatTime(matchDetails?.archivedOn);

    if (startTime && endTime) {
        return `${startTime} - ${endTime}`;
    }

    if (startTime) {
        return `Started ${startTime}`;
    }

    if (endTime) {
        return `Archived ${endTime}`;
    }

    return "";
}

function GridCell({ children, flex, width, isHeader = false, isTotal = false, isWinner = false, align = "center" }) {
    return (
        <View
            alignItems={align}
            backgroundColor={isWinner ? "blue.700" : isHeader || isTotal ? "gray.100" : "white"}
            borderColor={"gray.200"}
            borderWidth={1}
            flex={flex}
            justifyContent={"center"}
            minH={30}
            paddingX={2}
            width={width}
        >
            <Text
                color={isWinner ? "white" : isHeader ? "gray.600" : "gray.900"}
                fontSize={isHeader ? "xs" : "sm"}
                fontWeight={isHeader || isTotal || isWinner ? "bold" : "medium"}
                numberOfLines={1}
            >
                {children}
            </Text>
        </View>
    );
}

function ScoreRow({ name, scores, total, side, winnerSide }) {
    const isWinner = winnerSide === side;

    return (
        <View flexDir={"row"} marginTop={-1}>
            <GridCell align={"flex-start"} flex={1}>{name?.length > 0 ? name : "TBD"}</GridCell>
            {scores.map((game) => (
                <GridCell key={`${side}-game-${game.gameNumber}`} width={GAME_SCORE_COLUMN_WIDTH}>
                    {side === "A" ? game.a : game.b}
                </GridCell>
            ))}
            <GridCell isTotal isWinner={isWinner} width={TOTAL_SCORE_COLUMN_WIDTH}>{total ?? 0}</GridCell>
        </View>
    );
}

export function ArchivedMatchItem(props) {
    const matchDetails = props.item[1];
    const winnerSide = getWinnerSide(matchDetails);
    const gameScores = getGameScores(matchDetails);
    const timeLabel = getTimeLabel(matchDetails);

    return (
        <View
            marginBottom={3}
            width={{ base: "100%", lg: "48.5%" }}
        >
            <View
                backgroundColor={"white"}
                borderColor={"gray.200"}
                borderRadius={8}
                borderWidth={1}
                padding={3}
            >
                <View flexDir={"row"} justifyContent={"space-between"} marginBottom={2}>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} numberOfLines={1}>
                        {getDateLabel(matchDetails)}
                    </Text>
                    {timeLabel ? (
                        <Text color={"gray.500"} fontSize={"xs"} fontWeight={"medium"} numberOfLines={1}>
                            {timeLabel}
                        </Text>
                    ) : null}
                </View>

                <View>
                    <View flexDir={"row"}>
                        <GridCell align={"flex-start"} flex={1} isHeader>Player</GridCell>
                        {gameScores.map((game) => (
                            <GridCell key={`header-game-${game.gameNumber}`} isHeader width={GAME_SCORE_COLUMN_WIDTH}>
                                {game.gameNumber}
                            </GridCell>
                        ))}
                        <GridCell isHeader width={TOTAL_SCORE_COLUMN_WIDTH}>T</GridCell>
                    </View>
                    <ScoreRow
                        name={matchDetails?.playerA}
                        scores={gameScores}
                        side={"A"}
                        total={matchDetails?.AScore}
                        winnerSide={winnerSide}
                    />
                    <ScoreRow
                        name={matchDetails?.playerB}
                        scores={gameScores}
                        side={"B"}
                        total={matchDetails?.BScore}
                        winnerSide={winnerSide}
                    />
                </View>

                {gameScores.length === 0 ? (
                    <Text color={"gray.500"} fontSize={"2xs"} marginTop={2}>
                        No game scores recorded.
                    </Text>
                ) : null}
            </View>
        </View>
    );
}
