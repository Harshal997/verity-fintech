import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
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
import FormInput from "../../components/FormInput";

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

  const handleSignIn = async () => {
    console.log("Signing in with:", { email: form.email });
    if (validateForm()) {
      await signIn(form.email, form.password);
      console.log("Sign-in successful, navigating to main app...");
    } else {
      console.log("Validation failed. Please check the form for errors.");
    }
  };

  const handleSignUp = async () => {
    if (validateForm()) {
      await signUp(form.email, form.password, form.fullName, form.mobileNumber);
      console.log("Sign-up successful, navigating to main app...");
    } else {
      console.log("Validation failed. Please check the form for errors.");
    }
  };

  useEffect(() => {
    if (error) {
      console.log("Authentication error:", error);
      setAlertVisible(true);
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
      setAlertVisible(true);
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
                <FormInput
                  label="FULL NAME"
                  placeholder="Anita Desai"
                  keyboardType="email-address"
                  value={form.fullName}
                  onChangeText={(text) => handleChange("fullName", text)}
                  onFocus={() => handleFocus("fullName", true)}
                  onBlur={() => handleFocus("fullName", false)}
                  errors={errors}
                  focused={focused}
                />
              </View>
            )}
            <View style={{ marginTop: 12, rowGap: 5 }}>
              <FormInput
                label="EMAIL"
                placeholder="you@example.com"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(text) => handleChange("email", text)}
                onFocus={() => handleFocus("email", true)}
                onBlur={() => handleFocus("email", false)}
                errors={errors}
                focused={focused}
              />
            </View>
            {signUpMode && (
              <View style={{ marginTop: 12, rowGap: 5 }}>
                <FormInput
                  label="MOBILE NUMBER"
                  placeholder="+91 98765 43210"
                  keyboardType="phone-pad"
                  value={form.mobileNumber}
                  onChangeText={(text) => handleChange("mobileNumber", text)}
                  onFocus={() => handleFocus("mobileNumber", true)}
                  onBlur={() => handleFocus("mobileNumber", false)}
                  errors={errors}
                  focused={focused}
                />
              </View>
            )}
            <View style={{ marginTop: 12, rowGap: 5 }}>
              <FormInput
                label="PASSWORD"
                placeholder="........"
                keyboardType="email-address"
                value={form.password}
                onChangeText={(text) => handleChange("password", text)}
                onFocus={() => handleFocus("password", true)}
                onBlur={() => handleFocus("password", false)}
                errors={errors}
                focused={focused}
              />
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
