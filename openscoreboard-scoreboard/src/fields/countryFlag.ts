import countries from "../../public/flags/countries.json";
import { setOptionalImageSource } from "./optionalImage";

const countryAliases: Record<string, string> = {
    "CHINESE TAIPEI": "CNT",
    "ENGLAND": "GB-ENG",
    "NORTH KOREA": "KP",
    "NORTHERN IRELAND": "GB-NIR",
    "RUSSIA": "RU",
    "SCOTLAND": "GB-SCT",
    "SOUTH KOREA": "KR",
    "TAIWAN": "TW",
    "UK": "GB",
    "UNITED STATES OF AMERICA": "US",
    "USA": "US",
    "WALES": "GB-WLS",
};

const countryCodeByName = Object.entries(countries).reduce((codeMap, [code, name]) => {
    codeMap[normalizeCountryValue(name)] = code;
    return codeMap;
}, {} as Record<string, string>);

function normalizeCountryValue(value: unknown) {
    return `${value || ""}`
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .trim()
        .toUpperCase();
}

export function resolveCountryCode(value: unknown) {
    const normalizedValue = normalizeCountryValue(value);
    if (!normalizedValue) {
        return "";
    }

    const directCode = normalizedValue.replace(/\s+/g, "-");
    if (Object.prototype.hasOwnProperty.call(countries, directCode)) {
        return directCode.toLowerCase();
    }

    const aliasCode = countryAliases[normalizedValue];
    if (aliasCode) {
        return aliasCode.toLowerCase();
    }

    return (countryCodeByName[normalizedValue] || "").toLowerCase();
}

export function setCountryFlagSource(element: HTMLImageElement, country: unknown) {
    const countryCode = resolveCountryCode(country);

    element.onerror = () => {
        element.onerror = null;
        setOptionalImageSource(element, "");
    };
    setOptionalImageSource(element, countryCode ? `flags/${countryCode}.png` : "");
}

export function hasPairedCountryFlags(playerA: any = {}, playerB: any = {}) {
    return !!resolveCountryCode(playerA?.country) && !!resolveCountryCode(playerB?.country);
}

export function setPairedCountryFlagSources(root: ParentNode, playerA: any = {}, playerB: any = {}) {
    const canShowFlags = hasPairedCountryFlags(playerA, playerB);
    const countryA = canShowFlags ? playerA?.country : "";
    const countryB = canShowFlags ? playerB?.country : "";

    root.querySelectorAll<HTMLImageElement>(".countryA").forEach((element) => {
        setCountryFlagSource(element, countryA);
    });
    root.querySelectorAll<HTMLImageElement>(".countryB").forEach((element) => {
        setCountryFlagSource(element, countryB);
    });
}

export function hideInitialCountryFlags(root: ParentNode) {
    root.querySelectorAll<HTMLImageElement>(".countryA, .countryB").forEach((element) => {
        setOptionalImageSource(element, "");
    });
}
