import { hasPairedPlayerImages, setOptionalImageSource } from "./optionalImage";
import { hasPairedCountryFlags, setCountryFlagSource } from "./countryFlag";

export const imageFieldList = [
    {
        field: "countryA",
        label: "Country Flag A",
        category: "Flags",
        listenerFields: ["playerA", "playerB"],
        requiredFields: ["playerA", "playerB"],
        action: (matchNode: HTMLImageElement, _value, currentMatchSettings) => {
            setCountryFlagSource(
                matchNode,
                hasPairedCountryFlags(currentMatchSettings?.playerA, currentMatchSettings?.playerB) ?
                    currentMatchSettings?.playerA?.country
                    : ""
            );
        }
    },
    {
        field: "countryB",
        label: "Country Flag B",
        category: "Flags",
        listenerFields: ["playerA", "playerB"],
        requiredFields: ["playerA", "playerB"],
        action: (matchNode: HTMLImageElement, _value, currentMatchSettings) => {
            setCountryFlagSource(
                matchNode,
                hasPairedCountryFlags(currentMatchSettings?.playerA, currentMatchSettings?.playerB) ?
                    currentMatchSettings?.playerB?.country
                    : ""
            );
        }
    },
    {
        field: "imageURLA",
        label: "Player Image A",
        category: "Player Images",
        sample: "0",
        listenerFields: ["playerA", "playerB"],
        requiredFields: ["playerA", "playerB"],
        action: (matchNode: HTMLImageElement, _value, currentMatchSettings) => {
            setOptionalImageSource(
                matchNode,
                hasPairedPlayerImages(currentMatchSettings?.playerA, currentMatchSettings?.playerB) ?
                    currentMatchSettings?.playerA?.imageURL
                    : ""
            );
        }
    },
    {
        field: "imageURLB",
        label: "Player Image B",
        category: "Player Images",
        sample: "",
        listenerFields: ["playerA", "playerB"],
        requiredFields: ["playerA", "playerB"],
        action: (matchNode: HTMLImageElement, _value, currentMatchSettings) => {
            setOptionalImageSource(
                matchNode,
                hasPairedPlayerImages(currentMatchSettings?.playerA, currentMatchSettings?.playerB) ?
                    currentMatchSettings?.playerB?.imageURL
                    : ""
            );
        }
    },
    {
        field: "teamLogoURLA",
        label: "Team A Logo URL",
        category: "Teams",
        sample: "",
        action: (matchNode: HTMLImageElement, value) => {
            setOptionalImageSource(matchNode, value);
        }
        // justify: "center"
    },
    {
        field: "teamLogoURLB",
        label: "Team B Logo URL",
        category: "Teams",
        sample: "",
        action: (matchNode: HTMLImageElement, value) => {
            setOptionalImageSource(matchNode, value);
        }
        // justify: "center"
    },
];
