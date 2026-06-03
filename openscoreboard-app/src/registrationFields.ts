export const imageURLRegistrationEnabled = false;

export const defaultPlayerRegistrationFields = {
    firstName: true,
    lastName: true,
    country: true,
    jerseyColor: false,
    imageURL: false,
};

export const playerRegistrationFieldOptions = [
    {
        key: "firstName",
        label: "First name",
        description: "Always required so players can be identified.",
        locked: true,
    },
    {
        key: "lastName",
        label: "Last name",
        description: "Useful for larger player lists and common names.",
        locked: false,
    },
    {
        key: "country",
        label: "Country",
        description: "Lets players choose a country from the supported country list.",
        locked: false,
    },
    {
        key: "jerseyColor",
        label: "Jersey color",
        description: "Optional color metadata for scoring and display workflows.",
        locked: false,
    },
];

export function normalizePlayerRegistrationFields(fields = {}) {
    return {
        ...defaultPlayerRegistrationFields,
        ...fields,
        firstName: true,
        imageURL: imageURLRegistrationEnabled && fields.imageURL === true,
    };
}
