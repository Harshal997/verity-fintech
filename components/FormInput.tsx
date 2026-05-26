import { StyleSheet, Text, TextInput, View } from "react-native";
import React from "react";
import TextWrapper from "./TextWrapper";
import { colors } from "../constants/colors";

interface FormInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  secureTextEntry?: boolean;
  focused?: any;
  errors?: any;
}

const FormInput = (props: FormInputProps) => {
  return (
    <>
      <TextWrapper
        style={[
          styles.subheadingText,
          { fontSize: 16, opacity: 0.5, letterSpacing: 1 },
        ]}
      >
        {props.label}
      </TextWrapper>
      <TextInput
        onFocus={() => props.onFocus?.()}
        onBlur={() => props.onBlur?.()}
        placeholder={props.placeholder}
        keyboardType={props.keyboardType || "default"}
        value={props.value}
        onChangeText={(text) => props.onChangeText(text)}
        autoCapitalize="none"
        secureTextEntry={props.secureTextEntry || false}
        style={[
          styles.input,
          {
            borderWidth: props.focused?.email ? 1 : 0,
            borderColor: colors.primary,
          },
        ]}
        placeholderTextColor={colors.darkGrey}
      />
      {props.errors?.email && (
        <TextWrapper style={{ color: colors.error, marginTop: 4 }}>
          {props.errors?.email}
        </TextWrapper>
      )}
    </>
  );
};

export default FormInput;

const styles = StyleSheet.create({
  headingText: {
    fontSize: 32,
    fontFamily: "Roboto-Medium",
  },
  subheadingText: {
    fontSize: 20,
    color: colors.offWhite,
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
});
