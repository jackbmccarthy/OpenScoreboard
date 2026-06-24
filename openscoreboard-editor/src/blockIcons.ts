type BlockIcon = {
    badge?: string;
    name: IconName;
    tone: string;
};

type IconName =
    "aspect"
    | "card"
    | "canvas"
    | "columns"
    | "flag"
    | "grid"
    | "image"
    | "jersey"
    | "letter"
    | "match"
    | "number"
    | "player"
    | "rows"
    | "score"
    | "serve"
    | "target"
    | "text"
    | "timer";

const ICON_PATHS: Record<IconName, string> = {
    aspect: `
        <rect x="3" y="5" width="18" height="12" rx="2"></rect>
        <path d="M7 21h10"></path>
        <path d="M12 17v4"></path>
        <path d="M7 9h5"></path>
        <path d="M7 13h10"></path>
    `,
    card: `
        <rect x="7" y="3" width="10" height="18" rx="2"></rect>
        <path d="M9 7h6"></path>
        <path d="M9 17h6"></path>
    `,
    canvas: `
        <rect x="4" y="5" width="16" height="14" rx="2"></rect>
        <path d="M8 9h8"></path>
        <path d="M8 13h5"></path>
        <path d="M4 3v3"></path>
        <path d="M20 3v3"></path>
        <path d="M4 18v3"></path>
        <path d="M20 18v3"></path>
    `,
    columns: `
        <rect x="5" y="3" width="14" height="18" rx="2"></rect>
        <path d="M5 10h14"></path>
        <path d="M5 15h14"></path>
    `,
    flag: `
        <path d="M6 21V4"></path>
        <path d="M7 4h11l-2 4 2 4H7"></path>
    `,
    grid: `
        <rect x="4" y="5" width="16" height="14" rx="2"></rect>
        <path d="M4 10h16"></path>
        <path d="M4 14h16"></path>
        <path d="M10 5v14"></path>
        <path d="M15 5v14"></path>
    `,
    image: `
        <rect x="4" y="5" width="16" height="14" rx="2"></rect>
        <circle cx="9" cy="10" r="1.5"></circle>
        <path d="m5 17 4.5-4.5 3 3 2-2L19 18"></path>
    `,
    jersey: `
        <path d="m8 4-4 3 2 4 2-1v10h8V10l2 1 2-4-4-3-2 2h-4z"></path>
        <path d="M10 6h4"></path>
    `,
    letter: `
        <text x="12" y="16.8" fill="currentColor" stroke="none" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="800" text-anchor="middle">A</text>
        <path d="M6 20h12"></path>
    `,
    match: `
        <path d="M8 4h8v3a4 4 0 0 1-8 0z"></path>
        <path d="M9 15h6"></path>
        <path d="M12 11v4"></path>
        <path d="M6 5H4v2a4 4 0 0 0 4 4"></path>
        <path d="M18 5h2v2a4 4 0 0 1-4 4"></path>
        <path d="M8 20h8"></path>
    `,
    number: `
        <text x="12" y="16.6" fill="currentColor" stroke="none" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="900" text-anchor="middle">#</text>
        <path d="M5 20h14"></path>
    `,
    player: `
        <circle cx="12" cy="8" r="4"></circle>
        <path d="M5 20a7 7 0 0 1 14 0"></path>
    `,
    rows: `
        <rect x="3" y="6" width="18" height="12" rx="2"></rect>
        <path d="M9 6v12"></path>
        <path d="M15 6v12"></path>
    `,
    score: `
        <path d="M5 5h14v14H5z"></path>
        <path d="M9 5v14"></path>
        <path d="M15 5v14"></path>
        <path d="M5 12h14"></path>
    `,
    serve: `
        <circle cx="17" cy="6" r="2"></circle>
        <path d="M5 19c4-8 8-11 12-13"></path>
        <path d="M7 15h8"></path>
        <path d="m12 12 4 7"></path>
    `,
    target: `
        <circle cx="12" cy="12" r="8"></circle>
        <circle cx="12" cy="12" r="4"></circle>
        <circle cx="12" cy="12" r="1"></circle>
    `,
    text: `
        <path d="M5 6h14"></path>
        <path d="M8 6v12"></path>
        <path d="M16 6v12"></path>
        <path d="M9 18h6"></path>
    `,
    timer: `
        <circle cx="12" cy="13" r="7"></circle>
        <path d="M9 2h6"></path>
        <path d="M12 6V3"></path>
        <path d="M12 13l3-3"></path>
    `,
};

