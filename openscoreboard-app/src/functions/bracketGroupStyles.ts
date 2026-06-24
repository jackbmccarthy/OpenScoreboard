import db, { getUserPath } from '../../database';

export const defaultBracketGroupDisplayStyles = {
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

export async function createBracketGroupStyle({
    displayType = "singleElimination",
    title,
} = {}) {
    const timestamp = new Date().toISOString();
    const styleRef = db.ref("bracketGroupStyles").push();
    const styleID = styleRef.key;
    const cleanTitle = title?.trim() || (displayType === "roundRobin" ? "Round Robin Display" : "Bracket Display");
    const style = {
        ...defaultBracketGroupDisplayStyles,
        createdOn: timestamp,
        deleted: false,
        displayType,
        id: styleID,
        ownerID: getUserPath(),
        title: cleanTitle,
        updatedOn: timestamp,
    };

    await styleRef.set(style);
    await db.ref(`users/${getUserPath()}/myBracketGroupStyles`).push({
        createdOn: timestamp,
        displayType,
        id: styleID,
        title: cleanTitle,
        updatedOn: timestamp,
    });

    return style;
}

export async function getMyBracketGroupStyles(userID = getUserPath()) {
    const myStylesSnapshot = await db.ref(`users/${userID}/myBracketGroupStyles`).get();
    const myStyles = myStylesSnapshot.val();

    if (!myStyles || typeof myStyles !== "object") {
        return [];
    }

    return Promise.all(Object.entries(myStyles).map(async ([myStyleID, data]: any) => {
        const styleID = data?.id;
        const styleSnapshot = styleID ? await db.ref(`bracketGroupStyles/${styleID}`).get() : null;
        const style = styleSnapshot?.val() || {};

        return [myStyleID, {
            ...data,
            ...style,
            title: style?.title || data?.title,
        }];
    }));
}

export async function getBracketGroupStyle(styleID) {
    const styleSnapshot = await db.ref(`bracketGroupStyles/${styleID}`).get();
    return styleSnapshot.val();
}

export async function updateBracketGroupStyle(styleID, updates = {}) {
    const timestamp = new Date().toISOString();
    await db.ref(`bracketGroupStyles/${styleID}`).update({
        ...updates,
        updatedOn: timestamp,
    });

    if (updates?.title) {
        const myStylesSnapshot = await db.ref(`users/${getUserPath()}/myBracketGroupStyles`).get();
        const myStyles = myStylesSnapshot.val() || {};
        const matchingEntry = Object.entries(myStyles).find(([, value]: any) => value?.id === styleID);

        if (matchingEntry) {
            await db.ref(`users/${getUserPath()}/myBracketGroupStyles/${matchingEntry[0]}`).update({
                displayType: updates?.displayType || matchingEntry[1]?.displayType || "singleElimination",
                title: updates.title,
                updatedOn: timestamp,
            });
        }
    }
}
