import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, useWindowDimensions } from 'react-native';
import { Button, FormControl, Input, NativeBaseProvider, ScrollView, Select, Spinner, Switch, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openScoreboardButtonTextColor, openScoreboardColor, openScoreboardTheme } from '../openscoreboardtheme';
import LoadingPage from './LoadingPage';
import {
    defaultBracketGroupDisplayStyles,
    getBracketGroupStyle,
    updateBracketGroupStyle,
} from './functions/bracketGroupStyles';

const fontOptions = [
    "Inter",
    "Arial",
    "Verdana",
    "Trebuchet MS",
    "Georgia",
    "Times New Roman",
    "Courier New",
    "Impact",
];

const fontWeightOptions = ["400", "500", "600", "700", "800", "900"];

const editorSections = [
    {
        description: "Choose whether this fills a TV or sits inside a transparent livestream overlay frame.",
        displayTypes: ["singleElimination", "roundRobin"],
        fields: [
            { key: "displayPurpose", label: "Display use", options: ["tv", "overlay"], type: "select" },
            { key: "overlayMargin", label: "Overlay outside margin", max: 160, min: 0, step: 1, type: "number" },
            { key: "borderColor", label: "Overlay border", type: "color" },
            { key: "borderWidth", label: "Overlay border width", max: 16, min: 0, step: 1, type: "number" },
            { key: "borderRadius", label: "Overlay corner radius", max: 64, min: 0, step: 1, type: "number" },
        ],
        icon: "television-guide",
        key: "layoutStyles",
        title: "Display format",
    },
    {
        description: "The surface behind the bracket or groups, including solid, gradient, or uploaded-image backgrounds.",
        displayTypes: ["singleElimination", "roundRobin"],
        fields: [
            { key: "backgroundType", label: "Background type", options: ["solid", "gradient", "image"], type: "select" },
            { help: "Fills the entire display canvas.", key: "backgroundColor", label: "Canvas background", type: "color" },
            { key: "gradientStartColor", label: "Gradient start", type: "color" },
            { key: "gradientEndColor", label: "Gradient end", type: "color" },
            { key: "gradientAngle", label: "Gradient angle", max: 360, min: 0, step: 1, type: "number" },
            { key: "backgroundImageFit", label: "Image fit", options: ["cover", "contain", "stretch"], type: "select" },
            { help: "Used for empty-state and fallback messages.", key: "color", label: "Fallback text", type: "color" },
        ],
        icon: "image-multiple-outline",
        key: "boardStyles",
        title: "Canvas background",
    },
    {
        description: "The competition name centered at the top of the canvas.",
        displayTypes: ["singleElimination", "roundRobin"],
        fields: [
            { key: "color", label: "Title color", type: "color" },
            { key: "fontSize", label: "Title size", max: 72, min: 18, step: 1, type: "number" },
            { key: "fontFamily", label: "Title font", options: fontOptions, type: "select" },
            { key: "fontWeight", label: "Title weight", options: fontWeightOptions, type: "select" },
        ],
        icon: "format-title",
        key: "titleStyles",
        title: "Competition title",
    },
    {
        description: "Round labels such as Quarterfinals, Semifinals, and Final.",
        displayTypes: ["singleElimination"],
        fields: [
            { key: "color", label: "Round label color", type: "color" },
            { key: "fontSize", label: "Round label size", max: 36, min: 10, step: 1, type: "number" },
            { key: "fontFamily", label: "Round label font", options: fontOptions, type: "select" },
            { key: "fontWeight", label: "Round label weight", options: fontWeightOptions, type: "select" },
        ],
        icon: "format-list-numbered",
        key: "roundNameStyles",
        title: "Round labels",
    },
    {
        description: "Each two-player match card, including names, scores, dividers, and winner emphasis.",
        displayTypes: ["singleElimination"],
        fields: [
            { key: "backgroundType", label: "Card fill", options: ["solid", "gradient"], type: "select" },
            { key: "backgroundColor", label: "Card background", type: "color" },
            { key: "gradientStartColor", label: "Gradient start", type: "color" },
            { key: "gradientEndColor", label: "Gradient end", type: "color" },
            { key: "gradientAngle", label: "Gradient angle", max: 360, min: 0, step: 1, type: "number" },
            { key: "color", label: "Player name color", type: "color" },
            { key: "scoreColor", label: "Score color", type: "color" },
            { key: "dividerColor", label: "Row divider", type: "color" },
            { key: "winnerBackgroundColor", label: "Winner highlight", type: "color" },
            { key: "fontSize", label: "Player text size", max: 28, min: 10, step: 1, type: "number" },
            { key: "fontFamily", label: "Player font", options: fontOptions, type: "select" },
            { key: "fontWeight", label: "Player weight", options: fontWeightOptions, type: "select" },
            { key: "borderRadius", label: "Card corner radius", max: 28, min: 0, step: 1, type: "number" },
        ],
        icon: "card-text-outline",
        key: "bracketStyles",
        title: "Match cards",
    },
    {
        description: "Show a player portrait, country flag, or both before player names in brackets and groups.",
        displayTypes: ["singleElimination", "roundRobin"],
        fields: [
            { key: "showPlayerImage", label: "Show player image", type: "switch" },
            { key: "showCountryFlag", label: "Show country flag", type: "switch" },
            { key: "imageSize", label: "Player image size", max: 48, min: 16, step: 1, type: "number" },
            { key: "flagWidth", label: "Flag width", max: 48, min: 16, step: 1, type: "number" },
            { key: "flagHeight", label: "Flag height", max: 32, min: 10, step: 1, type: "number" },
            { key: "gap", label: "Space before name", max: 20, min: 2, step: 1, type: "number" },
        ],
        icon: "account-box-multiple-outline",
        key: "playerIdentityStyles",
        title: "Player images & flags",
    },
    {
        description: "The paths connecting one bracket round to the next and the outlines around cards.",
        displayTypes: ["singleElimination"],
        fields: [
            { key: "color", label: "Connector color", type: "color" },
            { key: "width", label: "Connector width", max: 8, min: 1, step: 1, type: "number" },
            { key: "borderStyle", label: "Stroke style", options: ["solid", "dashed", "dotted"], type: "select" },
        ],
        icon: "vector-polyline",
        key: "bracketLineStyles",
        title: "Connectors & outlines",
    },
    {
        description: "The heading strip at the top of every round-robin group table.",
        displayTypes: ["roundRobin"],
        fields: [
            { key: "backgroundType", label: "Header fill", options: ["solid", "gradient"], type: "select" },
            { key: "backgroundColor", label: "Header background", type: "color" },
            { key: "gradientStartColor", label: "Gradient start", type: "color" },
            { key: "gradientEndColor", label: "Gradient end", type: "color" },
            { key: "gradientAngle", label: "Gradient angle", max: 360, min: 0, step: 1, type: "number" },
            { key: "color", label: "Header text", type: "color" },
            { key: "fontSize", label: "Header text size", max: 32, min: 10, step: 1, type: "number" },
            { key: "fontFamily", label: "Header font", options: fontOptions, type: "select" },
            { key: "fontWeight", label: "Header weight", options: fontWeightOptions, type: "select" },
        ],
        icon: "table-headers-eye",
        key: "groupHeaderStyles",
        title: "Group headers",
    },
    {
        description: "Player rows and standings inside every round-robin group table.",
        displayTypes: ["roundRobin"],
        fields: [
            { key: "backgroundType", label: "Row fill", options: ["alternating", "gradient"], type: "select" },
            { key: "backgroundColor", label: "Primary row", type: "color" },
            { key: "alternateBackgroundColor", label: "Alternating row", type: "color" },
            { key: "gradientStartColor", label: "Gradient start", type: "color" },
            { key: "gradientEndColor", label: "Gradient end", type: "color" },
            { key: "gradientAngle", label: "Gradient angle", max: 360, min: 0, step: 1, type: "number" },
            { key: "color", label: "Player text", type: "color" },
            { key: "fontSize", label: "Player text size", max: 28, min: 10, step: 1, type: "number" },
            { key: "fontFamily", label: "Player font", options: fontOptions, type: "select" },
            { key: "fontWeight", label: "Player weight", options: fontWeightOptions, type: "select" },
        ],
        icon: "table-account",
        key: "groupPlayerStyles",
        title: "Group player rows",
    },
    {
        description: "Optional supporting text centered below the group tables.",
        displayTypes: ["roundRobin"],
        fields: [
            { key: "color", label: "Footer color", type: "color" },
            { key: "fontSize", label: "Footer size", max: 32, min: 10, step: 1, type: "number" },
            { key: "fontFamily", label: "Footer font", options: fontOptions, type: "select" },
            { key: "fontWeight", label: "Footer weight", options: fontWeightOptions, type: "select" },
        ],
        icon: "page-layout-footer",
        key: "footerStyles",
        title: "Group footer",
    },
    {
        description: "Upload logos or sponsor artwork into fixed slots along the top or bottom of the canvas.",
        displayTypes: ["singleElimination", "roundRobin"],
        fields: [
            { key: "rowHeight", label: "Sponsor row height", max: 180, min: 36, step: 1, type: "number" },
            { key: "imageFit", label: "Logo fit", options: ["contain", "cover", "stretch"], type: "select" },
            { key: "backgroundColor", label: "Sponsor row background", type: "color" },
        ],
        icon: "advertisements",
        key: "sponsorStyles",
        title: "Sponsor images",
    },
];

