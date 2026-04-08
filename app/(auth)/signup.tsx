import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/colors";
import TextWrapper from "../../components/TextWrapper";
import { SafeAreaView } from "react-native-safe-area-context";
import { triggerHaptic } from "../../utils/haptic";
import { useAuthStore } from "../../store/authStore";
import {
  validateEmail,
  validateFullName,
  validateMobile,
  validatePassword,
} from "../../utils/validateForm";
import SnackbarComp from "../../components/Snackbar";
import { getErrorMessage } from "../../constants/error";

const Signup = () => {
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    mobileNumber: "",
    password: "",
  });
  const [focused, setFocused] = useState({
    email: false,
    fullName: false,
    mobileNumber: false,
    password: false,
  });
  const [errors, setErrors] = useState({
    email: "",
    fullName: "",
    mobileNumber: "",
    password: "",
  });
  const [signUpMode, setSignUpMode] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const { signIn, signUp, loading, error, clearError } = useAuthStore();

  // on "Continue" press for sign in:
  const handleSignIn = async () => {
    console.log("Signing in with:", { email: form.email });
    if (validateForm()) {
      await signIn(form.email, form.password);
      console.log("Sign-in successful, navigating to main app...");
    } else {
      console.log("Validation failed. Please check the form for errors.");
    }
  };

  // on "Create account" press:
  const handleSignUp = async () => {
    if (validateForm()) {
      await signUp(form.email, form.password, form.fullName, form.mobileNumber);
      console.log("Sign-up successful, navigating to main app...");
    } else {
      console.log("Validation failed. Please check the form for errors.");
    }
  };

  // show error if present:
  useEffect(() => {
    if (error) {
      // show your error UI, then:
      // clearError() after user dismisses
      console.log("Authentication error:", error);
      setAlertVisible(true);
      //   clearError();
    }
  }, [error]);

  const styles = authStyles(colors);

  const handleButtonClick = async () => {
    triggerHaptic();
    try {
      if (signUpMode) {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (err) {
      // handle error, maybe set some local error state to show in UI
      console.error("Authentication error:", err);
    }
  };

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFocus = (key: string, value: boolean) => {
    setFocused((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {
      email: validateEmail(form.email),
      fullName: signUpMode ? validateFullName(form.fullName) : "",
      mobileNumber: signUpMode ? validateMobile(form.mobileNumber) : "",
      password: validatePassword(form.password),
    };

    setErrors(newErrors);

    // check if no errors
    return Object.values(newErrors).every((err) => err === "");
  };

  return (
    <LinearGradient colors={["#111820", "#1A2330"]} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <SnackbarComp
          message={getErrorMessage(error!) ?? ""}
          visible={alertVisible}
          setIsVisible={setAlertVisible}
          clearError={() => clearError()}
          iconColor="#FFF"
          style={styles.snackbar}
          textStyle={{ color: "#FFF" }}
        />
        <ScrollView style={{ flexGrow: 1, paddingBottom: 16 }}>
          <View style={styles.brandTextContainer}>
            <TextWrapper style={styles.brandText}>VERITY</TextWrapper>
            <TextWrapper style={styles.brandText}> . </TextWrapper>
            <TextWrapper style={styles.brandText}>FINANCE</TextWrapper>
          </View>
          <View style={{ marginTop: 12, rowGap: 5 }}>
            <TextWrapper style={styles.headingText}>See your money</TextWrapper>
            <TextWrapper
              style={[styles.headingText, { color: colors.primaryLight }]}
            >
              clearly.
            </TextWrapper>
            <View style={{ marginTop: 12, rowGap: 5 }}>
              <TextWrapper style={styles.subheadingText}>
                No dashboards you ignore.
              </TextWrapper>
              <TextWrapper style={styles.subheadingText}>
                Just truth about where it goes.
              </TextWrapper>
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => {
                setSignUpMode(false);
                Keyboard.dismiss();
              }}
            >
              <TextWrapper
                style={[styles.buttonText, { opacity: signUpMode ? 0.3 : 1 }]}
              >
                Sign In
              </TextWrapper>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSignUpMode(true);
                Keyboard.dismiss();
              }}
            >
              <TextWrapper
                style={[styles.buttonText, { opacity: signUpMode ? 1 : 0.3 }]}
              >
                Sign Up
              </TextWrapper>
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            {signUpMode && (
              <View style={{ rowGap: 5 }}>
                <TextWrapper
                  style={[
                    styles.subheadingText,
                    { fontSize: 16, opacity: 0.5, letterSpacing: 1 },
                  ]}
                >
                  FULL NAME
                </TextWrapper>
                <TextInput
                  onFocus={() => handleFocus("fullName", true)}
                  onBlur={() => handleFocus("fullName", false)}
                  placeholder="Anita Desai"
                  value={form.fullName}
                  onChangeText={(text) => handleChange("fullName", text)}
                  style={[
                    styles.input,
                    {
                      borderWidth: focused.fullName ? 1 : 0,
                      borderColor: colors.primary,
                    },
                  ]}
                  placeholderTextColor={colors.darkGrey}
                />
                {errors.fullName && (
                  <TextWrapper style={{ color: colors.error, marginTop: 4 }}>
                    {errors.fullName}
                  </TextWrapper>
                )}
              </View>
            )}
            <View style={{ marginTop: 12, rowGap: 5 }}>
              <TextWrapper
                style={[
                  styles.subheadingText,
                  { fontSize: 16, opacity: 0.5, letterSpacing: 1 },
                ]}
              >
                EMAIL
              </TextWrapper>
              <TextInput
                onFocus={() => handleFocus("email", true)}
                onBlur={() => handleFocus("email", false)}
                placeholder="you@example.com"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(text) => handleChange("email", text)}
                autoCapitalize="none"
                style={[
                  styles.input,
                  {
                    borderWidth: focused.email ? 1 : 0,
                    borderColor: colors.primary,
                  },
                ]}
                placeholderTextColor={colors.darkGrey}
              />
              {errors.email && (
                <TextWrapper style={{ color: colors.error, marginTop: 4 }}>
                  {errors.email}
                </TextWrapper>
              )}
            </View>
            {signUpMode && (
              <View style={{ marginTop: 12, rowGap: 5 }}>
                <TextWrapper
                  style={[
                    styles.subheadingText,
                    { fontSize: 16, opacity: 0.5, letterSpacing: 1 },
                  ]}
                >
                  MOBILE NUMBER
                </TextWrapper>
                <TextInput
                  onFocus={() => handleFocus("mobileNumber", true)}
                  onBlur={() => handleFocus("mobileNumber", false)}
                  placeholder="+91 98765 43210"
                  keyboardType="phone-pad"
                  value={form.mobileNumber}
                  onChangeText={(text) => handleChange("mobileNumber", text)}
                  style={[
                    styles.input,
                    {
                      borderWidth: focused.mobileNumber ? 1 : 0,
                      borderColor: colors.primary,
                    },
                  ]}
                  placeholderTextColor={colors.darkGrey}
                />
                {errors.mobileNumber && (
                  <TextWrapper style={{ color: colors.error, marginTop: 4 }}>
                    {errors.mobileNumber}
                  </TextWrapper>
                )}
              </View>
            )}
            <View style={{ marginTop: 12, rowGap: 5 }}>
              <TextWrapper
                style={[
                  styles.subheadingText,
                  { fontSize: 16, opacity: 0.5, letterSpacing: 1 },
                ]}
              >
                PASSWORD
              </TextWrapper>
              <TextInput
                onFocus={() => handleFocus("password", true)}
                onBlur={() => handleFocus("password", false)}
                placeholder="........"
                value={form.password}
                onChangeText={(text) => handleChange("password", text)}
                style={[
                  styles.input,
                  {
                    borderWidth: focused.password ? 1 : 0,
                    borderColor: colors.primary,
                  },
                ]}
                placeholderTextColor={colors.darkGrey}
                secureTextEntry
              />
              {errors.password && (
                <TextWrapper style={{ color: colors.error, marginTop: 4 }}>
                  {errors.password}
                </TextWrapper>
              )}
            </View>
          </View>
          {loading ? (
            <ActivityIndicator
              animating={true}
              size={24}
              color={colors.primary}
              style={{ marginTop: 32 }}
            />
          ) : (
            <TouchableOpacity
              onPress={handleButtonClick}
              style={styles.submitButton}
            >
              <TextWrapper style={[styles.buttonText, { color: colors.text }]}>
                {signUpMode ? "Sign Up" : "Submit"}
              </TextWrapper>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Signup;

const authStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 8,
      width: "100%",
      backgroundColor: colors.background,
    },
    brandTextContainer: {
      flexDirection: "row",
      columnGap: 10,
      alignItems: "center",
    },
    brandText: {
      fontSize: 18,
      letterSpacing: 3,
      color: colors.primaryLight,
    },
    headingText: {
      fontSize: 32,
      fontFamily: "Roboto-Medium",
    },
    subheadingText: {
      fontSize: 20,
      color: colors.offWhite,
    },
    buttonContainer: {
      flexDirection: "row",
      marginTop: 32,
      justifyContent: "space-around",
    },
    buttonText: {
      fontSize: 18,
      fontFamily: "Roboto-Medium",
      color: colors.primary,
    },
    inputContainer: {
      marginTop: 32,
    },
    input: {
      backgroundColor: colors.backgroundLight,
      height: 60,
      color: colors.text,
      letterSpacing: 2,
      fontSize: 18,
      padding: 12,
      borderRadius: 8,
    },
    submitButton: {
      backgroundColor: colors.primaryLight,
      height: 60,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 32,
    },
    snackbar: {
      zIndex: 3,
      width: "90%",
      position: "absolute",
      bottom: 16,
      alignSelf: "center",
      backgroundColor: colors.error,
    },
  });
