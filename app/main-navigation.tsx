import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const MainNavigation = () => {
  return (
    <Stack.Protected guard={true}>
      <Stack.Screen name="signup" options={{ headerShown: false }} />
    </Stack.Protected>
  );
};

export default MainNavigation;

const styles = StyleSheet.create({});
