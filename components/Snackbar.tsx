import { StyleSheet, Text, View } from "react-native";
import React from "react";
import TextWrapper from "./TextWrapper";
import { colors } from "../constants/colors";
import { Snackbar } from "react-native-paper";
import { AntDesign } from "@expo/vector-icons";

interface SnackbarProps {
  visible: boolean;
  duration?: number;
  style?: any;
  message: string;
  textStyle?: any;
  iconColor?: string;
  clearError?: () => void;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const SnackbarComp = ({
  visible,
  duration,
  style,
  message,
  textStyle,
  iconColor,
  setIsVisible,
  clearError,
}: any) => {
  return (
    <Snackbar
      visible={visible}
      duration={duration ?? 3000}
      style={style}
      onDismiss={() => {
        setIsVisible(false);
        if (clearError) clearError();
      }}
      action={{
        label: "",
        labelStyle: { display: "none" },
        icon: () => <AntDesign name="close" size={16} color={iconColor ?? "#FFF"} />,
        onPress: () => {
          setIsVisible(false);
          if (clearError) clearError();
        },
      }}
    >
      <TextWrapper style={textStyle}>{message}</TextWrapper>
    </Snackbar>
  );
};

export default SnackbarComp;

const styles = StyleSheet.create({});
