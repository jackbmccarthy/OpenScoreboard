import React, { useMemo } from "react";
import { Select } from "native-base";
import jsonFlags from "../flags/countries.json";

export function normalizeCountryCode(countryCode = "") {
    return countryCode ? countryCode.toLowerCase() : "";
}

export function getCountryName(countryCode = "") {
    if (!countryCode) {
        return "";
    }

    return jsonFlags[countryCode.toUpperCase()] || countryCode;
}

export function getCountryOptions() {
    return Object.entries(jsonFlags)
        .map(([countryCode, countryName]) => ({
            label: countryName,
            value: countryCode.toLowerCase(),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

export default function CountrySelect({ value, onChange, placeholder = "Select Country", allowEmpty = true }) {
    const countryOptions = useMemo(() => getCountryOptions(), []);

    return (
        <Select
            selectedValue={normalizeCountryCode(value)}
            onValueChange={(countryCode) => {
                onChange(normalizeCountryCode(countryCode));
            }}
            placeholder={placeholder}
        >
            {allowEmpty ? (
                <Select.Item label="No country set" value="" />
            ) : null}
            {countryOptions.map((country) => (
                <Select.Item key={country.value} label={country.label} value={country.value} />
            ))}
        </Select>
    );
}
