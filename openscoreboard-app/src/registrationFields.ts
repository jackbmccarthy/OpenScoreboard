export const imageURLRegistrationEnabled = false;

export const defaultPlayerRegistrationFields = {
    firstName: true,
    lastName: true,
    country: true,
    jerseyColor: false,
    imageURL: false,
    gender: false,
    rating: false,
    ranking: false,
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
    {
        key: "gender",
        label: "Gender",
        description: "Optional one-character gender metadata for grouping, filtering, and future competition formats.",
        locked: false,
    },
    {
        key: "rating",
        label: "Rating",
        description: "Optional numeric rating for seeding and sorting player lists.",
        locked: false,
    },
    {
        key: "ranking",
        label: "Ranking",
        description: "Optional numeric ranking for seeding and sorting player lists.",
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
