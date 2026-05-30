import React from 'react';
import { NativeBaseProvider, Button, FormControl, Input, ScrollView, Text, View } from 'native-base';
import {
    loginToFirebase,
    loginToFirebaseWithGoogle,
    registerToFirebase,
    sendFirebasePasswordResetEmail,
} from '../database';
import {
    openScoreboardButtonTextColor,
    openScoreboardColor,
    openScoreboardTheme,
} from "../openscoreboardtheme";

function getAuthErrorMessage(err) {
    switch (err?.code) {
        case "auth/invalid-email":
            return "Enter a valid email address.";
        case "auth/user-not-found":
        case "auth/wrong-password":
            return "Invalid email or password.";
        case "auth/email-already-in-use":
            return "An account already exists for this email.";
        case "auth/weak-password":
            return "Password must be at least 6 characters.";
        default:
            return err?.message || "Something went wrong.";
    }
}

export default function Login() {
    const [isCreatingAccount, setIsCreatingAccount] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const normalizedEmail = email.trim();

    const clearMessages = () => {
        setMessage("");
        setErrorMessage("");
    }

    const handleEmailSubmit = async () => {
        clearMessages();

        if (!normalizedEmail || !password) {
            setErrorMessage("Enter your email and password.");
            return;
        }

        if (isCreatingAccount && password !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);

        try {
            if (isCreatingAccount) {
                const result = await registerToFirebase(normalizedEmail, password);

                if (result?.error) {
                    setErrorMessage(result.errorMessage);
                }
                else {
                    setPassword("");
                    setConfirmPassword("");
                    setMessage("Account created. Check your email to verify your address, then sign in.");
                    setIsCreatingAccount(false);
                }
            }
            else {
                const result = await loginToFirebase(normalizedEmail, password);

                if (result?.error || result?.success === false) {
                    setErrorMessage(result.errorMessage || "Unable to sign in.");
                }
            }
        }
        catch (err) {
            setErrorMessage(getAuthErrorMessage(err));
        }
        finally {
            setIsSubmitting(false);
        }
    }

    const handleGoogleSignIn = async () => {
        clearMessages();
        setIsSubmitting(true);

        try {
            const result = await loginToFirebaseWithGoogle();

            if (result?.error || result?.success === false) {
                setErrorMessage(result.errorMessage || "Unable to sign in with Google.");
            }
        }
        catch (err) {
            setErrorMessage(getAuthErrorMessage(err));
        }
        finally {
            setIsSubmitting(false);
        }
    }

    const handlePasswordReset = async () => {
        clearMessages();

        if (!normalizedEmail) {
            setErrorMessage("Enter your email address first.");
            return;
        }

        setIsSubmitting(true);

        try {
            await sendFirebasePasswordResetEmail(normalizedEmail);
            setMessage("Password reset email sent.");
        }
        catch (err) {
            setErrorMessage(getAuthErrorMessage(err));
        }
        finally {
            setIsSubmitting(false);
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
                        maxW={420}
                        padding={5}
                        width={"100%"}
                    >
                        <Text color={openScoreboardColor} fontSize={"3xl"} fontWeight={"bold"} textAlign={"center"}>
                            Open Scoreboard
                        </Text>
                        <Text color={"gray.600"} fontSize={"sm"} marginTop={1} textAlign={"center"}>
                            {isCreatingAccount ? "Create your account." : "Sign in to continue."}
                        </Text>

                        <View marginTop={5}>
                            <FormControl marginBottom={3}>
                                <FormControl.Label>Email</FormControl.Label>
                                <Input
                                    autoCapitalize={"none"}
                                    autoCorrect={false}
                                    keyboardType={"email-address"}
                                    onChangeText={setEmail}
                                    value={email}
                                />
                            </FormControl>

                            <FormControl marginBottom={3}>
                                <FormControl.Label>Password</FormControl.Label>
                                <Input
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    value={password}
                                />
                            </FormControl>

                            {isCreatingAccount ? (
                                <FormControl marginBottom={3}>
                                    <FormControl.Label>Confirm Password</FormControl.Label>
                                    <Input
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                        value={confirmPassword}
                                    />
                                </FormControl>
                            ) : null}

                            {errorMessage ? (
                                <Text color={"red.700"} fontSize={"sm"} marginBottom={3}>{errorMessage}</Text>
                            ) : null}
                            {message ? (
                                <Text color={"gray.600"} fontSize={"sm"} marginBottom={3}>{message}</Text>
                            ) : null}

                            <Button isLoading={isSubmitting} onPress={handleEmailSubmit}>
                                <Text color={openScoreboardButtonTextColor}>
                                    {isCreatingAccount ? "Create Account" : "Sign In"}
                                </Text>
                            </Button>

                            <Button
                                isDisabled={isSubmitting}
                                marginTop={3}
                                onPress={handleGoogleSignIn}
                                variant={"outline"}
                            >
                                <Text color={"gray.900"}>Continue with Google</Text>
                            </Button>

                            {!isCreatingAccount ? (
                                <Button
                                    isDisabled={isSubmitting}
                                    marginTop={2}
                                    onPress={handlePasswordReset}
                                    variant={"ghost"}
                                >
                                    <Text color={"gray.700"}>Forgot password?</Text>
                                </Button>
                            ) : null}

                            <Button
                                isDisabled={isSubmitting}
                                marginTop={2}
                                onPress={() => {
                                    clearMessages();
                                    setIsCreatingAccount(!isCreatingAccount);
                                }}
                                variant={"ghost"}
                            >
                                <Text color={"gray.700"}>
                                    {isCreatingAccount ? "Already have an account? Sign in" : "Need an account? Create one"}
                                </Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </NativeBaseProvider>
    )
}
