import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAppNavigationSections } from '../navigationSections';

const openScoreboardBlue = "#0028ff";

export function HeaderMenuButton({ onPress }) {
    return (
        <Pressable
            accessibilityLabel="Open navigation menu"
            accessibilityRole="button"
            onPress={onPress}
            style={({ hovered, pressed }) => [
                styles.headerMenuButton,
                hovered || pressed ? styles.headerMenuButtonActive : null,
            ]}
        >
            <MaterialCommunityIcons name="menu" size={24} color="#ffffff" />
        </Pressable>
    );
}

export function HeaderBackAndMenu({ canGoBack = false, onBack, onOpenMenu }) {
    return (
        <View style={styles.headerLeftWrap}>
            {canGoBack ? (
                <Pressable
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                    onPress={onBack}
                    style={({ hovered, pressed }) => [
                        styles.headerBackButton,
                        hovered || pressed ? styles.headerMenuButtonActive : null,
                    ]}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
                </Pressable>
            ) : null}
            <HeaderMenuButton onPress={onOpenMenu} />
        </View>
    );
}

export function AppDrawer({ isOpen, navigationRef, onClose }) {
    if (!isOpen) {
        return null;
    }

    const navigationSections = getAppNavigationSections();

    function navigate(route) {
        if (!route) {
            return;
        }

        onClose();
        navigationRef.current?.navigate(route);
    }

    return (
        <View style={styles.overlay} pointerEvents="box-none">
            <Pressable accessibilityLabel="Close navigation menu" style={styles.scrim} onPress={onClose} />
            <View style={styles.drawer}>
                <LinearGradient
                    colors={['#000000', openScoreboardBlue]}
                    end={{ x: 1, y: 0 }}
                    start={{ x: 0, y: 0 }}
                    style={styles.drawerHeader}
                >
                    <View style={styles.drawerTitleRow}>
                        <Text style={styles.drawerTitle}>Open Scoreboard</Text>
                        <Pressable
                            accessibilityLabel="Close navigation menu"
                            accessibilityRole="button"
                            onPress={onClose}
                            style={({ hovered, pressed }) => [
                                styles.closeButton,
                                hovered || pressed ? styles.headerMenuButtonActive : null,
                            ]}
                        >
                            <MaterialCommunityIcons name="close" size={22} color="#ffffff" />
                        </Pressable>
                    </View>
                    <Text style={styles.drawerSubtitle}>Jump between your event tools.</Text>
                </LinearGradient>
                <ScrollView style={styles.drawerBody}>
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => navigate("Home")}
                        style={({ hovered, pressed }) => [
                            styles.homeItem,
                            hovered || pressed ? styles.drawerItemActive : null,
                        ]}
                    >
                        <MaterialCommunityIcons name="home-outline" size={20} color={openScoreboardBlue} />
                        <Text style={styles.homeText}>Home</Text>
                    </Pressable>
                    {navigationSections.map((section) => (
                        <View key={section.title} style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name={section.icon as any} size={17} color="#6B7280" />
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                            </View>
                            {section.items.map((item) => (
                                <Pressable
                                    accessibilityRole="button"
                                    key={`${section.title}-${item.route || item.title}`}
                                    onPress={() => navigate(item.route)}
                                    style={({ hovered, pressed }) => [
                                        styles.drawerItem,
                                        hovered || pressed ? styles.drawerItemActive : null,
                                    ]}
                                >
                                    <View style={styles.drawerItemTextWrap}>
                                        <Text style={styles.drawerItemTitle}>{item.title}</Text>
                                        <Text numberOfLines={1} style={styles.drawerItemDescription}>{item.description}</Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
                                </Pressable>
                            ))}
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    closeButton: {
        alignItems: "center",
        borderColor: "rgba(255, 255, 255, 0.28)",
        borderRadius: 8,
        borderWidth: 1,
        height: 36,
        justifyContent: "center",
        width: 36,
    },
	    drawer: {
	        backgroundColor: "#ffffff",
	        bottom: 0,
	        boxShadow: "0 20px 60px rgba(15, 23, 42, 0.28)",
	        left: 0,
	        maxWidth: "92%",
	        position: "absolute",
	        top: 0,
	        width: 390,
	    } as any,
    drawerBody: {
        flex: 1,
    },
    drawerHeader: {
        paddingHorizontal: 18,
        paddingVertical: 18,
    },
    drawerItem: {
        alignItems: "center",
        borderRadius: 8,
        flexDirection: "row",
        marginTop: 4,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    drawerItemActive: {
        backgroundColor: "#F3F6FF",
    },
    drawerItemDescription: {
        color: "#6B7280",
        fontSize: 12,
        marginTop: 2,
    },
    drawerItemTextWrap: {
        flex: 1,
        paddingRight: 8,
    },
    drawerItemTitle: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "800",
    },
    drawerSubtitle: {
        color: "rgba(255, 255, 255, 0.78)",
        fontSize: 13,
        marginTop: 6,
    },
    drawerTitle: {
        color: "#ffffff",
        flex: 1,
        fontSize: 20,
        fontWeight: "900",
    },
    drawerTitleRow: {
        alignItems: "center",
        flexDirection: "row",
    },
    headerMenuButton: {
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.14)",
        borderColor: "rgba(255, 255, 255, 0.28)",
        borderRadius: 8,
        borderWidth: 1,
        height: 36,
        justifyContent: "center",
        marginLeft: 8,
        width: 36,
    },
    headerBackButton: {
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.14)",
        borderColor: "rgba(255, 255, 255, 0.28)",
        borderRadius: 8,
        borderWidth: 1,
        height: 36,
        justifyContent: "center",
        marginLeft: 12,
        width: 36,
    },
    headerLeftWrap: {
        alignItems: "center",
        flexDirection: "row",
    },
    headerMenuButtonActive: {
        backgroundColor: "rgba(255, 255, 255, 0.22)",
    },
    homeItem: {
        alignItems: "center",
        borderBottomColor: "#E5E7EB",
        borderBottomWidth: 1,
        flexDirection: "row",
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    homeText: {
        color: "#111827",
        fontSize: 15,
        fontWeight: "900",
        marginLeft: 10,
    },
    overlay: {
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
        zIndex: 1000,
    },
    scrim: {
        backgroundColor: "rgba(15, 23, 42, 0.38)",
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
    },
    section: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    sectionHeader: {
        alignItems: "center",
        flexDirection: "row",
        marginBottom: 4,
        paddingHorizontal: 6,
    },
    sectionTitle: {
        color: "#6B7280",
        fontSize: 11,
        fontWeight: "900",
        letterSpacing: 0,
        marginLeft: 6,
        textTransform: "uppercase",
    },
});