const previewBracket = [
    {
        title: "Quarterfinals",
        seeds: [
            { AScore: 3, BScore: 1, teams: [{ name: "Avery Chen" }, { name: "Jordan Rivera" }], winnerTeamIndex: 0 },
            { AScore: 2, BScore: 3, teams: [{ name: "Morgan Patel" }, { name: "Casey Thompson" }], winnerTeamIndex: 1 },
            { AScore: 3, BScore: 0, teams: [{ name: "Riley Park" }, { name: "Taylor Brooks" }], winnerTeamIndex: 0 },
            { AScore: 1, BScore: 3, teams: [{ name: "Drew Martinez" }, { name: "Cameron Lee" }], winnerTeamIndex: 1 },
        ],
    },
    {
        title: "Semifinals",
        seeds: [
            { AScore: 3, BScore: 2, teams: [{ name: "Avery Chen" }, { name: "Casey Thompson" }], winnerTeamIndex: 0 },
            { AScore: 1, BScore: 3, teams: [{ name: "Riley Park" }, { name: "Cameron Lee" }], winnerTeamIndex: 1 },
        ],
    },
    {
        title: "Final",
        seeds: [
            { AScore: 2, BScore: 3, teams: [{ name: "Avery Chen" }, { name: "Cameron Lee" }], winnerTeamIndex: 1 },
        ],
    },
];

const previewGroups = [
    {
        name: "Group A",
        players: [
            { losses: 0, name: "Avery Chen", wins: 3 },
            { losses: 1, name: "Jordan Rivera", wins: 2 },
            { losses: 2, name: "Morgan Patel", wins: 1 },
            { losses: 3, name: "Taylor Brooks", wins: 0 },
        ],
    },
    {
        name: "Group B",
        players: [
            { losses: 0, name: "Cameron Lee", wins: 3 },
            { losses: 1, name: "Riley Park", wins: 2 },
            { losses: 2, name: "Drew Martinez", wins: 1 },
            { losses: 3, name: "Casey Thompson", wins: 0 },
        ],
    },
];
const previewImageCache = new Map();

function getStylesFromRecord(record = {}) {
    return Object.keys(defaultBracketGroupDisplayStyles).reduce((styleMap, sectionKey) => {
        styleMap[sectionKey] = {
            ...defaultBracketGroupDisplayStyles[sectionKey],
            ...(record?.[sectionKey] || {}),
        };
        return styleMap;
    }, {});
}

function isHexColor(value) {
    return /^#[0-9a-f]{6}$/i.test(`${value || ""}`);
}

function normalizeHexColor(value, fallback = "#000000") {
    const nextValue = `${value || ""}`.trim();
    if (/^[0-9a-f]{6}$/i.test(nextValue)) {
        return `#${nextValue}`.toUpperCase();
    }
    if (isHexColor(nextValue)) {
        return nextValue.toUpperCase();
    }
    return fallback;
}

function asNumber(value, fallback) {
    const nextValue = Number(value);
    return Number.isFinite(nextValue) ? nextValue : fallback;
}

function createCanvasGradient(context, rectangle, startColor, endColor, angle) {
    const radians = asNumber(angle, 135) * Math.PI / 180;
    const centerX = rectangle.x + rectangle.width / 2;
    const centerY = rectangle.y + rectangle.height / 2;
    const distance = Math.abs(rectangle.width * Math.cos(radians)) + Math.abs(rectangle.height * Math.sin(radians));
    const offsetX = Math.cos(radians) * distance / 2;
    const offsetY = Math.sin(radians) * distance / 2;
    const gradient = context.createLinearGradient(
        centerX - offsetX,
        centerY - offsetY,
        centerX + offsetX,
        centerY + offsetY,
    );
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
}

function getCanvasSurfaceFill(context, surfaceStyles, rectangle) {
    if (surfaceStyles?.backgroundType === "gradient") {
        return createCanvasGradient(
            context,
            rectangle,
            surfaceStyles.gradientStartColor || surfaceStyles.backgroundColor || "#050816",
            surfaceStyles.gradientEndColor || surfaceStyles.backgroundColor || "#172554",
            surfaceStyles.gradientAngle,
        );
    }
    return surfaceStyles?.backgroundColor || "#050816";
}

