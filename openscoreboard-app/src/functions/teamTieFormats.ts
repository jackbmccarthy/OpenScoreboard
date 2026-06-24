export const TEAM_A_POSITION_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
export const TEAM_B_POSITION_CODES = ["X", "Y", "Z", "W", "V", "U", "T", "S", "R", "Q"];

export const DEFAULT_TEAM_TIE_FORMAT = {
    gamesToWin: 3,
    tableCount: 2,
    rules: [
        { bestOf: 5, checkpoint: 1, id: "match-1", label: "Match 1", matchType: "singles", sideAOptions: [["A"]], sideBOptions: [["X"]] },
        { bestOf: 5, checkpoint: 1, id: "match-2", label: "Match 2", matchType: "singles", sideAOptions: [["B"]], sideBOptions: [["Y"]] },
        { bestOf: 5, checkpoint: 2, id: "match-3", label: "Match 3", matchType: "doubles", sideAOptions: [["A"], ["B"]], sideBOptions: [["X"], ["Y"]] },
        { bestOf: 5, checkpoint: 2, id: "match-4", label: "Match 4", matchType: "singles", sideAOptions: [["A"]], sideBOptions: [["Y"]] },
        { bestOf: 5, checkpoint: 2, id: "match-5", label: "Match 5", matchType: "singles", sideAOptions: [["B"]], sideBOptions: [["X"]] },
    ],
};

function cleanCode(value: any, fallback: any) {
    return `${value || fallback || ""}`.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
}

export function parseTeamTieCodeOptions(value: any, fallback: any = []) {
    const rawOptions = Array.isArray(value) ?
        value
        : `${value || ""}`.split(/\s*(?:\/|,|\||\bor\b)\s*/i);
    const cleanOptions = rawOptions
        .map((option) => cleanCode(option, ""))
        .filter(Boolean);
    const fallbackOptions = Array.isArray(fallback) ? fallback : [fallback];

    return [...new Set(cleanOptions.length > 0 ? cleanOptions : fallbackOptions.map((option) => cleanCode(option, "")).filter(Boolean))];
}

function getLegacySlotOptions(rule: any, side: string, slotIndex: number) {
    const legacyValue = rule?.[side]?.[slotIndex];
    return Array.isArray(legacyValue) ? legacyValue : [legacyValue];
}

function normalizeRule(rule: any, index: number) {
    const isDoubles = rule?.matchType === "doubles";
    const sideACount = isDoubles ? 2 : 1;
    const sideBCount = isDoubles ? 2 : 1;
    const defaultRule: any = DEFAULT_TEAM_TIE_FORMAT.rules[index] || {};
    const sideAOptions = Array.from({ length: sideACount }).map((_, slotIndex) => {
        return parseTeamTieCodeOptions(
            rule?.sideAOptions?.[slotIndex] || getLegacySlotOptions(rule, "sideA", slotIndex),
            defaultRule.sideAOptions?.[slotIndex] || [slotIndex === 0 ? "A" : "B"]
        );
    });
    const sideBOptions = Array.from({ length: sideBCount }).map((_, slotIndex) => {
        return parseTeamTieCodeOptions(
            rule?.sideBOptions?.[slotIndex] || getLegacySlotOptions(rule, "sideB", slotIndex),
            defaultRule.sideBOptions?.[slotIndex] || [slotIndex === 0 ? "X" : "Y"]
        );
    });

    return {
        bestOf: [1, 3, 5, 7, 9].includes(Number(rule?.bestOf)) ? Number(rule.bestOf) : 5,
        checkpoint: Math.max(1, Math.min(3, Number(rule?.checkpoint) || 1)),
        id: rule?.id || `match-${index + 1}`,
        label: `${rule?.label || defaultRule.label || `Match ${index + 1}`}`.trim(),
        matchType: isDoubles ? "doubles" : "singles",
        sideA: sideAOptions.map((options) => options[0]),
        sideAOptions,
        sideB: sideBOptions.map((options) => options[0]),
        sideBOptions,
    };
}

function getRawFormatCodes(format: any, side: "sideAOptions" | "sideBOptions") {
    return (format?.rules || []).flatMap((rule) => {
        const slots = rule?.[side] || [];
        return slots.flatMap((slot) => parseTeamTieCodeOptions(slot));
    });
}

export function validateTeamTiePositionCodes(format: any) {
    const invalidTeamACodes = [...new Set(getRawFormatCodes(format, "sideAOptions").filter((code) => !TEAM_A_POSITION_CODES.includes(code)))];
    const invalidTeamBCodes = [...new Set(getRawFormatCodes(format, "sideBOptions").filter((code) => !TEAM_B_POSITION_CODES.includes(code)))];

    return {
        invalidTeamACodes,
        invalidTeamBCodes,
        isValid: invalidTeamACodes.length === 0 && invalidTeamBCodes.length === 0,
    };
}

export function normalizeTeamTieFormat(format: any = {}) {
    const rules = Array.isArray(format?.rules) && format.rules.length > 0 ?
        format.rules.map(normalizeRule)
        : DEFAULT_TEAM_TIE_FORMAT.rules.map(normalizeRule);

    return {
        gamesToWin: Math.max(1, Math.min(rules.length, Number(format?.gamesToWin) || Math.floor(rules.length / 2) + 1)),
        tableCount: Math.max(1, Math.min(2, Number(format?.tableCount) || 1)),
        rules,
    };
}

export function formatTeamTieSideSummary(slotOptions: string[][] = []) {
    return slotOptions
        .map((options) => options.length > 1 ? `(${options.join(" or ")})` : options[0] || "?")
        .join(" + ");
}

export function formatTeamTieRuleSummary(rule: any) {
    return `${formatTeamTieSideSummary(rule?.sideAOptions)} vs ${formatTeamTieSideSummary(rule?.sideBOptions)}`;
}

export function getTeamTiePositionCodes(format: any) {
    const normalizedFormat = normalizeTeamTieFormat(format);
    return {
        sideA: [...new Set<string>(normalizedFormat.rules.flatMap((rule) => rule.sideAOptions.flat()))],
        sideB: [...new Set<string>(normalizedFormat.rules.flatMap((rule) => rule.sideBOptions.flat()))],
    };
}
