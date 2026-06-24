import { resolveCountryCode } from "./fields/countryFlag";

type DatabaseLike = {
    ref: (path: string) => {
        get?: () => Promise<{ val: () => unknown }>;
        on: (event: "value", callback: (snapshot: { val: () => unknown }) => void) => void;
        off?: (event?: "value") => void;
    };
};

type CameraMode = "auto" | "fit" | "free";
type DisplayMode = "singleElimination" | "roundRobin" | "";

type Camera = {
    x: number;
    y: number;
    zoom: number;
};

type Rect = {
    height: number;
    width: number;
    x: number;
    y: number;
};

type SeedTeam = {
    country?: string;
    id?: string;
    imageURL?: string;
    name?: string;
};

type BracketSeed = {
    AScore?: number | string;
    BScore?: number | string;
    isComplete?: boolean;
    teams?: SeedTeam[];
    winnerTeamIndex?: number;
};

type BracketRound = {
    seeds?: BracketSeed[];
    title?: string;
};

type RoundRobinPlayer = {
    country?: string;
    imageURL?: string;
    losses?: number;
    playerName?: string;
    seedPosition?: number;
    showInGroup?: boolean;
    wins?: number;
};

type RoundRobinMatch = {
    AScore?: number | string;
    BScore?: number | string;
    isComplete?: boolean;
    playerA?: string;
    playerB?: string;
};

type RoundRobinGroup = {
    groupName?: string;
    matches?: Record<string, RoundRobinMatch>;
    players?: Record<string, RoundRobinPlayer>;
    showOnBoard?: boolean;
};

type CompetitionRecord = {
    data?: {
        brackets?: BracketRound[];
        footer?: string;
        title?: string;
    };
    groups?: Record<string, RoundRobinGroup>;
    showBoard?: boolean;
    title?: string;
    type?: "singleElimination" | "roundRobin" | string;
};

type DisplayStyleRecord = {
    boardStyles?: Record<string, string | number>;
    bracketLineStyles?: Record<string, string | number>;
    bracketStyles?: Record<string, string | number>;
    footerStyles?: Record<string, string | number>;
    groupHeaderStyles?: Record<string, string | number>;
    groupPlayerStyles?: Record<string, string | number>;
    layoutStyles?: Record<string, string | number>;
    playerIdentityStyles?: Record<string, string | number | boolean>;
    roundNameStyles?: Record<string, string | number>;
    sponsorStyles?: {
        backgroundColor?: string;
        bottomImages?: Array<{ name?: string; url?: string }>;
        imageFit?: string;
        rowHeight?: number;
        topImages?: Array<{ name?: string; url?: string }>;
    };
    title?: string;
    titleStyles?: Record<string, string | number>;
};

type DynamicBracketGroupDisplayRecord = {
    cameraMode?: CameraMode | string;
    competitionID?: string;
    displayType?: "singleElimination" | "roundRobin" | string;
    styleID?: string;
    title?: string;
};

const defaultStyles: Required<Omit<DisplayStyleRecord, "title">> = {
    layoutStyles: {
        displayPurpose: "tv",
        overlayMargin: 0,
        borderColor: "#38BDF8",
        borderWidth: 0,
        borderRadius: 0,
    },
    boardStyles: {
        backgroundType: "solid",
        backgroundColor: "#050816",
        backgroundImageFit: "cover",
        backgroundImageURL: "",
        borderColor: "#1D4ED8",
        color: "#FFFFFF",
        gradientAngle: 135,
        gradientEndColor: "#172554",
        gradientStartColor: "#050816",
    },
    bracketLineStyles: {
        borderStyle: "solid",
        color: "#38BDF8",
        width: 2,
    },
    bracketStyles: {
        backgroundType: "solid",
        backgroundColor: "#0B1220",
        color: "#FFFFFF",
        dividerColor: "#263247",
        fontSize: 16,
        borderRadius: 12,
        fontFamily: "Inter",
        fontWeight: "700",
        gradientAngle: 135,
        gradientEndColor: "#172033",
        gradientStartColor: "#0B1220",
        scoreColor: "#FFFFFF",
        winnerBackgroundColor: "#123B55",
    },
    footerStyles: {
        color: "#CBD5E1",
        fontFamily: "Inter",
        fontSize: 16,
        fontWeight: "700",
    },
    groupHeaderStyles: {
        backgroundType: "solid",
        backgroundColor: "#0B1220",
        color: "#FFFFFF",
        fontFamily: "Inter",
        fontSize: 18,
        fontWeight: "900",
        gradientAngle: 135,
        gradientEndColor: "#1E3A8A",
        gradientStartColor: "#0B1220",
    },
    groupPlayerStyles: {
        alternateBackgroundColor: "#E8EEF6",
        backgroundType: "alternating",
        backgroundColor: "#FFFFFF",
        color: "#111827",
        fontFamily: "Inter",
        fontSize: 16,
        fontWeight: "800",
        gradientAngle: 90,
        gradientEndColor: "#DBEAFE",
        gradientStartColor: "#FFFFFF",
    },
    playerIdentityStyles: {
        flagHeight: 18,
        flagWidth: 26,
        gap: 8,
        imageSize: 28,
        showCountryFlag: false,
        showPlayerImage: false,
    },
    roundNameStyles: {
        color: "#93C5FD",
        fontFamily: "Inter",
        fontSize: 18,
        fontWeight: "900",
    },
    sponsorStyles: {
        backgroundColor: "#00000000",
        bottomImages: [],
        imageFit: "contain",
        rowHeight: 72,
        topImages: [],
    },
    titleStyles: {
        color: "#FFFFFF",
        fontFamily: "Inter",
        fontSize: 36,
        fontWeight: "900",
    },
};