function cleanText(value: unknown) {
    return String(value || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getCategoryName(category: unknown) {
    if (!category) {
        return "";
    }

    if (typeof category === "string") {
        return category;
    }

    if (typeof category === "object" && "get" in category && typeof category.get === "function") {
        return cleanText(category.get("label") || category.get("id"));
    }

    return cleanText(category);
}

function getSideBadge(text: string, id: string) {
    const source = `${text} ${id}`;
    const side = source.match(/\b([AB])\b|player([AB])|team([AB])|imageURL([AB])|country([AB])|LogoURL([AB])|is([AB])/i);
    return side?.slice(1).find(Boolean)?.toUpperCase();
}

function getGameBadge(text: string, id: string) {
    const source = `${text} ${id}`;
    const game = source.match(/\bG(?:ame\s*)?(\d+)\b|game(\d+)/i);
    const value = game?.slice(1).find(Boolean);
    return value ? `G${value}` : undefined;
}

function isConditionalViewBlock(id: string, label: string, category: string) {
    const source = `${id} ${label} ${category}`.toLowerCase();

    return /\bis[A-Z]/.test(id)
        || source.includes("currently serving")
        || source.includes("game point")
        || source.includes("match point")
        || source.includes("time out active")
        || source.includes("time out used")
        || source.includes("show game score container")
        || category.toLowerCase().includes("graphic");
}

function isNumericDataBlock(searchText: string) {
    return searchText.includes("score")
        || searchText.includes("rating")
        || searchText.includes("ranking")
        || searchText.includes("timer")
        || searchText.includes("duration")
        || searchText.includes("countdown")
        || /\bg\d+\b/.test(searchText);
}

function isTextDataBlock(searchText: string) {
    return searchText.includes("name")
        || searchText.includes("player")
        || searchText.includes("team")
        || searchText.includes("round")
        || searchText.includes("text");
}

function inferBlockIcon(id: string, label: string, category: string): BlockIcon {
    const searchText = `${id} ${label} ${category}`.toLowerCase();
    const badge = getSideBadge(label, id) || getGameBadge(label, id);

    if (searchText.includes("row container")) {
        return { badge, name: "canvas", tone: "layout" };
    }

    if (searchText.includes("column container")) {
        return { badge, name: "canvas", tone: "layout" };
    }

    if (searchText.includes("court side") && searchText.includes("view")) {
        return { badge, name: "canvas", tone: "layout" };
    }

    if (searchText.includes("aspect ratio") || /\b\d+\s*[:x]\s*\d+\b/.test(searchText)) {
        return { badge, name: "canvas", tone: "layout" };
    }

    if (searchText.includes("jersey")) {
        return { badge, name: "jersey", tone: "jersey" };
    }

    if (searchText.includes("red card") || searchText.includes("yellow card") || searchText.includes("penalty")) {
        return { badge, name: "card", tone: searchText.includes("red") ? "danger" : "warning" };
    }

    if (searchText.includes("image") || searchText.includes("logo")) {
        return { badge, name: "image", tone: "image" };
    }

    if (searchText.includes("flag") || searchText.includes("country")) {
        return { badge, name: "flag", tone: "flag" };
    }

    if (searchText.includes("service") || searchText.includes("serving") || searchText.includes("server")) {
        return { badge, name: "serve", tone: "serve" };
    }

    if (isConditionalViewBlock(id, label, category)) {
        return { badge, name: "canvas", tone: "conditional" };
    }

    if (isNumericDataBlock(searchText)) {
        return { badge: badge || getGameBadge(label, id), name: "number", tone: "number" };
    }

    if (isTextDataBlock(searchText)) {
        return { name: "letter", tone: "text" };
    }

    if (searchText.includes("timeout") || searchText.includes("time out")) {
        return { badge, name: "timer", tone: "timer" };
    }

    if (searchText.includes("match point") || searchText.includes("game point")) {
        return { badge, name: "target", tone: "point" };
    }

    if (searchText.includes("show game score container")) {
        return { badge: getGameBadge(label, id), name: "canvas", tone: "conditional" };
    }

    if (searchText.includes("team")) {
        return { name: "letter", tone: "text" };
    }

    if (searchText.includes("player") || searchText.includes("name")) {
        return { name: "letter", tone: "text" };
    }

    if (searchText.includes("score") || searchText.includes("current game")) {
        return { badge: badge || getGameBadge(label, id), name: "number", tone: "number" };
    }

    if (searchText.includes("round") || searchText.includes("match")) {
        return { badge, name: "match", tone: "match" };
    }

    if (searchText.includes("text")) {
        return { name: "letter", tone: "text" };
    }

    return { badge, name: "grid", tone: "default" };
}

function describeConditionalBlock(id: string, label: string, category: string) {
    const source = `${id} ${label} ${category}`.toLowerCase();

    if (source.includes("timeout") || source.includes("time out")) {
        const side = getSideBadge(label, id);
        const timeoutState = source.includes("used") ? "has been used" : "is active";
        const sharedTimeoutState = source.includes("used") ? "has used a timeout" : "has an active timeout";

        if (side) {
            return `Conditional container that appears when side ${side}'s timeout ${timeoutState}. Drop timeout graphics or timers inside it.`;
        }

        return `Conditional container that appears when either side ${sharedTimeoutState}. Drop shared timeout graphics or timers inside it.`;
    }

    if (source.includes("show game score container")) {
        const game = getGameBadge(label, id);
        const gameText = game ? ` ${game}` : "";

        return `Conditional container that appears when game${gameText} scores should be shown. Drop the matching game score fields inside it.`;
    }

    if (source.includes("game point")) {
        return "Conditional container that appears when the current game is at game point. Drop game-point graphics or text inside it.";
    }

    if (source.includes("match point")) {
        return "Conditional container that appears when the current match is at match point. Drop match-point graphics or text inside it.";
    }

    if (source.includes("serving") || source.includes("server") || source.includes("service")) {
        const side = getSideBadge(label, id);
        const sideText = side ? ` for side ${side}` : "";

        return `Shows a service indicator${sideText} when that player or team is currently serving.`;
    }

    if (source.includes("yellow card") || source.includes("red card") || source.includes("penalty")) {
        const side = getSideBadge(label, id);
        const sideText = side ? ` for side ${side}` : "";

        return `Conditional card indicator${sideText}. It appears when the matching red or yellow card state is set.`;
    }

    return `Conditional container for ${label}. Drop content inside it to show only when that match state is active.`;
}

function getBlockDescription(id: string, label: string, category: string, icon: BlockIcon) {
    const source = `${id} ${label} ${category}`.toLowerCase();
    const displayLabel = label || "this block";

    if (source.includes("row container")) {
        return "Layout container that groups child elements in a horizontal row. Drop fields inside it to build a scoreboard section.";
    }

    if (source.includes("column container")) {
        return "Layout container that stacks child elements vertically. Drop fields inside it to build a scoreboard section.";
    }

    if (source.includes("court side") && source.includes("view")) {
        return "Court-side-aware container for custom content. Drop A/B fields, flags, images, or accents inside it and they will follow the court-side switching settings.";
    }

    if (source.includes("aspect ratio") || /\b\d+\s*[:x]\s*\d+\b/.test(source)) {
        return `Fixed-aspect layout frame for ${displayLabel}. Use it to design scoreboards for a specific screen shape.`;
    }

    if (isConditionalViewBlock(id, label, category)) {
        return describeConditionalBlock(id, label, category);
    }

    if (source.includes("timer") || source.includes("countdown") || source.includes("timeout") || source.includes("time out")) {
        return `Displays the live ${displayLabel} countdown from match data. Use it for timeout or clock-style scoreboard values.`;
    }

    if (source.includes("service") || source.includes("serving") || source.includes("server")) {
        const side = getSideBadge(label, id);
        const sideText = side ? ` for side ${side}` : "";

        return `Shows a service indicator${sideText} based on the current server state.`;
    }

    if (source.includes("red card") || source.includes("yellow card") || source.includes("penalty")) {
        const side = getSideBadge(label, id);
        const sideText = side ? ` for side ${side}` : "";

        return `Shows a red or yellow card indicator${sideText} when that penalty field is active.`;
    }

    if (source.includes("image") || source.includes("logo")) {
        return `Displays the live image or logo for ${displayLabel}. Use it for team logos, player photos, or event artwork.`;
    }

    if (source.includes("flag") || source.includes("country")) {
        return `Displays the live flag or country value for ${displayLabel}.`;
    }

    if (source.includes("jersey")) {
        return `Uses the live ${displayLabel} color from match data. Use it as a jersey swatch or colored accent.`;
    }

    if (icon.name === "number" || isNumericDataBlock(source)) {
        return `Displays the live numeric ${displayLabel} value from the current match, such as a score, game count, or timer.`;
    }

    if (icon.name === "letter" || isTextDataBlock(source)) {
        return `Displays the live text for ${displayLabel}. Use it for player names, team names, round labels, or other match text.`;
    }

    if (source.includes("round") || source.includes("match")) {
        return `Displays match information for ${displayLabel}, such as the round, fixture, or match-level value.`;
    }

    return `Adds ${displayLabel} to the scoreboard layout. Drag it onto the canvas and style it in the editor.`;
}

function renderBlockIcon(icon: BlockIcon, description: string) {
    const badge = icon.badge
        ? `<span class="osb-block-icon__badge">${escapeHtml(icon.badge)}</span>`
        : "";
    const safeDescription = escapeHtml(description);

    return `
        <div class="osb-block-icon osb-block-icon--${icon.tone}" title="${safeDescription}" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <title>${safeDescription}</title>
                ${ICON_PATHS[icon.name]}
            </svg>
            ${badge}
        </div>
    `;
}

export function applyBlockIcons(editor) {
    const decorateBlock = (block) => {
        const id = cleanText(block.get("id") || block.id);
        const label = cleanText(block.get("label") || id);
        const category = getCategoryName(block.get("category"));
        const icon = inferBlockIcon(id, label, category);
        const description = getBlockDescription(id, label, category, icon);
        const attributes = block.get("attributes") || {};

        block.set("label", label);
        block.set("attributes", {
            ...attributes,
            "aria-label": `${label}: ${description}`,
            title: description,
        });
        block.set("media", renderBlockIcon(icon, description));
    };

    editor.BlockManager.getAll().each(decorateBlock);
    editor.on("block:add", decorateBlock);
}
