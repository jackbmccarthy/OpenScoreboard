import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'native-base';
import { Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { openScoreboardColor } from '../../openscoreboardtheme';

const defaultColor = "#1D4ED8";
const gridColumns = 7;

const spectrumRows = [
    { label: "Red", hueStart: 348, hueStep: 5, saturation: 84, lightness: 50 },
    { label: "Orange", hueStart: 18, hueStep: 5, saturation: 86, lightness: 50 },
    { label: "Yellow", hueStart: 46, hueStep: 5, saturation: 88, lightness: 48 },
    { label: "Green", hueStart: 96, hueStep: 8, saturation: 72, lightness: 42 },
    { label: "Teal", hueStart: 158, hueStep: 8, saturation: 76, lightness: 42 },
    { label: "Blue", hueStart: 212, hueStep: 8, saturation: 82, lightness: 50 },
    { label: "Purple", hueStart: 264, hueStep: 9, saturation: 78, lightness: 52 },
];

const grayscaleLightness = [100, 84, 68, 52, 36, 18, 0];
const gridRows = spectrumRows.length + 1;

const toneAdjustments = [
    { saturation: -8, lightness: 8 },
    { saturation: -4, lightness: 5 },
    { saturation: 0, lightness: 2 },
    { saturation: 4, lightness: 0 },
    { saturation: 8, lightness: -3 },
    { saturation: 10, lightness: -6 },
    { saturation: 12, lightness: -9 },
];

function clampChannel(value) {
    const parsedValue = Number.parseInt(`${value}`, 10);
    if (Number.isNaN(parsedValue)) {
        return 0;
    }
    return Math.max(0, Math.min(255, parsedValue));
}

function clampPercent(value) {
    return Math.max(0, Math.min(100, value));
}

function normalizeHue(hue) {
    return ((hue % 360) + 360) % 360;
}

function normalizeHexColor(value) {
    if (!value) {
        return "";
    }

    const trimmedValue = `${value}`.trim();
    const hexValue = trimmedValue.startsWith("#") ? trimmedValue.slice(1) : trimmedValue;

    if (/^[0-9a-fA-F]{3}$/.test(hexValue)) {
        return `#${hexValue.split("").map((character) => `${character}${character}`).join("")}`.toUpperCase();
    }

    if (/^[0-9a-fA-F]{6}$/.test(hexValue)) {
        return `#${hexValue}`.toUpperCase();
    }

    return "";
}

function hexToRgb(value) {
    const normalizedColor = normalizeHexColor(value) || defaultColor;
    const hexValue = normalizedColor.slice(1);

    return {
        b: Number.parseInt(hexValue.slice(4, 6), 16),
        g: Number.parseInt(hexValue.slice(2, 4), 16),
        r: Number.parseInt(hexValue.slice(0, 2), 16),
    };
}

function channelToHex(value) {
    return clampChannel(value).toString(16).padStart(2, "0").toUpperCase();
}

function rgbToHex(red, green, blue) {
    return `#${channelToHex(red)}${channelToHex(green)}${channelToHex(blue)}`;
}

function hueToRgb(p, q, t) {
    let nextT = t;
    if (nextT < 0) {
        nextT += 1;
    }
    if (nextT > 1) {
        nextT -= 1;
    }
    if (nextT < 1 / 6) {
        return p + (q - p) * 6 * nextT;
    }
    if (nextT < 1 / 2) {
        return q;
    }
    if (nextT < 2 / 3) {
        return p + (q - p) * (2 / 3 - nextT) * 6;
    }
    return p;
}

function hslToHex(hue, saturation, lightness) {
    const nextHue = hue / 360;
    const nextSaturation = saturation / 100;
    const nextLightness = lightness / 100;

    if (nextSaturation === 0) {
        const channel = Math.round(nextLightness * 255);
        return rgbToHex(channel, channel, channel);
    }

    const q = nextLightness < 0.5 ?
        nextLightness * (1 + nextSaturation)
        : nextLightness + nextSaturation - nextLightness * nextSaturation;
    const p = 2 * nextLightness - q;

    return rgbToHex(
        Math.round(hueToRgb(p, q, nextHue + 1 / 3) * 255),
        Math.round(hueToRgb(p, q, nextHue) * 255),
        Math.round(hueToRgb(p, q, nextHue - 1 / 3) * 255),
    );
}

function getTextColorForBackground(hexColor) {
    const { b, g, r } = hexToRgb(hexColor);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 150 ? "#18181B" : "#FFFFFF";
}

function getColorDistance(colorA, colorB) {
    const rgbA = hexToRgb(colorA);
    const rgbB = hexToRgb(colorB);

    return Math.sqrt(
        ((rgbA.r - rgbB.r) ** 2) +
        ((rgbA.g - rgbB.g) ** 2) +
        ((rgbA.b - rgbB.b) ** 2)
    );
}

function buildColorGrid() {
    const colorRows = spectrumRows.map((row, rowIndex) => {
        return Array.from({ length: gridColumns }).map((_, columnIndex) => {
            const tone = toneAdjustments[columnIndex] || { saturation: 0, lightness: 0 };
            return {
                color: hslToHex(
                    normalizeHue(row.hueStart + row.hueStep * columnIndex),
                    clampPercent(row.saturation + tone.saturation),
                    clampPercent(row.lightness + tone.lightness),
                ),
                key: `${rowIndex}-${columnIndex}`,
                label: `${row.label} option ${columnIndex + 1}`,
            };
        });
    });

    const grayscaleRow = grayscaleLightness.map((lightness, columnIndex) => {
        return {
            color: hslToHex(0, 0, lightness),
            key: `grayscale-${columnIndex}`,
            label: `Grayscale option ${columnIndex + 1}`,
        };
    });

    return [...colorRows, grayscaleRow];
}

function getSelectedGridColor(colorGrid, selectedColor) {
    if (!selectedColor) {
        return "";
    }

    const normalizedSelectedColor = normalizeHexColor(selectedColor);
    const flatSwatches = colorGrid.flat();
    const exactSwatch = flatSwatches.find((swatch) => normalizeHexColor(swatch.color) === normalizedSelectedColor);

    if (exactSwatch) {
        return normalizeHexColor(exactSwatch.color);
    }

    return flatSwatches.reduce((closestSwatch, swatch) => {
        if (!closestSwatch) {
            return swatch;
        }

        return getColorDistance(swatch.color, normalizedSelectedColor) < getColorDistance(closestSwatch.color, normalizedSelectedColor) ?
            swatch
            : closestSwatch;
    }, null)?.color || "";
}

export default function JerseyColorOptions({ color, onSelect }) {
    const initialColor = normalizeHexColor(color);
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const colorGrid = useMemo(buildColorGrid, []);

    useEffect(() => {
        const normalizedColor = normalizeHexColor(color);
        if (!normalizedColor) {
            setSelectedColor("");
            return;
        }

        setSelectedColor(normalizedColor);
    }, [color]);

    function selectColor(nextColor) {
        const normalizedColor = normalizeHexColor(nextColor);
        if (!normalizedColor) {
            return;
        }

        setSelectedColor(normalizedColor);
        onSelect(normalizedColor);
    }

    const previewTextColor = selectedColor ? getTextColorForBackground(selectedColor) : "#52525B";
    const selectedGridColor = useMemo(() => getSelectedGridColor(colorGrid, selectedColor), [colorGrid, selectedColor]);

    return (
        <View>
            <View
                alignItems={"center"}
                backgroundColor={selectedColor || "gray.50"}
                borderColor={"gray.200"}
                borderRadius={10}
                borderWidth={1}
                flexDirection={"row"}
                justifyContent={"space-between"}
                marginBottom={3}
                padding={3}
            >
                <View alignItems={"center"} flexDirection={"row"} flex={1}>
                    <FontAwesome5 name="tshirt" size={18} color={previewTextColor} />
                    <View marginLeft={3} flex={1}>
                        <Text color={previewTextColor} fontSize={"xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                            Selected color
                        </Text>
                        <Text color={previewTextColor} fontSize={"lg"} fontWeight={"bold"} numberOfLines={1}>
                            {selectedColor ? "Jersey color selected" : "No jersey color"}
                        </Text>
                    </View>
                </View>
            </View>

            <Text color={"gray.700"} fontSize={"xs"} fontWeight={"bold"} marginBottom={2}>
                Jersey color
            </Text>
            <View
                accessibilityLabel={"Jersey color grid"}
                alignItems={"center"}
                backgroundColor={"gray.50"}
                borderColor={"gray.200"}
                borderRadius={10}
                borderWidth={1}
                padding={2}
            >
                {colorGrid.map((row, rowIndex) => (
                    <View
                        flexDirection={"row"}
                        key={`jersey-color-row-${rowIndex}`}
                        marginBottom={rowIndex === gridRows - 1 ? 0 : 1}
                    >
                        {row.map((swatch, columnIndex) => {
                            const isSelected = selectedGridColor.length > 0 && normalizeHexColor(swatch.color) === normalizeHexColor(selectedGridColor);

                            return (
                                <Pressable
                                    accessibilityLabel={swatch.label}
                                    accessibilityRole={"button"}
                                    key={swatch.key}
                                    onPress={() => selectColor(swatch.color)}
                                    style={({ pressed }) => ({
                                        alignItems: "center",
                                        backgroundColor: swatch.color,
                                        borderColor: isSelected ? openScoreboardColor : "rgba(24, 24, 27, 0.16)",
                                        borderRadius: 6,
                                        borderWidth: isSelected ? 3 : 1,
                                        height: 28,
                                        justifyContent: "center",
                                        marginRight: columnIndex === gridColumns - 1 ? 0 : 4,
                                        opacity: pressed ? 0.75 : 1,
                                        width: 28,
                                    })}
                                >
                                    {isSelected ? (
                                        <FontAwesome5 name="check" size={10} color={getTextColorForBackground(swatch.color)} />
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </View>
            <Text color={"gray.500"} fontSize={"2xs"} marginTop={2} textAlign={"center"}>
                Rows move through the color spectrum. The bottom row provides white-to-black grayscale.
            </Text>
        </View>
    );
}