function getPreviewImage(url, onLoad) {
    if (!url || typeof Image === "undefined") {
        return null;
    }
    if (previewImageCache.has(url)) {
        const cachedImage = previewImageCache.get(url);
        if (!cachedImage.complete) {
            cachedImage.onload = onLoad;
        }
        return cachedImage;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = onLoad;
    image.src = url;
    previewImageCache.set(url, image);
    return image;
}

function drawCanvasImage(context, image, rectangle, fit = "contain") {
    if (!image?.complete || !image.naturalWidth || !image.naturalHeight) {
        return;
    }
    if (fit === "stretch") {
        context.drawImage(image, rectangle.x, rectangle.y, rectangle.width, rectangle.height);
        return;
    }

    const scale = fit === "cover"
        ? Math.max(rectangle.width / image.naturalWidth, rectangle.height / image.naturalHeight)
        : Math.min(rectangle.width / image.naturalWidth, rectangle.height / image.naturalHeight);
    const imageWidth = image.naturalWidth * scale;
    const imageHeight = image.naturalHeight * scale;
    context.drawImage(
        image,
        rectangle.x + (rectangle.width - imageWidth) / 2,
        rectangle.y + (rectangle.height - imageHeight) / 2,
        imageWidth,
        imageHeight,
    );
}

function setCanvasLineStyle(context, lineStyles) {
    const width = Math.max(1, asNumber(lineStyles?.width, 2));
    const lineStyle = `${lineStyles?.borderStyle || "solid"}`;
    context.strokeStyle = lineStyles?.color || "#38BDF8";
    context.lineWidth = width;
    context.setLineDash(
        lineStyle === "dashed"
            ? [width * 5, width * 3]
            : lineStyle === "dotted"
                ? [width, width * 2.5]
                : [],
    );
}

function drawRoundedRect(context, x, y, width, height, radius) {
    const safeRadius = Math.min(Math.max(0, radius), width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + width, y, x + width, y + height, safeRadius);
    context.arcTo(x + width, y + height, x, y + height, safeRadius);
    context.arcTo(x, y + height, x, y, safeRadius);
    context.arcTo(x, y, x + width, y, safeRadius);
    context.closePath();
    context.fill();
    context.stroke();
}

function drawCanvasText(context, text, x, y, options = {}) {
    const {
        align = "left",
        color = "#FFFFFF",
        fontFamily = "Inter",
        fontSize = 16,
        maxWidth,
        weight = "700",
    } = options;
    context.fillStyle = color;
    context.font = `${weight} ${fontSize}px "${fontFamily}", Arial, sans-serif`;
    context.textAlign = align;
    context.textBaseline = "middle";
    context.fillText(text, x, y, maxWidth);
}

function drawPreviewPlayerIdentity(context, styles, x, centerY, name) {
    const identityStyles = styles.playerIdentityStyles || {};
    const gap = asNumber(identityStyles.gap, 8);
    let nextX = x;

    if (identityStyles.showPlayerImage === true) {
        const imageSize = asNumber(identityStyles.imageSize, 28);
        context.save();
        context.fillStyle = "#2563EB";
        context.beginPath();
        context.arc(nextX + imageSize / 2, centerY, imageSize / 2, 0, Math.PI * 2);
        context.fill();
        drawCanvasText(context, `${name || "P"}`.trim().charAt(0).toUpperCase(), nextX + imageSize / 2, centerY, {
            align: "center",
            color: "#FFFFFF",
            fontSize: Math.max(10, imageSize * 0.42),
            weight: "900",
        });
        context.restore();
        nextX += imageSize + gap;
    }

    if (identityStyles.showCountryFlag === true) {
        const flagWidth = asNumber(identityStyles.flagWidth, 26);
        const flagHeight = asNumber(identityStyles.flagHeight, 18);
        const flagY = centerY - flagHeight / 2;
        context.fillStyle = "#DC2626";
        context.fillRect(nextX, flagY, flagWidth, flagHeight / 3);
        context.fillStyle = "#FFFFFF";
        context.fillRect(nextX, flagY + flagHeight / 3, flagWidth, flagHeight / 3);
        context.fillStyle = "#2563EB";
        context.fillRect(nextX, flagY + flagHeight * 2 / 3, flagWidth, flagHeight / 3);
        context.strokeStyle = "rgba(17,24,39,0.25)";
        context.lineWidth = 1;
        context.strokeRect(nextX, flagY, flagWidth, flagHeight);
        nextX += flagWidth + gap;
    }

    return nextX;
}

function drawFocusOutline(context, rectangles, label) {
    if (!rectangles.length) {
        return;
    }

    context.save();
    context.strokeStyle = "#FACC15";
    context.fillStyle = "rgba(250, 204, 21, 0.08)";
    context.lineWidth = 3;
    context.setLineDash([8, 6]);
    rectangles.forEach((rectangle) => {
        context.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
        context.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    });
    context.setLineDash([]);
    context.fillStyle = "#FACC15";
    drawRoundedRect(context, 18, 16, Math.max(136, label.length * 7.5 + 24), 30, 7);
    drawCanvasText(context, `Editing: ${label}`, 30, 31, {
        color: "#111827",
        fontSize: 12,
        weight: "900",
    });
    context.restore();
}

function clipCanvasRoundedRect(context, rectangle, radius) {
    const safeRadius = Math.min(Math.max(0, radius), rectangle.width / 2, rectangle.height / 2);
    context.beginPath();
    context.moveTo(rectangle.x + safeRadius, rectangle.y);
    context.arcTo(rectangle.x + rectangle.width, rectangle.y, rectangle.x + rectangle.width, rectangle.y + rectangle.height, safeRadius);
    context.arcTo(rectangle.x + rectangle.width, rectangle.y + rectangle.height, rectangle.x, rectangle.y + rectangle.height, safeRadius);
    context.arcTo(rectangle.x, rectangle.y + rectangle.height, rectangle.x, rectangle.y, safeRadius);
    context.arcTo(rectangle.x, rectangle.y, rectangle.x + rectangle.width, rectangle.y, safeRadius);
    context.closePath();
    context.clip();
}

function drawPreviewSponsorRow(context, styles, position, width, height, requestRender) {
    const sponsorStyles = styles.sponsorStyles || {};
    const images = position === "top" ? sponsorStyles.topImages || [] : sponsorStyles.bottomImages || [];
    const rowHeight = Math.max(36, Math.min(120, asNumber(sponsorStyles.rowHeight, 72)));
    const y = position === "top" ? 8 : height - rowHeight - 8;
    const displayImages = images.length > 0 ? images : [{}, {}, {}];
    const gap = 12;
    const slotWidth = (width - 32 - gap * (displayImages.length - 1)) / displayImages.length;

    context.fillStyle = sponsorStyles.backgroundColor || "#00000000";
    context.fillRect(16, y, width - 32, rowHeight);
    displayImages.forEach((imageRecord, index) => {
        const rectangle = {
            height: rowHeight,
            width: slotWidth,
            x: 16 + index * (slotWidth + gap),
            y,
        };
        if (imageRecord?.url) {
            const image = getPreviewImage(imageRecord.url, requestRender);
            drawCanvasImage(context, image, rectangle, sponsorStyles.imageFit || "contain");
        } else {
            context.save();
            context.strokeStyle = "rgba(255,255,255,0.35)";
            context.lineWidth = 1;
            context.setLineDash([6, 5]);
            context.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
            context.setLineDash([]);
            drawCanvasText(context, "Image slot", rectangle.x + rectangle.width / 2, rectangle.y + rectangle.height / 2, {
                align: "center",
                color: "rgba(255,255,255,0.6)",
                fontSize: 12,
                weight: "700",
            });
            context.restore();
        }
    });

    return { height: rowHeight, width: width - 32, x: 16, y };
}

function drawBracketCanvas(context, styles, activeSection, width, height) {
    const titleStyles = styles.titleStyles || {};
    const roundStyles = styles.roundNameStyles || {};
    const matchStyles = styles.bracketStyles || {};
    const lineStyles = styles.bracketLineStyles || {};
    const cardWidth = 204;
    const cardHeight = 58;
    const roundGap = 86;
    const startX = 38;
    const startY = 116;
    const firstRoundStep = 82;
    const focusRectangles = [];
    const matchRectangles = [];

    drawCanvasText(context, "Championship Bracket", width / 2, 48, {
        align: "center",
        color: titleStyles.color || "#FFFFFF",
        fontFamily: titleStyles.fontFamily || "Inter",
        fontSize: Math.min(48, asNumber(titleStyles.fontSize, 36)),
        weight: titleStyles.fontWeight || "900",
    });

    previewBracket.forEach((round, roundIndex) => {
        const roundX = startX + roundIndex * (cardWidth + roundGap);
        drawCanvasText(context, round.title, roundX + cardWidth / 2, 88, {
            align: "center",
            color: roundStyles.color || "#93C5FD",
            fontFamily: roundStyles.fontFamily || "Inter",
            fontSize: asNumber(roundStyles.fontSize, 18),
            weight: roundStyles.fontWeight || "900",
        });

        if (activeSection === "roundNameStyles") {
            focusRectangles.push({ height: 30, width: cardWidth, x: roundX, y: 72 });
        }

        round.seeds.forEach((seed, seedIndex) => {
            const step = firstRoundStep * Math.pow(2, roundIndex);
            const centerY = startY + step / 2 - firstRoundStep / 2 + seedIndex * step + cardHeight / 2;
            const rect = { height: cardHeight, width: cardWidth, x: roundX, y: centerY - cardHeight / 2 };
            matchRectangles.push(rect);

            context.fillStyle = getCanvasSurfaceFill(context, matchStyles, rect);
            setCanvasLineStyle(context, lineStyles);
            drawRoundedRect(context, rect.x, rect.y, rect.width, rect.height, asNumber(matchStyles.borderRadius, 12));
            context.setLineDash([]);
            context.strokeStyle = matchStyles.dividerColor || "#263247";
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(rect.x + 10, rect.y + cardHeight / 2);
            context.lineTo(rect.x + rect.width - 10, rect.y + cardHeight / 2);
            context.stroke();

            seed.teams.forEach((team, teamIndex) => {
                const rowY = rect.y + teamIndex * cardHeight / 2;
                const isWinner = seed.winnerTeamIndex === teamIndex;
                if (isWinner) {
                    context.fillStyle = matchStyles.winnerBackgroundColor || "#123B55";
                    context.fillRect(rect.x + 1, rowY + 1, rect.width - 2, cardHeight / 2 - 2);
                }
                const identityX = drawPreviewPlayerIdentity(
                    context,
                    styles,
                    rect.x + 12,
                    rowY + cardHeight / 4,
                    team.name,
                );
                drawCanvasText(context, team.name, identityX, rowY + cardHeight / 4, {
                    color: matchStyles.color || "#FFFFFF",
                    fontFamily: matchStyles.fontFamily || "Inter",
                    fontSize: Math.min(20, asNumber(matchStyles.fontSize, 16)),
                    maxWidth: rect.x + rect.width - 42 - identityX,
                    weight: isWinner ? "900" : matchStyles.fontWeight || "700",
                });
                drawCanvasText(context, `${teamIndex === 0 ? seed.AScore : seed.BScore}`, rect.x + rect.width - 14, rowY + cardHeight / 4, {
                    align: "right",
                    color: matchStyles.scoreColor || matchStyles.color || "#FFFFFF",
                    fontFamily: matchStyles.fontFamily || "Inter",
                    fontSize: Math.min(20, asNumber(matchStyles.fontSize, 16)),
                    weight: "900",
                });
            });

            const nextRound = previewBracket[roundIndex + 1];
            if (nextRound) {
                const nextStep = firstRoundStep * Math.pow(2, roundIndex + 1);
                const nextCenterY = startY + nextStep / 2 - firstRoundStep / 2 + Math.floor(seedIndex / 2) * nextStep + cardHeight / 2;
                const sideX = rect.x + rect.width;
                const joinX = sideX + roundGap / 2;
                setCanvasLineStyle(context, lineStyles);
                context.beginPath();
                context.moveTo(sideX, centerY);
                context.lineTo(joinX, centerY);
                context.lineTo(joinX, nextCenterY);
                context.lineTo(roundX + cardWidth + roundGap, nextCenterY);
                context.stroke();
                context.setLineDash([]);
            }
        });
    });

    if (activeSection === "titleStyles") {
        focusRectangles.push({ height: 50, width: 480, x: width / 2 - 240, y: 22 });
    }
    if (activeSection === "bracketStyles") {
        focusRectangles.push(...matchRectangles);
    }
    if (activeSection === "playerIdentityStyles") {
        focusRectangles.push(...matchRectangles);
    }
    if (activeSection === "bracketLineStyles") {
        focusRectangles.push({ height: height - 130, width: width - 50, x: 25, y: 105 });
    }

    return focusRectangles;
}

function drawGroupCanvas(context, styles, activeSection, width, height) {
    const titleStyles = styles.titleStyles || {};
    const headerStyles = styles.groupHeaderStyles || {};
    const playerStyles = styles.groupPlayerStyles || {};
    const footerStyles = styles.footerStyles || {};
    const lineStyles = styles.bracketLineStyles || {};
    const cardWidth = 360;
    const cardHeight = 250;
    const gap = 44;
    const startX = (width - cardWidth * 2 - gap) / 2;
    const startY = 112;
    const headerHeight = 50;
    const rowHeight = 44;
    const focusRectangles = [];

    drawCanvasText(context, "Group Stage", width / 2, 48, {
        align: "center",
        color: titleStyles.color || "#FFFFFF",
        fontFamily: titleStyles.fontFamily || "Inter",
        fontSize: Math.min(48, asNumber(titleStyles.fontSize, 36)),
        weight: titleStyles.fontWeight || "900",
    });

    previewGroups.forEach((group, groupIndex) => {
        const x = startX + groupIndex * (cardWidth + gap);
        context.fillStyle = getCanvasSurfaceFill(context, playerStyles, {
            height: cardHeight,
            width: cardWidth,
            x,
            y: startY,
        });
        setCanvasLineStyle(context, lineStyles);
        drawRoundedRect(context, x, startY, cardWidth, cardHeight, 16);
        context.setLineDash([]);

        context.fillStyle = getCanvasSurfaceFill(context, headerStyles, {
            height: headerHeight,
            width: cardWidth,
            x,
            y: startY,
        });
        context.fillRect(x + 1, startY + 1, cardWidth - 2, headerHeight);
        drawCanvasText(context, group.name, x + 16, startY + headerHeight / 2, {
            color: headerStyles.color || "#FFFFFF",
            fontFamily: headerStyles.fontFamily || "Inter",
            fontSize: asNumber(headerStyles.fontSize, 18),
            weight: headerStyles.fontWeight || "900",
        });
        drawCanvasText(context, "W-L", x + cardWidth - 16, startY + headerHeight / 2, {
            align: "right",
            color: headerStyles.color || "#FFFFFF",
            fontFamily: headerStyles.fontFamily || "Inter",
            fontSize: 15,
            weight: "900",
        });

        group.players.forEach((player, playerIndex) => {
            const rowY = startY + headerHeight + playerIndex * rowHeight;
            context.fillStyle = playerStyles.backgroundType === "gradient"
                ? getCanvasSurfaceFill(context, playerStyles, {
                    height: rowHeight,
                    width: cardWidth,
                    x,
                    y: rowY,
                })
                : playerIndex % 2 === 0
                    ? playerStyles.backgroundColor || "#FFFFFF"
                    : playerStyles.alternateBackgroundColor || "#E8EEF6";
            context.fillRect(x + 1, rowY, cardWidth - 2, rowHeight);
            const identityX = drawPreviewPlayerIdentity(context, styles, x + 16, rowY + rowHeight / 2, player.name);
            drawCanvasText(context, player.name, identityX, rowY + rowHeight / 2, {
                color: playerStyles.color || "#111827",
                fontFamily: playerStyles.fontFamily || "Inter",
                fontSize: asNumber(playerStyles.fontSize, 16),
                maxWidth: x + cardWidth - 76 - identityX,
                weight: playerStyles.fontWeight || "800",
            });
            drawCanvasText(context, `${player.wins}-${player.losses}`, x + cardWidth - 16, rowY + rowHeight / 2, {
                align: "right",
                color: playerStyles.color || "#111827",
                fontFamily: playerStyles.fontFamily || "Inter",
                fontSize: 15,
                weight: "900",
            });
        });

        if (activeSection === "groupHeaderStyles") {
            focusRectangles.push({ height: headerHeight, width: cardWidth, x, y: startY });
        }
        if (activeSection === "groupPlayerStyles") {
            focusRectangles.push({ height: rowHeight * group.players.length, width: cardWidth, x, y: startY + headerHeight });
        }
        if (activeSection === "playerIdentityStyles") {
            focusRectangles.push({ height: rowHeight * group.players.length, width: cardWidth, x, y: startY + headerHeight });
        }
    });

    drawCanvasText(context, "Top two players advance to the elimination bracket", width / 2, height - 42, {
        align: "center",
        color: footerStyles.color || "#CBD5E1",
        fontFamily: footerStyles.fontFamily || "Inter",
        fontSize: asNumber(footerStyles.fontSize, 16),
        weight: footerStyles.fontWeight || "700",
    });

    if (activeSection === "titleStyles") {
        focusRectangles.push({ height: 50, width: 360, x: width / 2 - 180, y: 22 });
    }
    if (activeSection === "footerStyles") {
        focusRectangles.push({ height: 34, width: 520, x: width / 2 - 260, y: height - 59 });
    }

    return focusRectangles;
}

function CanvasPreview({ activeSection, displayType, sectionTitle, styles }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (Platform.OS !== "web" || !canvasRef.current) {
            return;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) {
            return;
        }

        let renderFrame;
        renderFrame = () => {
            const width = canvas.width;
            const height = canvas.height;
            const boardStyles = styles.boardStyles || {};
            const layoutStyles = styles.layoutStyles || {};
            const sponsorStyles = styles.sponsorStyles || {};
            const isOverlay = layoutStyles.displayPurpose === "overlay";
            const frameRadius = isOverlay ? asNumber(layoutStyles.borderRadius, 20) : 0;
            const margin = isOverlay ? Math.max(0, asNumber(layoutStyles.overlayMargin, 48)) : 0;
            const frame = {
                height: Math.max(1, height - margin * 2),
                width: Math.max(1, width - margin * 2),
                x: margin,
                y: margin,
            };
            const topSponsorHeight = (sponsorStyles.topImages || []).length > 0
                ? Math.max(36, Math.min(120, asNumber(sponsorStyles.rowHeight, 72)))
                : 0;
            const bottomSponsorHeight = (sponsorStyles.bottomImages || []).length > 0
                ? Math.max(36, Math.min(120, asNumber(sponsorStyles.rowHeight, 72)))
                : 0;

            context.clearRect(0, 0, width, height);
            context.save();
            clipCanvasRoundedRect(context, frame, frameRadius);
            context.fillStyle = getCanvasSurfaceFill(context, boardStyles, frame);
            context.fillRect(frame.x, frame.y, frame.width, frame.height);

            if (boardStyles.backgroundType === "image" && boardStyles.backgroundImageURL) {
                const backgroundImage = getPreviewImage(boardStyles.backgroundImageURL, renderFrame);
                drawCanvasImage(context, backgroundImage, frame, boardStyles.backgroundImageFit || "cover");
            }

            context.translate(frame.x, frame.y + topSponsorHeight);
            context.scale(frame.width / width, Math.max(0.1, (frame.height - topSponsorHeight - bottomSponsorHeight) / height));
            const focusRectangles = displayType === "roundRobin"
                ? drawGroupCanvas(context, styles, activeSection, width, height)
                : drawBracketCanvas(context, styles, activeSection, width, height);
            if (activeSection === "boardStyles") {
                focusRectangles.push({ height: height - 10, width: width - 10, x: 5, y: 5 });
            }
            if (activeSection !== "layoutStyles" && activeSection !== "sponsorStyles") {
                drawFocusOutline(context, focusRectangles, sectionTitle);
            }
            context.restore();

            context.save();
            clipCanvasRoundedRect(context, frame, frameRadius);
            context.translate(frame.x, frame.y);
            context.scale(frame.width / width, frame.height / height);
            const sponsorFocus = [];
            if ((sponsorStyles.topImages || []).length > 0 || activeSection === "sponsorStyles") {
                sponsorFocus.push(drawPreviewSponsorRow(context, styles, "top", width, height, renderFrame));
            }
            if ((sponsorStyles.bottomImages || []).length > 0 || activeSection === "sponsorStyles") {
                sponsorFocus.push(drawPreviewSponsorRow(context, styles, "bottom", width, height, renderFrame));
            }
            if (activeSection === "sponsorStyles") {
                drawFocusOutline(context, sponsorFocus, sectionTitle);
            }
            context.restore();

            if (isOverlay) {
                context.save();
                context.strokeStyle = layoutStyles.borderColor || "#38BDF8";
                context.lineWidth = Math.max(0, asNumber(layoutStyles.borderWidth, 3));
                context.fillStyle = "transparent";
                drawRoundedRect(
                    context,
                    frame.x,
                    frame.y,
                    frame.width,
                    frame.height,
                    frameRadius,
                );
                context.restore();
            }

            if (activeSection === "layoutStyles") {
                drawFocusOutline(context, [frame], sectionTitle);
            }
        };

        renderFrame();
    }, [activeSection, displayType, sectionTitle, styles]);

    if (Platform.OS !== "web") {
        return (
            <View alignItems={"center"} backgroundColor={"gray.900"} borderRadius={8} justifyContent={"center"} minHeight={240} padding={5}>
                <MaterialCommunityIcons name="monitor-eye" size={32} color={"#FFFFFF"} />
                <Text color={"white"} fontWeight={"bold"} marginTop={2}>Canvas preview is available in the web editor.</Text>
            </View>
        );
    }

    return (
        <View backgroundColor={"gray.900"} borderRadius={8} overflow={"hidden"} width={"100%"}>
            {React.createElement("canvas", {
                height: 500,
                ref: canvasRef,
                style: {
                    aspectRatio: "16 / 9",
                    display: "block",
                    height: "auto",
                    maxHeight: 540,
                    width: "100%",
                },
                width: 960,
            })}
        </View>
    );
}

