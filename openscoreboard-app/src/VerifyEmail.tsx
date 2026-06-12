import React from 'react';
import { Button, NativeBaseProvider, ScrollView, Text, View } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    getCurrentUser,
    reloadCurrentUser,
    sendCurrentUserEmailVerification,
    signOut,
} from '../database';
import {
    openScoreboardButtonTextColor,
    openScoreboardColor,
    openScoreboardTheme,
} from '../openscoreboardtheme';

function getVerificationErrorMessage(err) {
    switch (err?.code) {
        case "auth/too-many-requests":
            return "Firebase is limiting verification email requests right now. Wait a few minutes and try again.";
        case "auth/user-token-expired":
        case "auth/user-not-found":
            return "Your session expired. Sign in again to send another verification email.";
        default:
            return err?.message || "Something went wrong.";
    }
}

export default function VerifyEmail({ onVerified }: any) {
    const [userEmail, setUserEmail] = React.useState(getCurrentUser()?.email || "");
    const [message, setMessage] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState("");
    const [activeAction, setActiveAction] = React.useState("");
    const hasCompletedVerification = React.useRef(false);

    React.useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const signOutOnPageExit = () => {
            if (!hasCompletedVerification.current) {
                signOut();
            }
        };

        window.addEventListener("pagehide", signOutOnPageExit);
        window.addEventListener("beforeunload", signOutOnPageExit);

        return () => {
            window.removeEventListener("pagehide", signOutOnPageExit);
            window.removeEventListener("beforeunload", signOutOnPageExit);
        };
    }, []);

    async function sendVerificationEmail() {
        setMessage("");
        setErrorMessage("");
        setActiveAction("send");

        try {
            await sendCurrentUserEmailVerification();
            setMessage("Verification email sent. Check your inbox, then come back and confirm verification.");
        }
        catch (err) {
            setErrorMessage(getVerificationErrorMessage(err));
        }
        finally {
            setActiveAction("");
        }
    }

    async function checkVerificationStatus() {
        setMessage("");
        setErrorMessage("");
        setActiveAction("check");

        try {
            const refreshedUser = await reloadCurrentUser();
            setUserEmail(refreshedUser?.email || userEmail);

            if (refreshedUser?.emailVerified) {
                hasCompletedVerification.current = true;
                setMessage("Email verified. Opening Open Scoreboard.");
                if (typeof onVerified === "function") {
                    await onVerified(refreshedUser);
                }
                return;
            }

            setErrorMessage("That email address is not verified yet. Open the verification link from your email, then try again.");
        }
        catch (err) {
            setErrorMessage(getVerificationErrorMessage(err));
        }
        finally {
            setActiveAction("");
        }
    }

    async function handleSignOut() {
        hasCompletedVerification.current = true;
        setActiveAction("signout");

        try {
            await signOut();
        }
        finally {
            setActiveAction("");
        }
    }

    return (
        <NativeBaseProvider theme={openScoreboardTheme}>
            <ScrollView backgroundColor={"gray.50"} contentContainerStyle={{ flexGrow: 1 }}>
                <View
                    alignItems={"center"}
                    justifyContent={"center"}
                    minHeight={"100%"}
                    padding={4}
                    width={"100%"}
                >
                    <View
                        backgroundColor={"white"}
                        borderColor={"gray.200"}
                        borderRadius={8}
                        borderWidth={1}
                        maxW={460}
                        padding={5}
                        width={"100%"}
                    >
                        <View
                            alignItems={"center"}
                            alignSelf={"center"}
                            backgroundColor={"blue.50"}
                            borderColor={"blue.100"}
                            borderRadius={8}
                            borderWidth={1}
                            height={54}
                            justifyContent={"center"}
                            marginBottom={4}
                            width={54}
                        >
                            <MaterialCommunityIcons name="email-check-outline" size={30} color={openScoreboardColor} />
                        </View>

                        <Text color={"gray.900"} fontSize={"2xl"} fontWeight={"bold"} textAlign={"center"}>
                            Verify your email
                        </Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={2} textAlign={"center"}>
                            Your account exists, but this email/password login needs a verified email before it can access Open Scoreboard.
                        </Text>

                        {userEmail ? (
                            <View backgroundColor={"gray.50"} borderColor={"gray.200"} borderRadius={8} borderWidth={1} marginTop={4} padding={3}>
                                <Text color={"gray.500"} fontSize={"2xs"} fontWeight={"bold"} textTransform={"uppercase"}>
                                    Email
                                </Text>
                                <Text color={"gray.900"} fontSize={"md"} fontWeight={"bold"} marginTop={1}>
                                    {userEmail}
                                </Text>
                            </View>
                        ) : null}

                        {message ? (
                            <View backgroundColor={"green.50"} borderColor={"green.200"} borderRadius={8} borderWidth={1} marginTop={4} padding={3}>
                                <Text color={"green.800"} fontSize={"sm"} fontWeight={"bold"}>{message}</Text>
                            </View>
                        ) : null}

                        {errorMessage ? (
                            <View backgroundColor={"red.50"} borderColor={"red.200"} borderRadius={8} borderWidth={1} marginTop={4} padding={3}>
                                <Text color={"red.800"} fontSize={"sm"} fontWeight={"bold"}>{errorMessage}</Text>
                            </View>
                        ) : null}

                        <Button
                            backgroundColor={openScoreboardColor}
                            borderRadius={8}
                            isLoading={activeAction === "send"}
                            marginTop={5}
                            onPress={sendVerificationEmail}
                        >
                            <Text color={openScoreboardButtonTextColor} fontWeight={"bold"}>Send Verification Email</Text>
                        </Button>

                        <Button
                            borderRadius={8}
                            isLoading={activeAction === "check"}
                            marginTop={3}
                            onPress={checkVerificationStatus}
                            variant={"outline"}
                        >
                            <Text color={openScoreboardColor} fontWeight={"bold"}>I Verified My Email</Text>
                        </Button>

                        <Button
                            borderRadius={8}
                            isLoading={activeAction === "signout"}
                            marginTop={2}
                            onPress={handleSignOut}
                            variant={"ghost"}
                        >
                            <Text color={"gray.700"} fontWeight={"bold"}>Sign Out</Text>
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </NativeBaseProvider>
    );
}
