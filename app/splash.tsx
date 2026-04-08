import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../constants/colors";
import TextWrapper from "../components/TextWrapper";
import Animated, { FadeInDown, SlideInUp, SlideOutDown } from "react-native-reanimated";

const Splash = () => {
  const router = useRouter();
  const styles = splashStyles(colors);
  //   useEffect(() => {
  //     setTimeout(() => {
  //         if(router) {
  //             router.replace("/signup");
  //         }
  //     }, 2000);
  //   }, [router]);
  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundLight]}
      style={styles.container}
    >
      <View style={[styles.container, { rowGap: 20 }]}>
        <Animated.View entering={FadeInDown.delay(500).duration(500).springify()} exiting={SlideOutDown.delay(400).duration(200).damping(2)}>
          <TextWrapper style={styles.text}>
            Verit<TextWrapper style={styles.highlight}>y</TextWrapper>
          </TextWrapper>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(1000).duration(500).springify()} exiting={SlideOutDown.delay(700).duration(200).damping(2)}>
          <TextWrapper style={styles.subtext}>KNOW WHAT'S TRUE</TextWrapper>
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

export default Splash;

const splashStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      fontSize: 56,
      color: colors.text,
      letterSpacing: 5,
    },
    highlight: {
      fontSize: 56,
      color: colors.primary,
    },
    subtext: {
      fontSize: 18,
      color: colors.offWhite,
      letterSpacing: 3.8,
      marginTop: 10,
    },
  });