const params = new URLSearchParams(window.location.search);
const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));

let competition: CompetitionRecord | null = null;
let displayStyle: DisplayStyleRecord = defaultStyles;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let statusElement: HTMLElement | null;
let cameraMode: CameraMode = getInitialCameraMode();
let displayMode: DisplayMode = getInitialDisplayMode();
let camera: Camera = { x: 0, y: 0, zoom: 1 };
let targetCamera: Camera = { x: 0, y: 0, zoom: 1 };
let worldBounds: Rect = { x: 0, y: 0, width: 1920, height: 1080 };
let cameraTargets: Rect[] = [];
let activeTargetIndex = 0;
let lastTargetChange = 0;
let lastInteraction = 0;
let dragState: { pointerID: number; x: number; y: number } | null = null;
let pinchState: { distance: number; zoom: number } | null = null;
const activePointers = new Map<number, { x: number; y: number }>();
const imageCache = new Map<string, HTMLImageElement>();

function getInitialCameraMode(): CameraMode {
    const cameraParam = params.get("camera") || "";
    return normalizeCameraMode(cameraParam);
}

function normalizeCameraMode(value: unknown): CameraMode {
    if (value === "fit" || value === "free") {
        return value;
    }
    return "auto";
}

function readID(...keys: string[]) {
    for (const key of keys) {
        const value = params.get(key);
        if (value && value.trim().length > 0) {
            return value.trim();
        }
    }
    return "";
}

function getInitialDisplayMode(): DisplayMode {
    const displayParam = readID("displayType", "display", "type");
    if (displayParam === "roundRobin" || displayParam === "groups") {
        return "roundRobin";
    }
    if (displayParam === "singleElimination" || displayParam === "bracket" || displayParam === "brackets") {
        return "singleElimination";
    }

    const pathname = window.location.pathname || "";
    if (pathname.includes("/groups")) {
        return "roundRobin";
    }
    if (pathname.includes("/brackets")) {
        return "singleElimination";
    }

    return "";
}

function getStyleSection<K extends keyof typeof defaultStyles>(section: K) {
    return {
        ...defaultStyles[section],
        ...(displayStyle?.[section] || {}),
    };
}

function asNumber(value: unknown, fallback: number) {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
}

function getFrameRect(): Rect {
    const layoutStyles = getStyleSection("layoutStyles");
    const viewWidth = Math.max(1, canvas.width / dpr);
    const viewHeight = Math.max(1, canvas.height / dpr);
    const isOverlay = layoutStyles.displayPurpose === "overlay";
    const margin = isOverlay ? Math.max(0, asNumber(layoutStyles.overlayMargin, 48)) : 0;

    return {
        x: margin,
        y: margin,
        width: Math.max(1, viewWidth - margin * 2),
        height: Math.max(1, viewHeight - margin * 2),
    };
}

function getFrameRadius() {
    const layoutStyles = getStyleSection("layoutStyles");
    return layoutStyles.displayPurpose === "overlay"
        ? Math.max(0, asNumber(layoutStyles.borderRadius, 20))
        : 0;
}

function getSponsorImages(position: "top" | "bottom") {
    const sponsorStyles = getStyleSection("sponsorStyles");
    const images = position === "top" ? sponsorStyles.topImages : sponsorStyles.bottomImages;
    return Array.isArray(images) ? images.filter((image) => image?.url) : [];
}

function getCameraViewportRect(): Rect {
    const frame = getFrameRect();
    const sponsorStyles = getStyleSection("sponsorStyles");
    const rowHeight = Math.max(0, asNumber(sponsorStyles.rowHeight, 72));
    const topHeight = getSponsorImages("top").length > 0 ? rowHeight : 0;
    const bottomHeight = getSponsorImages("bottom").length > 0 ? rowHeight : 0;
    const inset = 12;

    return {
        x: frame.x + inset,
        y: frame.y + inset + topHeight,
        width: Math.max(1, frame.width - inset * 2),
        height: Math.max(1, frame.height - inset * 2 - topHeight - bottomHeight),
    };
}