function ColorField({ onChange, value }) {
    const colorValue = normalizeHexColor(value);

    return (
        <View alignItems={"center"} flexDirection={"row"} width={"100%"}>
            {Platform.OS === "web" ? React.createElement("input", {
                "aria-label": "Choose color",
                onChange: (event) => onChange(event?.target?.value || colorValue),
                style: {
                    background: "transparent",
                    border: "1px solid #D1D5DB",
                    borderRadius: 6,
                    cursor: "pointer",
                    height: 40,
                    marginRight: 8,
                    padding: 2,
                    width: 48,
                },
                type: "color",
                value: colorValue,
            }) : (
                <View
                    backgroundColor={colorValue}
                    borderColor={"gray.300"}
                    borderRadius={6}
                    borderWidth={1}
                    height={40}
                    marginRight={2}
                    width={48}
                />
            )}
            <Input
                backgroundColor={"white"}
                borderColor={"gray.300"}
                color={"gray.900"}
                flex={1}
                onBlur={() => onChange(colorValue)}
                onChangeText={onChange}
                value={`${value ?? ""}`}
            />
        </View>
    );
}

function StyleField({ field, sectionKey, styles, updateStyle }) {
    const value = styles?.[sectionKey]?.[field.key];
    const getOptionLabel = (option) => {
        if (option === "tv") {
            return "TV / full screen";
        }
        if (option === "overlay") {
            return "Livestream overlay";
        }
        if (option === "400") {
            return "Regular 400";
        }
        if (option === "500") {
            return "Medium 500";
        }
        if (option === "600") {
            return "Semibold 600";
        }
        if (option === "700") {
            return "Bold 700";
        }
        if (option === "800") {
            return "Extra bold 800";
        }
        if (option === "900") {
            return "Black 900";
        }
        return option[0].toUpperCase() + option.slice(1);
    };

    return (
        <View flexBasis={{ base: "100%", md: "48%" }} marginBottom={3}>
            <FormControl>
                <FormControl.Label>{field.label}</FormControl.Label>
                {field.type === "color" ? (
                    <ColorField
                        onChange={(nextValue) => updateStyle(sectionKey, field.key, normalizeHexColor(nextValue, `${value || "#000000"}`))}
                        value={value}
                    />
                ) : field.type === "select" ? (
                    <Select
                        backgroundColor={"white"}
                        selectedValue={`${value || field.options?.[0] || ""}`}
                        onValueChange={(nextValue) => updateStyle(sectionKey, field.key, nextValue)}
                    >
                        {(field.options || []).map((option) => (
                            <Select.Item key={option} label={getOptionLabel(option)} value={option} />
                        ))}
                    </Select>
                ) : field.type === "switch" ? (
                    <View alignItems={"center"} flexDirection={"row"} minHeight={40}>
                        <Switch
                            isChecked={value === true}
                            onToggle={(nextValue) => updateStyle(sectionKey, field.key, nextValue)}
                        />
                        <Text color={"gray.600"} fontSize={"xs"} marginLeft={2}>
                            {value === true ? "Enabled" : "Hidden"}
                        </Text>
                    </View>
                ) : (
                    <Input
                        backgroundColor={"white"}
                        borderColor={"gray.300"}
                        color={"gray.900"}
                        keyboardType={"numeric"}
                        onChangeText={(nextValue) => {
                            const numberValue = Number(nextValue);
                            updateStyle(sectionKey, field.key, Number.isFinite(numberValue) ? numberValue : field.min || 0);
                        }}
                        value={`${value ?? ""}`}
                    />
                )}
                {field.help ? (
                    <FormControl.HelperText>{field.help}</FormControl.HelperText>
                ) : field.type === "number" ? (
                    <FormControl.HelperText>
                        Range {field.min}-{field.max}
                    </FormControl.HelperText>
                ) : null}
            </FormControl>
        </View>
    );
}

