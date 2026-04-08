import { StyleSheet, Text, View } from "react-native";
import React from "react";

interface TextWrapperProps {
  children: React.ReactNode;
  style?: any;
}

const TextWrapper = ({ children, style }: TextWrapperProps) => {
  return <Text style={[styles.text, style]}>{children}</Text>;
};

export default TextWrapper;

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontFamily: "Roboto-Light",
    color: "#F0F4F8",
  }
});