function getCachedImage(url: string) {
    if (!url) {
        return null;
    }
    if (imageCache.has(url)) {
        return imageCache.get(url) || null;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    imageCache.set(url, image);
    return image;
}

function getCountryFlagURL(country: unknown) {
    const countryCode = resolveCountryCode(country);
    if (!countryCode) {
        return "";
    }

    const pathname = window.location.pathname;
    if (pathname.startsWith("/scoreboard/")) {
        return `/scoreboard/flags/${countryCode}.png`;
    }
    if (pathname.startsWith("/brackets/") || pathname.startsWith("/groups/")) {
        return `/brackets/flags/${countryCode}.png`;
    }
    return `flags/${countryCode}.png`;
}

function drawPlayerIdentity(player: SeedTeam | RoundRobinPlayer, x: number, centerY: number) {
    const identityStyles = getStyleSection("playerIdentityStyles");
    const gap = Math.max(0, asNumber(identityStyles.gap, 8));
    let nextX = x;

    if (identityStyles.showPlayerImage === true && player?.imageURL) {
        const imageSize = Math.max(10, asNumber(identityStyles.imageSize, 28));
        const image = getCachedImage(player.imageURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(nextX + imageSize / 2, centerY, imageSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = "rgba(148,163,184,0.25)";
        ctx.fillRect(nextX, centerY - imageSize / 2, imageSize, imageSize);
        if (image) {
            drawImageInRect(image, {
                x: nextX,
                y: centerY - imageSize / 2,
                width: imageSize,
                height: imageSize,
            }, "cover");
        }
        ctx.restore();
        nextX += imageSize + gap;
    }

    if (identityStyles.showCountryFlag === true) {
        const flagURL = getCountryFlagURL(player?.country);
        if (flagURL) {
            const flagWidth = Math.max(10, asNumber(identityStyles.flagWidth, 26));
            const flagHeight = Math.max(8, asNumber(identityStyles.flagHeight, 18));
            const image = getCachedImage(flagURL);
            ctx.fillStyle = "rgba(148,163,184,0.18)";
            ctx.fillRect(nextX, centerY - flagHeight / 2, flagWidth, flagHeight);
            if (image) {
                drawImageInRect(image, {
                    x: nextX,
                    y: centerY - flagHeight / 2,
                    width: flagWidth,
                    height: flagHeight,
                }, "cover");
            }
            nextX += flagWidth + gap;
        }
    }

    return nextX;
}

function createGradient(rect: Rect, startColor: string, endColor: string, angle: number) {
    const radians = angle * Math.PI / 180;
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    const distance = Math.abs(rect.width * Math.cos(radians)) + Math.abs(rect.height * Math.sin(radians));
    const offsetX = Math.cos(radians) * distance / 2;
    const offsetY = Math.sin(radians) * distance / 2;
    const gradient = ctx.createLinearGradient(
        centerX - offsetX,
        centerY - offsetY,
        centerX + offsetX,
        centerY + offsetY,
    );
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
}

function getSurfaceFill(styles: Record<string, string | number>, rect: Rect) {
    if (styles.backgroundType === "gradient") {
        return createGradient(
            rect,
            String(styles.gradientStartColor || styles.backgroundColor || "#050816"),
            String(styles.gradientEndColor || styles.backgroundColor || "#172554"),
            asNumber(styles.gradientAngle, 135),
        );
    }
    return String(styles.backgroundColor || "#050816");
}

function drawImageInRect(image: HTMLImageElement, rect: Rect, fit = "contain") {
    if (!image.complete || !image.naturalWidth || !image.naturalHeight) {
        return;
    }

    if (fit === "stretch") {
        ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
        return;
    }

    const scale = fit === "cover"
        ? Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight)
        : Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.drawImage(
        image,
        rect.x + (rect.width - width) / 2,
        rect.y + (rect.height - height) / 2,
        width,
        height,
    );
}

function setStatus(message: string) {
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function clearStatus() {
    if (statusElement) {
        statusElement.textContent = "";
    }
}

function mergeStyle(style: unknown): DisplayStyleRecord {
    if (!style || typeof style !== "object") {
        return defaultStyles;
    }

    return {
        ...defaultStyles,
        ...(style as DisplayStyleRecord),
    };
}

function getCompetitionTitle() {
    return competition?.data?.title || competition?.title || "Competition";
}

function resizeCanvas() {
    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 720;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setFitCamera();
}

function fitCameraToRect(rect: Rect, padding = 80): Camera {
    const viewport = getCameraViewportRect();
    const scaleX = (viewport.width - padding * 2) / Math.max(1, rect.width);
    const scaleY = (viewport.height - padding * 2) / Math.max(1, rect.height);
    const zoom = Math.max(0.12, Math.min(scaleX, scaleY, 3.2));

    return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        zoom,
    };
}

function setFitCamera() {
    const next = fitCameraToRect(worldBounds);
    camera = { ...next };
    targetCamera = { ...next };
}

function updateTargetCamera(now: number) {
    if (cameraMode === "fit" || cameraTargets.length === 0) {
        targetCamera = fitCameraToRect(worldBounds);
        return;
    }

    if (cameraMode !== "auto") {
        return;
    }

    if (now - lastInteraction < 8000) {
        return;
    }

    if (now - lastTargetChange > 6500) {
        activeTargetIndex = (activeTargetIndex + 1) % cameraTargets.length;
        lastTargetChange = now;
    }

    targetCamera = fitCameraToRect(cameraTargets[activeTargetIndex], 70);
}

function smoothCamera() {
    const ease = cameraMode === "free" ? 1 : 0.075;
    camera.x += (targetCamera.x - camera.x) * ease;
    camera.y += (targetCamera.y - camera.y) * ease;
    camera.zoom += (targetCamera.zoom - camera.zoom) * ease;
}

function applyCameraTransform() {
    const viewport = getCameraViewportRect();
    ctx.translate(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
}

function fillRoundedRect(rect: Rect, radius: number) {
    const r = Math.min(radius, rect.width / 2, rect.height / 2);
    ctx.beginPath();
    ctx.moveTo(rect.x + r, rect.y);
    ctx.arcTo(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height, r);
    ctx.arcTo(rect.x + rect.width, rect.y + rect.height, rect.x, rect.y + rect.height, r);
    ctx.arcTo(rect.x, rect.y + rect.height, rect.x, rect.y, r);
    ctx.arcTo(rect.x, rect.y, rect.x + rect.width, rect.y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function clipRoundedRect(rect: Rect, radius: number) {
    const r = Math.min(Math.max(0, radius), rect.width / 2, rect.height / 2);
    ctx.beginPath();
    ctx.moveTo(rect.x + r, rect.y);
    ctx.arcTo(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height, r);
    ctx.arcTo(rect.x + rect.width, rect.y + rect.height, rect.x, rect.y + rect.height, r);
    ctx.arcTo(rect.x, rect.y + rect.height, rect.x, rect.y, r);
    ctx.arcTo(rect.x, rect.y, rect.x + rect.width, rect.y, r);
    ctx.closePath();
    ctx.clip();
}

function applyCanvasLineStyle(lineStyles: Record<string, string | number>) {
    const width = Math.max(1, asNumber(lineStyles.width, 2));
    const borderStyle = String(lineStyles.borderStyle || "solid");

    ctx.strokeStyle = String(lineStyles.color || "#38BDF8");
    ctx.lineWidth = width;
    ctx.setLineDash(
        borderStyle === "dashed"
            ? [width * 5, width * 3]
            : borderStyle === "dotted"
                ? [width, width * 2.5]
                : [],
    );
}

function drawText(text: string, x: number, y: number, options: {
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    color?: string;
    fontFamily?: string;
    fontSize?: number;
    maxWidth?: number;
    weight?: string;
} = {}) {
    const {
        align = "left",
        baseline = "middle",
        color = "#FFFFFF",
        fontFamily = "Inter",
        fontSize = 18,
        maxWidth,
        weight = "700",
    } = options;

    ctx.fillStyle = color;
    ctx.font = `${weight} ${fontSize}px "${fontFamily}", Arial, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text || "", x, y, maxWidth);
}

function clearCanvas() {
    const boardStyles = getStyleSection("boardStyles");
    const frame = getFrameRect();
    const layoutStyles = getStyleSection("layoutStyles");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.save();
    ctx.fillStyle = getSurfaceFill(boardStyles, frame);
    ctx.strokeStyle = "transparent";
    ctx.lineWidth = 0;
    fillRoundedRect(frame, getFrameRadius());
    ctx.clip();

    if (boardStyles.backgroundType === "image" && boardStyles.backgroundImageURL) {
        const backgroundImage = getCachedImage(String(boardStyles.backgroundImageURL));
        if (backgroundImage) {
            drawImageInRect(backgroundImage, frame, String(boardStyles.backgroundImageFit || "cover"));
        }
    }
    ctx.restore();
}

function getBracketRounds() {
    const rounds = competition?.data?.brackets;
    return Array.isArray(rounds) ? rounds : [];
}

function getSeedCenter(roundIndex: number, seedIndex: number, layout: {
    matchHeight: number;
    roundGap: number;
    seedGap: number;
    seedWidth: number;
    startX: number;
    startY: number;
}) {
    const firstRoundStep = layout.matchHeight + layout.seedGap;
    const step = firstRoundStep * Math.pow(2, roundIndex);
    const y = layout.startY + step / 2 - firstRoundStep / 2 + seedIndex * step + layout.matchHeight / 2;
    const x = layout.startX + roundIndex * (layout.seedWidth + layout.roundGap) + layout.seedWidth / 2;
    return { x, y };
}

function drawBracketMatch(seed: BracketSeed, rect: Rect) {
    const matchStyles = getStyleSection("bracketStyles");
    const lineStyles = getStyleSection("bracketLineStyles");
    const fontSize = asNumber(matchStyles.fontSize, 16);
    const borderRadius = Math.max(0, asNumber(matchStyles.borderRadius, 12));
    const teams = seed.teams || [];
    const rowHeight = rect.height / 2;
    const scoreWidth = 46;

    ctx.fillStyle = getSurfaceFill(matchStyles, rect);
    applyCanvasLineStyle(lineStyles);
    fillRoundedRect(rect, borderRadius);

    ctx.setLineDash([]);
    ctx.strokeStyle = String(matchStyles.dividerColor || "#263247");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rect.x + 12, rect.y + rowHeight);
    ctx.lineTo(rect.x + rect.width - 12, rect.y + rowHeight);
    ctx.stroke();

    teams.slice(0, 2).forEach((team, teamIndex) => {
        const rowY = rect.y + rowHeight * teamIndex;
        const isWinner = seed.isComplete && seed.winnerTeamIndex === teamIndex;
        const score = teamIndex === 0 ? seed.AScore : seed.BScore;

        if (isWinner) {
            ctx.fillStyle = String(matchStyles.winnerBackgroundColor || "#123B55");
            ctx.fillRect(rect.x + 1, rowY + 1, rect.width - 2, rowHeight - 2);
        }

        const textX = drawPlayerIdentity(team || {}, rect.x + 16, rowY + rowHeight / 2);
        drawText(team?.name || "TBD", textX, rowY + rowHeight / 2, {
            color: String(matchStyles.color || "#FFFFFF"),
            fontFamily: String(matchStyles.fontFamily || "Inter"),
            fontSize,
            maxWidth: rect.x + rect.width - scoreWidth - 12 - textX,
            weight: isWinner ? "900" : String(matchStyles.fontWeight || "700"),
        });
        drawText(`${score ?? ""}`, rect.x + rect.width - 18, rowY + rowHeight / 2, {
            align: "right",
            color: String(matchStyles.scoreColor || matchStyles.color || "#FFFFFF"),
            fontFamily: String(matchStyles.fontFamily || "Inter"),
            fontSize,
            weight: isWinner ? "900" : "700",
        });
    });
}

function calculateBracketLayout(rounds: BracketRound[]) {
    const largestSeedCount = Math.max(1, rounds[0]?.seeds?.length || 1);
    const layout = {
        matchHeight: 88,
        roundGap: 130,
        seedGap: 42,
        seedWidth: 280,
        startX: 90,
        startY: 150,
    };
    const worldWidth = layout.startX * 2 + rounds.length * layout.seedWidth + Math.max(0, rounds.length - 1) * layout.roundGap;
    const worldHeight = layout.startY + largestSeedCount * layout.matchHeight + Math.max(0, largestSeedCount - 1) * layout.seedGap + 100;

    return {
        ...layout,
        world: {
            x: 0,
            y: 0,
            width: Math.max(1200, worldWidth),
            height: Math.max(720, worldHeight),
        },
    };
}

function getBracketMatchRect(roundIndex: number, seedIndex: number, layout: ReturnType<typeof calculateBracketLayout>): Rect {
    const center = getSeedCenter(roundIndex, seedIndex, layout);
    return {
        x: center.x - layout.seedWidth / 2,
        y: center.y - layout.matchHeight / 2,
        width: layout.seedWidth,
        height: layout.matchHeight,
    };
}

function buildBracketCameraTargets(rounds: BracketRound[], layout: ReturnType<typeof calculateBracketLayout>): Rect[] {
    const viewHeight = Math.max(1, canvas.height / dpr);
    const maxTargetHeight = Math.max(460, Math.min(760, viewHeight * 0.85));
    const horizontalPadding = 70;
    const verticalPadding = 60;
    const targets: Rect[] = [];

    rounds.forEach((round, roundIndex) => {
        const matchRects = (round.seeds || []).map((_, seedIndex) => {
            return getBracketMatchRect(roundIndex, seedIndex, layout);
        });

        if (matchRects.length === 0) {
            return;
        }

        let chunkStart = 0;
        while (chunkStart < matchRects.length) {
            let chunkEnd = chunkStart;

            while (chunkEnd + 1 < matchRects.length) {
                const candidateHeight =
                    matchRects[chunkEnd + 1].y + matchRects[chunkEnd + 1].height -
                    matchRects[chunkStart].y +
                    verticalPadding * 2;

                if (candidateHeight > maxTargetHeight) {
                    break;
                }

                chunkEnd += 1;
            }

            const firstRect = matchRects[chunkStart];
            const lastRect = matchRects[chunkEnd];
            targets.push({
                x: firstRect.x - horizontalPadding,
                y: firstRect.y - verticalPadding,
                width: firstRect.width + horizontalPadding * 2,
                height: lastRect.y + lastRect.height - firstRect.y + verticalPadding * 2,
            });
            chunkStart = chunkEnd + 1;
        }
    });

    return targets.length > 0 ? targets : [layout.world];
}

function drawBracket() {
    const rounds = getBracketRounds();
    if (rounds.length === 0) {
        drawEmptyState("No bracket rounds have been created yet.");
        return;
    }

    const titleStyles = getStyleSection("titleStyles");
    const roundNameStyles = getStyleSection("roundNameStyles");
    const lineStyles = getStyleSection("bracketLineStyles");
    const layout = calculateBracketLayout(rounds);
    worldBounds = layout.world;
    cameraTargets = buildBracketCameraTargets(rounds, layout);
    activeTargetIndex = Math.min(activeTargetIndex, cameraTargets.length - 1);

    drawText(getCompetitionTitle(), layout.world.width / 2, 58, {
        align: "center",
        color: String(titleStyles.color || "#FFFFFF"),
        fontFamily: String(titleStyles.fontFamily || "Inter"),
        fontSize: asNumber(titleStyles.fontSize, 36),
        weight: String(titleStyles.fontWeight || "900"),
    });

    rounds.forEach((round, roundIndex) => {
        const roundX = layout.startX + roundIndex * (layout.seedWidth + layout.roundGap);
        drawText(round.title || `Round ${roundIndex + 1}`, roundX + layout.seedWidth / 2, 116, {
            align: "center",
            color: String(roundNameStyles.color || "#93C5FD"),
            fontFamily: String(roundNameStyles.fontFamily || "Inter"),
            fontSize: asNumber(roundNameStyles.fontSize, 18),
            weight: String(roundNameStyles.fontWeight || "900"),
        });

        (round.seeds || []).forEach((seed, seedIndex) => {
            const center = getSeedCenter(roundIndex, seedIndex, layout);
            const rect = getBracketMatchRect(roundIndex, seedIndex, layout);

            drawBracketMatch(seed, rect);

            const nextRound = rounds[roundIndex + 1];
            if (!nextRound) {
                return;
            }

            const nextCenter = getSeedCenter(roundIndex + 1, Math.floor(seedIndex / 2), layout);
            const sideX = rect.x + rect.width;
            const joinX = sideX + layout.roundGap / 2;
            applyCanvasLineStyle(lineStyles);
            ctx.beginPath();
            ctx.moveTo(sideX, center.y);
            ctx.lineTo(joinX, center.y);
            ctx.lineTo(joinX, nextCenter.y);
            ctx.lineTo(nextCenter.x - layout.seedWidth / 2, nextCenter.y);
            ctx.stroke();
            ctx.setLineDash([]);
        });
    });
}

function getVisibleGroups() {
    return Object.values(competition?.groups || {}).filter((group) => group?.showOnBoard !== false);
}

function getVisibleGroupPlayers(group: RoundRobinGroup) {
    return Object.values(group.players || {})
        .filter((player) => player?.showInGroup !== false)
        .sort((a, b) => (b.wins || 0) - (a.wins || 0) || (a.seedPosition || 0) - (b.seedPosition || 0));
}

function getGroupCardHeight(group: RoundRobinGroup) {
    const headerHeight = 56;
    const rowHeight = 42;
    const bottomPadding = 24;
    const visibleRowCount = Math.max(getVisibleGroupPlayers(group).length, 1);

    return Math.max(190, headerHeight + visibleRowCount * rowHeight + bottomPadding);
}

function drawGroupCard(group: RoundRobinGroup, rect: Rect) {
    const headerStyles = getStyleSection("groupHeaderStyles");
    const playerStyles = getStyleSection("groupPlayerStyles");
    const lineStyles = getStyleSection("bracketLineStyles");
    const headerHeight = 56;
    const rowHeight = 42;
    const players = getVisibleGroupPlayers(group);

    ctx.fillStyle = getSurfaceFill(playerStyles, rect);
    applyCanvasLineStyle(lineStyles);
    fillRoundedRect(rect, 16);
    ctx.setLineDash([]);

    ctx.fillStyle = getSurfaceFill(headerStyles, {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: headerHeight,
    });
    ctx.beginPath();
    ctx.roundRect?.(rect.x, rect.y, rect.width, headerHeight, [16, 16, 0, 0]);
    if (!ctx.roundRect) {
        ctx.fillRect(rect.x, rect.y, rect.width, headerHeight);
    }
    ctx.fill();

    drawText(group.groupName || "Group", rect.x + 18, rect.y + headerHeight / 2, {
        color: String(headerStyles.color || "#FFFFFF"),
        fontFamily: String(headerStyles.fontFamily || "Inter"),
        fontSize: asNumber(headerStyles.fontSize, 18),
        weight: String(headerStyles.fontWeight || "900"),
    });
    drawText("W-L", rect.x + rect.width - 20, rect.y + headerHeight / 2, {
        align: "right",
        color: String(headerStyles.color || "#FFFFFF"),
        fontFamily: String(headerStyles.fontFamily || "Inter"),
        fontSize: 16,
        weight: "900",
    });

    if (players.length === 0) {
        const rowY = rect.y + headerHeight;
        ctx.fillStyle = "rgba(2, 6, 23, 0.04)";
        ctx.fillRect(rect.x + 1, rowY, rect.width - 2, rowHeight);
        drawText("No players assigned", rect.x + 18, rowY + rowHeight / 2, {
            color: String(playerStyles.color || "#111827"),
            fontFamily: String(playerStyles.fontFamily || "Inter"),
            fontSize: asNumber(playerStyles.fontSize, 16),
            maxWidth: rect.width - 36,
            weight: String(playerStyles.fontWeight || "800"),
        });
    }

    players.forEach((player, index) => {
        const rowY = rect.y + headerHeight + index * rowHeight;
        if (playerStyles.backgroundType === "gradient") {
            ctx.fillStyle = getSurfaceFill(playerStyles, {
                x: rect.x,
                y: rowY,
                width: rect.width,
                height: rowHeight,
            });
        } else {
            ctx.fillStyle = index % 2 === 0
                ? String(playerStyles.backgroundColor || "#FFFFFF")
                : String(playerStyles.alternateBackgroundColor || "#E8EEF6");
        }
        ctx.fillRect(rect.x + 1, rowY, rect.width - 2, rowHeight);

        const textX = drawPlayerIdentity(player, rect.x + 18, rowY + rowHeight / 2);
        drawText(player.playerName || "TBD", textX, rowY + rowHeight / 2, {
            color: String(playerStyles.color || "#111827"),
            fontFamily: String(playerStyles.fontFamily || "Inter"),
            fontSize: asNumber(playerStyles.fontSize, 16),
            maxWidth: rect.x + rect.width - 92 - textX,
            weight: String(playerStyles.fontWeight || "800"),
        });
        drawText(`${player.wins || 0}-${player.losses || 0}`, rect.x + rect.width - 20, rowY + rowHeight / 2, {
            align: "right",
            color: String(playerStyles.color || "#111827"),
            fontFamily: String(playerStyles.fontFamily || "Inter"),
            fontSize: 15,
            weight: "900",
        });
    });
}

function drawRoundRobin() {
    const groups = getVisibleGroups();
    if (groups.length === 0) {
        drawEmptyState("No visible groups have been created yet.");
        return;
    }

    const titleStyles = getStyleSection("titleStyles");
    const footerStyles = getStyleSection("footerStyles");
    const cardWidth = 420;
    const cardHeight = Math.max(220, ...groups.map(getGroupCardHeight));
    const gap = 44;
    const columns = Math.max(1, Math.min(3, Math.ceil(Math.sqrt(groups.length || 1))));
    const rows = Math.max(1, Math.ceil((groups.length || 1) / columns));
    const worldWidth = 120 + columns * cardWidth + (columns - 1) * gap + 120;
    const worldHeight = 150 + rows * cardHeight + (rows - 1) * gap + 120;
    worldBounds = { x: 0, y: 0, width: Math.max(1200, worldWidth), height: Math.max(720, worldHeight) };
    cameraTargets = [worldBounds];

    drawText(getCompetitionTitle(), worldBounds.width / 2, 58, {
        align: "center",
        color: String(titleStyles.color || "#FFFFFF"),
        fontFamily: String(titleStyles.fontFamily || "Inter"),
        fontSize: asNumber(titleStyles.fontSize, 36),
        weight: String(titleStyles.fontWeight || "900"),
    });

    groups.forEach((group, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const rect = {
            x: 120 + column * (cardWidth + gap),
            y: 130 + row * (cardHeight + gap),
            width: cardWidth,
            height: cardHeight,
        };
        cameraTargets.push(rect);
        drawGroupCard(group, rect);
    });

    if (competition?.data?.footer) {
        drawText(competition.data.footer, worldBounds.width / 2, worldBounds.height - 50, {
            align: "center",
            color: String(footerStyles.color || "#CBD5E1"),
            fontFamily: String(footerStyles.fontFamily || "Inter"),
            fontSize: asNumber(footerStyles.fontSize, 16),
            weight: String(footerStyles.fontWeight || "700"),
        });
    }
}

function drawEmptyState(message: string) {
    const boardStyles = getStyleSection("boardStyles");
    worldBounds = { x: 0, y: 0, width: 1200, height: 720 };
    cameraTargets = [worldBounds];
    drawText(message, worldBounds.width / 2, worldBounds.height / 2, {
        align: "center",
        color: String(boardStyles.color || "#FFFFFF"),
        fontSize: 30,
        weight: "900",
    });
}

function drawSponsorRow(position: "top" | "bottom") {
    const images = getSponsorImages(position);
    if (images.length === 0) {
        return;
    }

    const frame = getFrameRect();
    const sponsorStyles = getStyleSection("sponsorStyles");
    const rowHeight = Math.max(36, asNumber(sponsorStyles.rowHeight, 72));
    const rowRect = {
        x: frame.x + 12,
        y: position === "top" ? frame.y + 12 : frame.y + frame.height - rowHeight - 12,
        width: Math.max(1, frame.width - 24),
        height: rowHeight,
    };
    const gap = 12;
    const slotWidth = Math.max(1, (rowRect.width - gap * Math.max(0, images.length - 1)) / images.length);

    ctx.save();
    ctx.fillStyle = String(sponsorStyles.backgroundColor || "#00000000");
    ctx.fillRect(rowRect.x, rowRect.y, rowRect.width, rowRect.height);
    images.forEach((imageRecord, index) => {
        const image = getCachedImage(String(imageRecord.url || ""));
        if (!image) {
            return;
        }
        drawImageInRect(image, {
            x: rowRect.x + index * (slotWidth + gap),
            y: rowRect.y,
            width: slotWidth,
            height: rowRect.height,
        }, String(sponsorStyles.imageFit || "contain"));
    });
    ctx.restore();
}

function drawFrameChrome() {
    const frame = getFrameRect();
    const layoutStyles = getStyleSection("layoutStyles");
    const borderWidth = layoutStyles.displayPurpose === "overlay"
        ? Math.max(0, asNumber(layoutStyles.borderWidth, 3))
        : 0;

    if (borderWidth <= 0) {
        return;
    }

    ctx.save();
    ctx.fillStyle = "transparent";
    ctx.strokeStyle = String(layoutStyles.borderColor || "#38BDF8");
    ctx.lineWidth = borderWidth;
    ctx.setLineDash([]);
    fillRoundedRect(frame, getFrameRadius());
    ctx.restore();
}

function draw() {
    clearCanvas();

    ctx.save();
    const frame = getFrameRect();
    const layoutStyles = getStyleSection("layoutStyles");
    clipRoundedRect(frame, getFrameRadius());
    applyCameraTransform();

    if (!competition) {
        drawEmptyState("Add competitionID to display a bracket or group.");
    } else if (competition.showBoard === false) {
        drawEmptyState("This competition display is hidden.");
    } else if (displayMode === "roundRobin" || (!displayMode && competition.type === "roundRobin")) {
        drawRoundRobin();
    } else {
        drawBracket();
    }

    ctx.restore();
    drawSponsorRow("top");
    drawSponsorRow("bottom");
    drawFrameChrome();
}

function tick(now: number) {
    updateTargetCamera(now);
    smoothCamera();
    draw();
    window.requestAnimationFrame(tick);
}

function screenToWorld(x: number, y: number) {
    const viewport = getCameraViewportRect();
    return {
        x: (x - (viewport.x + viewport.width / 2)) / camera.zoom + camera.x,
        y: (y - (viewport.y + viewport.height / 2)) / camera.zoom + camera.y,
    };
}

function setFreeMode() {
    cameraMode = "free";
    targetCamera = { ...camera };
    lastInteraction = performance.now();
}

function setupPointerControls() {
    canvas.addEventListener("wheel", (event) => {
        event.preventDefault();
        setFreeMode();
        const before = screenToWorld(event.clientX, event.clientY);
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        camera.zoom = Math.max(0.12, Math.min(4, camera.zoom * zoomFactor));
        const after = screenToWorld(event.clientX, event.clientY);
        camera.x += before.x - after.x;
        camera.y += before.y - after.y;
        targetCamera = { ...camera };
    }, { passive: false });

    canvas.addEventListener("pointerdown", (event) => {
        canvas.setPointerCapture(event.pointerId);
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        setFreeMode();

        if (activePointers.size === 1) {
            dragState = { pointerID: event.pointerId, x: event.clientX, y: event.clientY };
        } else if (activePointers.size === 2) {
            const points = [...activePointers.values()];
            pinchState = {
                distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
                zoom: camera.zoom,
            };
        }
    });

    canvas.addEventListener("pointermove", (event) => {
        if (!activePointers.has(event.pointerId)) {
            return;
        }

        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        setFreeMode();

        if (activePointers.size === 2 && pinchState) {
            const points = [...activePointers.values()];
            const nextDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
            camera.zoom = Math.max(0.12, Math.min(4, pinchState.zoom * (nextDistance / Math.max(1, pinchState.distance))));
            targetCamera = { ...camera };
            return;
        }

        if (!dragState || dragState.pointerID !== event.pointerId) {
            return;
        }

        camera.x -= (event.clientX - dragState.x) / camera.zoom;
        camera.y -= (event.clientY - dragState.y) / camera.zoom;
        dragState = { ...dragState, x: event.clientX, y: event.clientY };
        targetCamera = { ...camera };
    });

    function clearPointer(event: PointerEvent) {
        activePointers.delete(event.pointerId);
        if (dragState?.pointerID === event.pointerId) {
            dragState = null;
        }
        if (activePointers.size < 2) {
            pinchState = null;
        }
    }

    canvas.addEventListener("pointerup", clearPointer);
    canvas.addEventListener("pointercancel", clearPointer);
}

function setupControls() {
    const controls = document.getElementById("bracket-controls");
    const showControls = params.get("controls") === "true" || params.get("controls") === "1";
    if (controls) {
        controls.style.display = showControls ? "flex" : "none";
    }

    document.getElementById("fit-camera")?.addEventListener("click", () => {
        cameraMode = "fit";
        setFitCamera();
    });

    document.getElementById("auto-camera")?.addEventListener("click", () => {
        cameraMode = "auto";
        lastInteraction = 0;
        lastTargetChange = 0;
    });
}

function applyBaseStyles() {
    const style = document.createElement("style");
    style.innerHTML = `
        html,
        body {
            background: transparent;
            height: 100%;
            margin: 0;
            overflow: hidden;
            touch-action: none;
            width: 100%;
        }

        #bracket-canvas {
            display: block;
            height: 100vh;
            touch-action: none;
            width: 100vw;
        }

        #bracket-status {
            color: #ffffff;
            font: 700 16px Inter, Arial, sans-serif;
            left: 16px;
            position: fixed;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
            top: 16px;
        }

        #bracket-controls {
            bottom: 16px;
            display: none;
            gap: 8px;
            position: fixed;
            right: 16px;
        }

        #bracket-controls button {
            background: linear-gradient(135deg, #020617, #1d4ed8);
            border: 1px solid rgba(147, 197, 253, 0.7);
            border-radius: 8px;
            color: #ffffff;
            cursor: pointer;
            font: 800 13px Inter, Arial, sans-serif;
            padding: 9px 14px;
        }
    `;
    document.head.appendChild(style);
}

function subscribeToValue(db: DatabaseLike, path: string, callback: (value: unknown) => void) {
    const ref = db.ref(path);
    ref.on("value", (snapshot) => callback(snapshot.val()));
    return () => ref.off?.("value");
}

export function startBracketGroupDisplay(db: DatabaseLike) {
    canvas = document.getElementById("bracket-canvas") as HTMLCanvasElement;
    statusElement = document.getElementById("bracket-status");

    if (!canvas) {
        return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
        setStatus("Canvas is not supported in this browser.");
        return;
    }

    ctx = context;
    applyBaseStyles();
    setupPointerControls();
    setupControls();
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const dynamicDisplayID = readID("dynid", "dynamicID", "dynamicBracketGroupID", "dbgid");
    const competitionID = readID("competitionID", "cid");
    const styleID = readID("styleID", "sid");
    let unsubscribeCompetition = () => {};
    let unsubscribeStyle = () => {};

    function useCompetition(nextCompetitionID = "") {
        unsubscribeCompetition();
        competition = null;

        if (!nextCompetitionID) {
            setStatus(dynamicDisplayID ? "Dynamic display does not have a competition selected." : "Missing competitionID.");
            return;
        }

        unsubscribeCompetition = subscribeToValue(db, `competitions/${nextCompetitionID}`, (value) => {
            competition = (value || null) as CompetitionRecord | null;
            if (!competition) {
                setStatus("Competition not found.");
            } else {
                clearStatus();
            }
            activeTargetIndex = 0;
            lastTargetChange = 0;
        });
    }

    function useStyle(nextStyleID = "") {
        unsubscribeStyle();

        if (!nextStyleID) {
            displayStyle = defaultStyles;
            return;
        }

        unsubscribeStyle = subscribeToValue(db, `bracketGroupStyles/${nextStyleID}`, (value) => {
            displayStyle = mergeStyle(value);
        });
    }

    if (dynamicDisplayID) {
        subscribeToValue(db, `dynamicBracketGroups/${dynamicDisplayID}`, (value) => {
            const dynamicDisplay = (value || null) as DynamicBracketGroupDisplayRecord | null;

            if (!dynamicDisplay) {
                competition = null;
                displayStyle = defaultStyles;
                setStatus("Dynamic bracket/group display not found.");
                return;
            }

            displayMode = dynamicDisplay.displayType === "roundRobin" ? "roundRobin" : "singleElimination";
            cameraMode = normalizeCameraMode(dynamicDisplay.cameraMode || "auto");
            activeTargetIndex = 0;
            lastTargetChange = 0;
            useCompetition(dynamicDisplay.competitionID || "");
            useStyle(dynamicDisplay.styleID || "");
        });
    } else {
        useCompetition(competitionID);
        useStyle(styleID);
    }

    window.requestAnimationFrame(tick);
}
