import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Splash from "./splash";
import { useFonts } from "expo-font";
import { SplashScreen, useRouter } from "expo-router";

export default function index() {
  const router = useRouter();
  SplashScreen.preventAutoHideAsync();
  const [loaded] = useFonts({
    "Roboto-ExtraLight": require("../assets/fonts/Roboto-ExtraLight.ttf"),
    "Roboto-Light": require("../assets/fonts/Roboto-Light.ttf"),
    "Roboto-Thin": require("../assets/fonts/Roboto-Thin.ttf"),
    "Roboto-Regular": require("../assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Medium": require("../assets/fonts/Roboto-Medium.ttf"),
    "Roboto-SemiBold": require("../assets/fonts/Roboto-SemiBold.ttf"),
    "Roboto-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
    "Roboto-Black": require("../assets/fonts/Roboto-Black.ttf"),
    "Roboto-MediumItalic": require("../assets/fonts/Roboto-MediumItalic.ttf"),
  });
  console.log("Loaded fonts:", loaded);

  useEffect(() => {
    // if (loaded) {
    //   setTimeout(() => {
    //     SplashScreen.hideAsync();
    //   router.replace("/signup");
    //   },2000);
    // }
  }, [loaded]);

  return (
    <View style={styles.container}>
      <Splash />
      {/* <MainNavigation /> */}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
