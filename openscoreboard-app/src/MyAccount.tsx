import React from 'react';
import { Image as RNImage, StyleSheet, useWindowDimensions } from 'react-native';
import { Text, Button, View, NativeBaseProvider, ScrollView, Input, FormControl } from 'native-base';
import {
    getCurrentUser,
    getActiveAuthProvider,
    sendCurrentUserEmailVerification,
    sendCurrentUserPasswordResetEmail,
    updateCurrentUserEmail,
    updateCurrentUserPassword,
    updateCurrentUserProfile,
    uploadCurrentUserProfilePhoto,
} from '../database';
import { openScoreboardButtonTextColor } from "../openscoreboardtheme";
import { openScoreboardTheme } from "../openscoreboardtheme";
import { isFirebaseAuthRequired } from '../openscoreboard.config';

function getInitials(user) {
    const label = user?.displayName || user?.email || "Account";
    const parts = label.split(/[ @._-]+/).filter(Boolean);

    if (parts.length > 1) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return label.slice(0, 2).toUpperCase();
}

function getErrorMessage(err) {
    switch (err?.code) {
        case "auth/requires-recent-login":
            return "Firebase requires a fresh login before changing this setting. Sign out, sign back in, and try again.";
        case "auth/email-already-in-use":
            return "That email address is already in use.";
        case "auth/invalid-email":
            return "Enter a valid email address.";
        case "auth/weak-password":
            return "Password must be at least 6 characters.";
        case "storage/unauthorized":
            return "Firebase Storage rejected the upload. Check your Storage rules for profile photos.";
        case "storage/bucket-not-found":
            return "Firebase Storage bucket was not found. Check EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET for this build.";
        case "storage/object-not-found":
            return "Firebase Storage could not find that profile photo.";
        default:
            return err?.message || "Something went wrong.";
    }
}

function getProviderLabel(providerId) {
    switch (providerId) {
        case "password":
            return "Email/password";
        case "google.com":
            return "Google";
        case "facebook.com":
            return "Facebook";
        case "github.com":
            return "GitHub";
        case "twitter.com":
            return "Twitter";
        case "apple.com":
            return "Apple";
        case "microsoft.com":
            return "Microsoft";
        case "phone":
            return "Phone";
        default:
            return providerId || "Unknown";
    }
}

function FeedbackCard({ message, type = "success" }) {
    if (!message) {
        return null;
    }

    const isError = type === "error";

    return (
        <View
            backgroundColor={isError ? "red.50" : "green.50"}
            borderColor={isError ? "red.300" : "green.300"}
            borderLeftColor={isError ? "red.600" : "green.600"}
            borderLeftWidth={4}
            borderRadius={8}
            borderWidth={1}
            marginTop={3}
            padding={3}
            width={"100%"}
        >
            <Text color={isError ? "red.800" : "green.800"} fontSize={"sm"} fontWeight={"bold"}>
                {isError ? "Action needed" : "Changes saved"}
            </Text>
            <Text color={isError ? "red.800" : "green.800"} fontSize={"sm"} marginTop={1}>
                {message}
            </Text>
        </View>
    )
}