function FilePicker({ accept, disabled = false, label, onSelect }) {
    if (Platform.OS !== "web") {
        return (
            <Text color={"gray.500"} fontSize={"xs"}>
                File selection is available in the web editor.
            </Text>
        );
    }

    return React.createElement("label", {
        style: {
            alignItems: "center",
            background: disabled ? "#E5E7EB" : "#FFFFFF",
            border: "1px solid #BFDBFE",
            borderRadius: 8,
            color: disabled ? "#6B7280" : "#1D4ED8",
            cursor: disabled ? "default" : "pointer",
            display: "inline-flex",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 13,
            fontWeight: 800,
            justifyContent: "center",
            minHeight: 38,
            padding: "8px 12px",
        },
    }, [
        label,
        React.createElement("input", {
            accept,
            disabled,
            key: "input",
            onChange: (event) => {
                const file = event?.target?.files?.[0];
                if (file) {
                    onSelect(file);
                }
                event.target.value = "";
            },
            style: { display: "none" },
            type: "file",
        }),
    ]);
}

function BackgroundImageControl({ imageURL, onChange, onRemove }) {
    return (
        <View
            backgroundColor={"blue.50"}
            borderColor={"blue.100"}
            borderRadius={8}
            borderWidth={1}
            marginBottom={4}
            padding={3}
        >
            <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>Background image</Text>
            <Text color={"gray.600"} fontSize={"xs"} marginTop={1}>
                Paste a direct image URL. A 1920 × 1080 image is recommended for the sharpest full-screen result.
            </Text>
            <View alignItems={"center"} flexDirection={"row"} marginTop={3}>
                <Input
                    autoCapitalize={"none"}
                    backgroundColor={"white"}
                    borderColor={"gray.300"}
                    color={"gray.900"}
                    flex={1}
                    onChangeText={onChange}
                    placeholder={"https://example.com/background.png"}
                    value={imageURL}
                />
                {imageURL ? (
                    <Button marginLeft={2} onPress={onRemove} variant={"ghost"}>
                        <Text color={"red.700"} fontWeight={"bold"}>Remove</Text>
                    </Button>
                ) : null}
            </View>
        </View>
    );
}

