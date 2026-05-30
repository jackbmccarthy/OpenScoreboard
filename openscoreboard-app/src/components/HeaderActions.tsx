import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { getCurrentUser, signOut } from '../../database';
import { isFirebaseAuthRequired } from '../../openscoreboard.config';

const HEADER_TEXT = "#ffffff";
const HEADER_BORDER = "rgba(255, 255, 255, 0.28)";
const HEADER_FILL = "rgba(255, 255, 255, 0.14)";

function getInitials(user) {
    const label = user?.displayName || user?.email || "Account";
    const parts = label.split(/[ @._-]+/).filter(Boolean);

    if (parts.length > 1) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return label.slice(0, 2).toUpperCase();
}

function AccountAvatar({ user }) {
    const [hasPhotoError, setHasPhotoError] = React.useState(false);
    const photoURL = user?.photoURL?.trim();

    React.useEffect(() => {
        setHasPhotoError(false);
    }, [photoURL]);

    if (photoURL && !hasPhotoError) {
        return (
            <Image
                source={{ uri: photoURL }}
                onError={() => setHasPhotoError(true)}
                style={styles.avatarImage}
            />
        );
    }

    return (
        <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user)}</Text>
        </View>
    );
}

export function HeaderIconButton({ label, onPress }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            style={({ hovered, pressed }) => [
                styles.iconButton,
                (hovered || pressed) ? styles.activeButton : null,
            ]}
        >
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <Path d="M12 5V19" stroke={HEADER_TEXT} strokeWidth="2.4" strokeLinecap="round" />
                <Path d="M5 12H19" stroke={HEADER_TEXT} strokeWidth="2.4" strokeLinecap="round" />
            </Svg>
        </Pressable>
    );
}

export function HeaderActions({ navigation, action = null }) {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const currentUser = getCurrentUser();
    const shouldShowAccountMenu = isFirebaseAuthRequired && Boolean(currentUser);

    React.useEffect(() => {
        if (!shouldShowAccountMenu) {
            setIsMenuOpen(false);
        }
    }, [shouldShowAccountMenu]);

    if (!action && !shouldShowAccountMenu) {
        return null;
    }

    return (
        <View style={styles.wrap}>
            {action}
            {shouldShowAccountMenu ? (
                <View>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Account menu"
                        onPress={() => setIsMenuOpen(!isMenuOpen)}
                        style={({ hovered, pressed }) => [
                            styles.avatarButton,
                            (hovered || pressed || isMenuOpen) ? styles.activeButton : null,
                        ]}
                    >
                        <AccountAvatar user={currentUser} />
                    </Pressable>
                    {isMenuOpen ? (
                        <View style={styles.accountMenu}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="My Account"
                                onPress={() => {
                                    setIsMenuOpen(false);
                                    navigation.navigate("MyAccount");
                                }}
                                style={({ hovered, pressed }) => [
                                    styles.menuItem,
                                    (hovered || pressed) ? styles.menuItemActive : null,
                                ]}
                            >
                                <Text style={styles.menuItemText}>My Account</Text>
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Sign Out"
                                onPress={() => {
                                    setIsMenuOpen(false);
                                    signOut();
                                }}
                                style={({ hovered, pressed }) => [
                                    styles.menuItem,
                                    (hovered || pressed) ? styles.menuItemActive : null,
                                ]}
                            >
                                <Text style={styles.menuItemText}>Sign Out</Text>
                            </Pressable>
                        </View>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: "center",
        flexDirection: "row",
        gap: 8,
    },
    iconButton: {
        alignItems: "center",
        backgroundColor: HEADER_FILL,
        borderColor: HEADER_BORDER,
        borderRadius: 8,
        borderWidth: 1,
        height: 36,
        justifyContent: "center",
        width: 36,
    },
    avatarButton: {
        alignItems: "center",
        backgroundColor: HEADER_FILL,
        borderColor: HEADER_BORDER,
        borderRadius: 999,
        borderWidth: 1,
        height: 36,
        justifyContent: "center",
        width: 36,
    },
    activeButton: {
        backgroundColor: "rgba(255, 255, 255, 0.22)",
    },
    avatar: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 999,
        height: 28,
        justifyContent: "center",
        width: 28,
    },
    avatarImage: {
        backgroundColor: "#ffffff",
        borderRadius: 999,
        height: 28,
        width: 28,
    },
    avatarText: {
        color: "#001d8f",
        fontSize: 11,
        fontWeight: "800",
    },
    accountMenu: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 150,
        paddingVertical: 6,
        position: "absolute",
        right: 0,
        top: 42,
        zIndex: 20,
    },
    menuItem: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    menuItemActive: {
        backgroundColor: "#f3f4f6",
    },
    menuItemText: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "600",
    },
});