function FirebaseAccountSettings() {
    const { width: viewportWidth } = useWindowDimensions();
    const currentUser = getCurrentUser();
    const [accountUser, setAccountUser] = React.useState(currentUser);
    const [displayName, setDisplayName] = React.useState(currentUser?.displayName || "");
    const [photoURL, setPhotoURL] = React.useState(currentUser?.photoURL || "");
    const [emailAddress, setEmailAddress] = React.useState(currentUser?.email || "");
    const [newPassword, setNewPassword] = React.useState("");
    const [profileMessage, setProfileMessage] = React.useState("");
    const [profileError, setProfileError] = React.useState("");
    const [securityMessage, setSecurityMessage] = React.useState("");
    const [securityError, setSecurityError] = React.useState("");
    const [activeAction, setActiveAction] = React.useState("");
    const [hasPhotoError, setHasPhotoError] = React.useState(false);

    const email = accountUser?.email || "No email address";
    const providerNames = accountUser?.providerData?.map((provider) => provider.providerId).filter(Boolean) || [];
    const activeProviderId = getActiveAuthProvider() || (providerNames.length === 1 ? providerNames[0] : "");
    const isPasswordProviderActive = activeProviderId === "password";
    const providerLabel = getProviderLabel(activeProviderId);
    const normalizedPhotoURL = photoURL.trim();
    const shouldShowPhoto = Boolean(normalizedPhotoURL && !hasPhotoError);
    const profilePhotoSize = Math.min(Math.max(viewportWidth * 0.5, 144), 240);

    const clearProfileMessages = () => {
        setProfileMessage("");
        setProfileError("");
    }

    const clearSecurityMessages = () => {
        setSecurityMessage("");
        setSecurityError("");
    }

    const refreshUserState = (user = getCurrentUser()) => {
        setAccountUser(user);
        setDisplayName(user?.displayName || "");
        setPhotoURL(user?.photoURL || "");
        setEmailAddress(user?.email || "");
        setHasPhotoError(false);
    }

    const saveProfile = async () => {
        clearProfileMessages();
        setActiveAction("profile");

        try {
            const updatedUser = await updateCurrentUserProfile({
                displayName,
            });
            refreshUserState(updatedUser);
            setProfileMessage("Profile updated.");
        }
        catch (err) {
            setProfileError(getErrorMessage(err));
        }
        finally {
            setActiveAction("");
        }
    }

    const uploadPhoto = () => {
        clearProfileMessages();

        if (typeof document === "undefined") {
            setProfileError("Photo uploads are available in the web app.");
            return;
        }

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
            const file = input.files?.[0];

            if (!file) {
                return;
            }

            setActiveAction("photo");

            try {
                const uploadedPhotoURL = await uploadCurrentUserProfilePhoto(file);
                const user = getCurrentUser();
                setPhotoURL(uploadedPhotoURL);
                setHasPhotoError(false);
                refreshUserState(user);
                setProfileMessage("Profile photo uploaded.");
            }
            catch (err) {
                setProfileError(getErrorMessage(err));
            }
            finally {
                setActiveAction("");
            }
        };
        input.click();
    }

    const sendVerificationEmail = async () => {
        clearSecurityMessages();
        setActiveAction("verification");

        try {
            if (accountUser?.emailVerified) {
                setSecurityMessage("Email address is already verified.");
                return;
            }

            await sendCurrentUserEmailVerification();
            setSecurityMessage("Verification email sent. Check your inbox.");
        }
        catch (err) {
            setSecurityError(getErrorMessage(err));
        }
        finally {
            setActiveAction("");
        }
    }

    const sendPasswordReset = async () => {
        clearSecurityMessages();
        setActiveAction("password-reset");

        try {
            await sendCurrentUserPasswordResetEmail();
            setSecurityMessage("Password reset email sent. Check your inbox.");
        }
        catch (err) {
            setSecurityError(getErrorMessage(err));
        }
        finally {
            setActiveAction("");
        }
    }

    const saveEmail = async () => {
        clearSecurityMessages();

        if (!emailAddress.trim()) {
            setSecurityError("Enter an email address.");
            return;
        }

        if (emailAddress.trim() === accountUser?.email) {
            setSecurityMessage("Email address is unchanged.");
            return;
        }

        setActiveAction("email");

        try {
            const updatedUser = await updateCurrentUserEmail(emailAddress.trim());
            refreshUserState(updatedUser);
            setSecurityMessage("Email address updated.");
        }
        catch (err) {
            setSecurityError(getErrorMessage(err));
        }
        finally {
            setActiveAction("");
        }
    }

    const savePassword = async () => {
        clearSecurityMessages();

        if (newPassword.length < 6) {
            setSecurityError("Password must be at least 6 characters.");
            return;
        }

        setActiveAction("password");

        try {
            await updateCurrentUserPassword(newPassword);
            setNewPassword("");
            setSecurityMessage("Password updated.");
        }
        catch (err) {
            setSecurityError(getErrorMessage(err));
        }
        finally {
            setActiveAction("");
        }
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView
                backgroundColor={"gray.50"}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 420 }}
                flex={1}
            >
                <View width={"100%"} maxW={960} alignSelf={"center"} padding={4} paddingBottom={8}>
                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        padding={4}
                    >
                        <View alignItems={"flex-start"}>
                            <View alignItems={"center"} alignSelf={"center"}>
                                <View
                                    style={[
                                        styles.profilePhotoFrame,
                                        {
                                            borderRadius: profilePhotoSize / 2,
                                            height: profilePhotoSize,
                                            width: profilePhotoSize,
                                        },
                                    ]}
                                >
                                {shouldShowPhoto ? (
                                    <RNImage
                                        source={{ uri: normalizedPhotoURL }}
                                        onError={() => setHasPhotoError(true)}
                                        resizeMode={"cover"}
                                        style={[
                                            styles.profileImage,
                                            {
                                                borderRadius: profilePhotoSize / 2,
                                                height: profilePhotoSize,
                                                width: profilePhotoSize,
                                            },
                                        ]}
                                    />
                                ) : (
                                    <View
                                        alignItems={"center"}
                                        backgroundColor={"blue.700"}
                                        borderRadius={999}
                                        height={profilePhotoSize}
                                        justifyContent={"center"}
                                        width={profilePhotoSize}
                                    >
                                        <Text color={"white"} fontSize={Math.round(profilePhotoSize * 0.16)} fontWeight={"bold"}>
                                            {getInitials(accountUser)}
                                        </Text>
                                    </View>
                                )}
                                </View>
                                <Button
                                    isLoading={activeAction === "photo"}
                                    marginTop={3}
                                    onPress={uploadPhoto}
                                    variant={"outline"}
                                >
                                    <Text color={"gray.900"}>Change Profile Photo</Text>
                                </Button>
                            </View>
                            <View marginTop={3}>
                                <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"}>Account Settings</Text>
                                <Text color={"gray.600"} fontSize={"sm"}>{email}</Text>
                                <Text color={"gray.500"} fontSize={"xs"} marginTop={1}>{providerLabel}</Text>
                            </View>
                        </View>
                    </View>

                    <FeedbackCard message={profileError} type={"error"} />
                    <FeedbackCard message={profileMessage} />

                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        marginTop={4}
                        padding={4}
                    >
                        <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>Profile</Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>Manage the Firebase profile shown on your account.</Text>
                        <View flexDir={"row"} flexWrap={"wrap"} justifyContent={"space-between"} marginTop={4}>
                            <View width={"100%"} marginBottom={3}>
                                <FormControl>
                                    <FormControl.Label>Display Name</FormControl.Label>
                                    <Input value={displayName} onChangeText={setDisplayName} />
                                </FormControl>
                            </View>
                        </View>
                        <View flexDir={"row"} flexWrap={"wrap"}>
                            <View marginBottom={2}>
                                <Button isLoading={activeAction === "profile"} onPress={saveProfile}>
                                    <Text color={openScoreboardButtonTextColor}>Save Profile</Text>
                                </Button>
                            </View>
                        </View>
                    </View>

                    {isPasswordProviderActive ? (
                        <View
                            backgroundColor={"white"}
                            borderColor={"gray.200"}
                            borderRadius={8}
                            borderWidth={1}
                            marginTop={4}
                            padding={4}
                        >
                            <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>Security</Text>
                            <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>Manage email verification, email address, and password for this Firebase user.</Text>
                            <View flexDir={"row"} flexWrap={"wrap"} justifyContent={"space-between"} marginTop={4}>
                                <View width={{ base: "100%", md: "48.5%" }} marginBottom={3}>
                                    <FormControl>
                                        <FormControl.Label>Email Address</FormControl.Label>
                                        <Input
                                            value={emailAddress}
                                            onChangeText={setEmailAddress}
                                            autoCapitalize={"none"}
                                            autoCorrect={false}
                                        />
                                    </FormControl>
                                </View>
                                <View width={{ base: "100%", md: "48.5%" }} marginBottom={3}>
                                    <FormControl>
                                        <FormControl.Label>New Password</FormControl.Label>
                                        <Input
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            secureTextEntry
                                        />
                                    </FormControl>
                                </View>
                            </View>
                            <View marginBottom={securityError || securityMessage ? 3 : 0}>
                                <FeedbackCard message={securityError} type={"error"} />
                                <FeedbackCard message={securityMessage} />
                            </View>
                            <View flexDir={"row"} flexWrap={"wrap"}>
                                <View marginRight={2} marginBottom={2}>
                                    <Button isLoading={activeAction === "email"} onPress={saveEmail}>
                                        <Text color={openScoreboardButtonTextColor}>Update Email</Text>
                                    </Button>
                                </View>
                                <View marginRight={2} marginBottom={2}>
                                    <Button isLoading={activeAction === "password"} onPress={savePassword}>
                                        <Text color={openScoreboardButtonTextColor}>Update Password</Text>
                                    </Button>
                                </View>
                                <View marginRight={2} marginBottom={2}>
                                    <Button isLoading={activeAction === "verification"} variant={"outline"} onPress={sendVerificationEmail}>
                                        <Text color={"gray.900"}>Send Verification</Text>
                                    </Button>
                                </View>
                                <View marginBottom={2}>
                                    <Button isLoading={activeAction === "password-reset"} variant={"outline"} onPress={sendPasswordReset}>
                                        <Text color={"gray.900"}>Send Password Reset</Text>
                                    </Button>
                                </View>
                            </View>
                        </View>
                    ) : null}

                </View>
            </ScrollView>
        </NativeBaseProvider>
    )
}

export default function MyAccount() {
    if (!isFirebaseAuthRequired) {
        return (
            <NativeBaseProvider theme={openScoreboardTheme}>
                <View backgroundColor={"gray.50"} flex={1} padding={4}>
                    <View backgroundColor={"white"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} padding={4}>
                        <Text color={"gray.900"} fontSize={"lg"} fontWeight={"bold"}>Account Disabled</Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1}>This build is running in local-only mode without Firebase Auth.</Text>
                    </View>
                </View>
            </NativeBaseProvider>
        )
    }

    return <FirebaseAccountSettings />
}

const styles = StyleSheet.create({
    profilePhotoFrame: {
        alignSelf: "center",
        backgroundColor: "#f3f4f6",
        borderRadius: 999,
        overflow: "hidden",
    },
    profileImage: {
        backgroundColor: "#f3f4f6",
        borderRadius: 999,
        height: 48,
        width: 48,
    },
});