function SponsorSlotEditor({ image, label, onChange, onRemove }) {
    return (
        <View
            backgroundColor={"gray.50"}
            borderColor={"gray.200"}
            borderRadius={8}
            borderWidth={1}
            marginBottom={2}
            padding={3}
        >
            <View>
                <View alignItems={"center"} flexDirection={"row"} marginBottom={2}>
                    <View
                        alignItems={"center"}
                        backgroundColor={image?.url ? "green.50" : "white"}
                        borderColor={image?.url ? "green.200" : "gray.200"}
                        borderRadius={7}
                        borderWidth={1}
                        height={42}
                        justifyContent={"center"}
                        marginRight={3}
                        width={58}
                    >
                        <MaterialCommunityIcons
                            name={image?.url ? "image-check-outline" : "image-plus-outline"}
                            size={22}
                            color={image?.url ? "#15803D" : "#6B7280"}
                        />
                    </View>
                    <View flex={1} paddingRight={2}>
                        <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>{label}</Text>
                        <Text color={"gray.500"} fontSize={"2xs"} marginTop={0.5} numberOfLines={1}>
                            Recommended 320 × 100 pixels
                        </Text>
                    </View>
                    {image?.url ? (
                        <Button marginLeft={1} onPress={onRemove} paddingX={2} variant={"ghost"}>
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color={"#B91C1C"} />
                        </Button>
                    ) : null}
                </View>
                <Input
                    autoCapitalize={"none"}
                    backgroundColor={"white"}
                    borderColor={"gray.300"}
                    color={"gray.900"}
                    onChangeText={onChange}
                    placeholder={"https://example.com/sponsor-logo.png"}
                    value={image?.url || ""}
                />
            </View>
        </View>
    );
}

function SectionNavigationItem({ active, item, onPress }) {
    return (
        <Pressable
            accessibilityRole={"button"}
            onPress={onPress}
            style={({ pressed }) => ({
                backgroundColor: active ? "#EFF6FF" : pressed ? "#F8FAFC" : "#FFFFFF",
                borderColor: active ? "#2563EB" : "#E5E7EB",
                borderRadius: 8,
                borderWidth: 1,
                marginBottom: 8,
                padding: 12,
                width: "100%",
            })}
        >
            <View alignItems={"center"} flexDirection={"row"}>
                <View
                    alignItems={"center"}
                    backgroundColor={active ? "blue.600" : "gray.100"}
                    borderRadius={7}
                    height={34}
                    justifyContent={"center"}
                    marginRight={3}
                    width={34}
                >
                    <MaterialCommunityIcons name={item.icon} size={19} color={active ? "#FFFFFF" : "#374151"} />
                </View>
                <View flex={1}>
                    <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"}>{item.title}</Text>
                    <Text color={"gray.500"} fontSize={"2xs"} marginTop={0.5} numberOfLines={2}>{item.description}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={active ? "#2563EB" : "#9CA3AF"} />
            </View>
        </Pressable>
    );
}

export default function BracketGroupStyleEditor(props) {
    const styleID = props.route?.params?.styleID || "";
    const { width } = useWindowDimensions();
    const isWide = width >= 940;
    const [activeSectionKey, setActiveSectionKey] = useState("layoutStyles");
    const [doneLoading, setDoneLoading] = useState(false);
    const [displayType, setDisplayType] = useState("singleElimination");
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("success");
    const [styles, setStyles] = useState(getStylesFromRecord(defaultBracketGroupDisplayStyles));
    const [title, setTitle] = useState("");

    useEffect(() => {
        async function loadStyle() {
            setDoneLoading(false);
            const style = await getBracketGroupStyle(styleID);
            setTitle(style?.title || "Bracket & Group Display");
            setDisplayType(style?.displayType || "singleElimination");
            setStyles(getStylesFromRecord(style || {}));
            setDoneLoading(true);
        }

        loadStyle();
    }, [styleID]);

    const visibleSections = useMemo(() => (
        editorSections.filter((section) => section.displayTypes.includes(displayType))
    ), [displayType]);
    const activeSection = visibleSections.find((section) => section.key === activeSectionKey) || visibleSections[0];
    const activeFields = activeSection?.key === "layoutStyles" && styles.layoutStyles?.displayPurpose !== "overlay"
        ? activeSection.fields.filter((field) => field.key === "displayPurpose")
        : activeSection?.fields || [];

    useEffect(() => {
        if (!visibleSections.some((section) => section.key === activeSectionKey)) {
            setActiveSectionKey(visibleSections[0]?.key || "layoutStyles");
        }
    }, [activeSectionKey, visibleSections]);

    function updateStyle(sectionKey, fieldKey, value) {
        setStatusMessage("");
        if (sectionKey === "layoutStyles" && fieldKey === "displayPurpose") {
            setStyles((currentStyles) => ({
                ...currentStyles,
                layoutStyles: {
                    ...(currentStyles.layoutStyles || {}),
                    borderRadius: value === "overlay" ? 20 : 0,
                    borderWidth: value === "overlay" ? 3 : 0,
                    displayPurpose: value,
                    overlayMargin: value === "overlay" ? 48 : 0,
                },
            }));
            return;
        }
        setStyles((currentStyles) => ({
            ...currentStyles,
            [sectionKey]: {
                ...(currentStyles[sectionKey] || {}),
                [fieldKey]: value,
            },
        }));
    }

    function resetActiveSection() {
        if (!activeSection) {
            return;
        }
        setStyles((currentStyles) => ({
            ...currentStyles,
            [activeSection.key]: {
                ...defaultBracketGroupDisplayStyles[activeSection.key],
            },
        }));
        setStatusMessage("");
    }

    function updateSponsorImage(position, index, image) {
        setStyles((currentStyles) => {
            const key = position === "top" ? "topImages" : "bottomImages";
            const images = [...(currentStyles.sponsorStyles?.[key] || [])];
            while (images.length < 3) {
                images.push({ name: "", url: "" });
            }
            images[index] = image;
            return {
                ...currentStyles,
                sponsorStyles: {
                    ...currentStyles.sponsorStyles,
                    [key]: images,
                },
            };
        });
    }

    function exportStyleFile() {
        if (Platform.OS !== "web") {
            return;
        }
        const exportData = {
            displayType,
            format: "openscoreboard-bracket-group-style",
            styles,
            title,
            version: 2,
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${(title || "display-style").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    async function importStyleFile(file) {
        try {
            const importedData = JSON.parse(await file.text());
            const importedStyles = importedData.styles || importedData;
            setStyles(getStylesFromRecord(importedStyles));
            if (importedData.title) {
                setTitle(importedData.title);
            }
            if (importedData.displayType === "roundRobin" || importedData.displayType === "singleElimination") {
                setDisplayType(importedData.displayType);
            }
            setStatusType("success");
            setStatusMessage("Style file imported. Save the style to publish these settings.");
        }
        catch (error) {
            console.error("[BracketGroupStyleEditor] failed to import style file", error);
            setStatusType("error");
            setStatusMessage("That file is not a valid OpenScoreboard style JSON file.");
        }
    }

    async function saveStyle() {
        setSaving(true);
        setStatusMessage("");
        try {
            await updateBracketGroupStyle(styleID, {
                ...styles,
                displayType,
                title,
            });
            setStatusType("success");
            setStatusMessage("Display style saved.");
        }
        catch (error) {
            console.error("[BracketGroupStyleEditor] failed to save display style", error);
            setStatusType("error");
            setStatusMessage("Display style could not be saved.");
        }
        finally {
            setSaving(false);
        }
    }

    if (!doneLoading) {
        return <LoadingPage />;
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"}>
                <View alignSelf={"center"} maxWidth={1260} padding={4} width={"100%"}>
                    <View
                        alignItems={{ base: "stretch", md: "center" }}
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        flexDirection={{ base: "column", md: "row" }}
                        marginBottom={4}
                        padding={4}
                    >
                        <View flex={1} paddingRight={{ base: 0, md: 4 }}>
                            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                Canvas display style
                            </Text>
                            <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"} marginTop={1}>
                                {title || "Display Style"}
                            </Text>
                            <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>
                                Edit the exact layers painted by the production bracket and group canvas.
                            </Text>
                        </View>
                        <View alignItems={"center"} flexDirection={"row"} flexWrap={"wrap"} marginTop={{ base: 3, md: 0 }}>
                            <FilePicker
                                accept={"application/json,.json"}
                                label={"Import JSON"}
                                onSelect={importStyleFile}
                            />
                            <Button
                                backgroundColor={"white"}
                                borderColor={"blue.200"}
                                borderRadius={8}
                                borderWidth={1}
                                marginLeft={2}
                                onPress={exportStyleFile}
                                variant={"outline"}
                            >
                                <Text color={"blue.700"} fontWeight={"bold"}>Export JSON</Text>
                            </Button>
                            <Button
                                backgroundColor={"white"}
                                borderColor={"gray.300"}
                                borderRadius={8}
                                borderWidth={1}
                                marginLeft={2}
                                onPress={resetActiveSection}
                                variant={"outline"}
                            >
                                <Text color={"gray.700"} fontWeight={"bold"}>Reset section</Text>
                            </Button>
                            <Button
                                backgroundColor={saving ? "gray.400" : openScoreboardColor}
                                borderRadius={8}
                                isDisabled={saving}
                                onPress={saveStyle}
                            >
                                {saving ? (
                                    <Spinner color={openScoreboardButtonTextColor} />
                                ) : (
                                    <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Save style</Text>
                                )}
                            </Button>
                        </View>
                    </View>

                    {statusMessage ? (
                        <View
                            backgroundColor={statusType === "error" ? "red.50" : "green.50"}
                            borderColor={statusType === "error" ? "red.200" : "green.200"}
                            borderRadius={8}
                            borderWidth={1}
                            marginBottom={4}
                            padding={3}
                        >
                            <Text color={statusType === "error" ? "red.800" : "green.800"} fontSize={"sm"} fontWeight={"bold"}>
                                {statusMessage}
                            </Text>
                        </View>
                    ) : null}

                    <View flexDirection={isWide ? "row" : "column"}>
                        <View paddingRight={isWide ? 3 : 0} width={isWide ? 310 : "100%"}>
                            <View
                                backgroundColor={"white"}
                                borderColor={"gray.200"}
                                borderRadius={8}
                                borderWidth={1}
                                marginBottom={4}
                                padding={3}
                            >
                                <FormControl marginBottom={3}>
                                    <FormControl.Label>Style name</FormControl.Label>
                                    <Input backgroundColor={"white"} color={"gray.900"} onChangeText={setTitle} value={title} />
                                </FormControl>
                                <FormControl>
                                    <FormControl.Label>Canvas type</FormControl.Label>
                                    <Select
                                        backgroundColor={"white"}
                                        selectedValue={displayType}
                                        onValueChange={setDisplayType}
                                    >
                                        <Select.Item label="Single elimination bracket" value="singleElimination" />
                                        <Select.Item label="Round robin groups" value="roundRobin" />
                                    </Select>
                                </FormControl>
                            </View>

                            <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} marginBottom={2} textTransform={"uppercase"}>
                                Canvas layers
                            </Text>
                            {visibleSections.map((section) => (
                                <SectionNavigationItem
                                    active={activeSection?.key === section.key}
                                    item={section}
                                    key={section.key}
                                    onPress={() => setActiveSectionKey(section.key)}
                                />
                            ))}
                        </View>

                        <View flex={1} minWidth={0} paddingLeft={isWide ? 3 : 0}>
                            <View
                                backgroundColor={"white"}
                                borderColor={"gray.200"}
                                borderRadius={8}
                                borderWidth={1}
                                marginBottom={4}
                                overflow={"hidden"}
                            >
                                <View borderColor={"gray.200"} borderBottomWidth={1} padding={4}>
                                    <Text color={"blue.700"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                        Editing canvas layer
                                    </Text>
                                    <View alignItems={"center"} flexDirection={"row"} marginTop={1}>
                                        <View
                                            alignItems={"center"}
                                            backgroundColor={"blue.50"}
                                            borderRadius={8}
                                            height={38}
                                            justifyContent={"center"}
                                            marginRight={3}
                                            width={38}
                                        >
                                            <MaterialCommunityIcons name={activeSection?.icon} size={21} color={openScoreboardColor} />
                                        </View>
                                        <View flex={1}>
                                            <Text color={"gray.900"} fontSize={"xl"} fontWeight={"bold"}>{activeSection?.title}</Text>
                                            <Text color={"gray.600"} fontSize={"sm"} marginTop={0.5}>{activeSection?.description}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View backgroundColor={"gray.900"} padding={3}>
                                    <View alignItems={"center"} flexDirection={"row"} justifyContent={"space-between"} marginBottom={2}>
                                        <Text color={"gray.300"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                            Live Canvas 2D preview
                                        </Text>
                                        <View
                                            backgroundColor={styles.layoutStyles?.displayPurpose === "overlay" ? "amber.400" : "green.400"}
                                            borderRadius={999}
                                            paddingX={2}
                                            paddingY={1}
                                        >
                                            <Text color={"gray.900"} fontSize={"2xs"} fontWeight={"bold"}>
                                                {styles.layoutStyles?.displayPurpose === "overlay" ? "Livestream overlay" : "TV full screen"}
                                            </Text>
                                        </View>
                                    </View>
                                    <CanvasPreview
                                        activeSection={activeSection?.key}
                                        displayType={displayType}
                                        sectionTitle={activeSection?.title || "Canvas"}
                                        styles={styles}
                                    />
                                </View>

                                <View padding={4}>
                                    <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} marginBottom={3} textTransform={"uppercase"}>
                                        Layer controls
                                    </Text>
                                    {activeSection?.key === "layoutStyles" && styles.layoutStyles?.displayPurpose !== "overlay" ? (
                                        <View
                                            backgroundColor={"green.50"}
                                            borderColor={"green.200"}
                                            borderRadius={8}
                                            borderWidth={1}
                                            marginBottom={3}
                                            padding={3}
                                        >
                                            <Text color={"green.800"} fontSize={"xs"} fontWeight={"bold"}>
                                                TV mode fills the complete screen with square corners. Overlay margins, borders, and rounded corners are intentionally disabled.
                                            </Text>
                                        </View>
                                    ) : null}
                                    {activeSection?.key === "boardStyles" ? (
                                        <BackgroundImageControl
                                            imageURL={styles.boardStyles?.backgroundImageURL || ""}
                                            onChange={(url) => {
                                                updateStyle("boardStyles", "backgroundImageURL", url);
                                                if (url.trim()) {
                                                    updateStyle("boardStyles", "backgroundType", "image");
                                                }
                                            }}
                                            onRemove={() => {
                                                updateStyle("boardStyles", "backgroundImageURL", "");
                                                updateStyle("boardStyles", "backgroundType", "solid");
                                            }}
                                        />
                                    ) : null}
                                    {activeSection?.key === "sponsorStyles" ? (
                                        <View marginBottom={4}>
                                            {["top", "bottom"].map((position) => {
                                                const key = position === "top" ? "topImages" : "bottomImages";
                                                const images = styles.sponsorStyles?.[key] || [];
                                                return (
                                                    <View key={position} marginBottom={3}>
                                                        <Text color={"gray.900"} fontSize={"sm"} fontWeight={"bold"} marginBottom={2}>
                                                            {position === "top" ? "Top sponsor slots" : "Bottom sponsor slots"}
                                                        </Text>
                                                        {[0, 1, 2].map((index) => (
                                                            <SponsorSlotEditor
                                                                image={images[index]}
                                                                key={`${position}-${index + 1}`}
                                                                label={`${position === "top" ? "Top" : "Bottom"} image ${index + 1}`}
                                                                onChange={(url) => updateSponsorImage(position, index, {
                                                                    name: `${position === "top" ? "Top" : "Bottom"} sponsor ${index + 1}`,
                                                                    url,
                                                                })}
                                                                onRemove={() => updateSponsorImage(position, index, { name: "", url: "" })}
                                                            />
                                                        ))}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    ) : null}
                                    <View flexDirection={"row"} flexWrap={"wrap"} justifyContent={"space-between"}>
                                        {activeFields.map((field) => (
                                            <StyleField
                                                field={field}
                                                key={`${activeSection.key}-${field.key}`}
                                                sectionKey={activeSection.key}
                                                styles={styles}
                                                updateStyle={updateStyle}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </NativeBaseProvider>
    );
}
