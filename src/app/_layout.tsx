import React from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Cinzel-Bold": "https://fonts.gstatic.com/s/cinzel/v23/8v17wQtf85M18g5-Ib2GlH8.ttf",
    "Cinzel-Medium": "https://fonts.gstatic.com/s/cinzel/v23/8v17wQtf85M18g5-Ib2GlH8.ttf",
    "CormorantGaramond-SemiBold": "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3fW2Vupz3Rr-t670Ydgq8yMCg1Ky-q1-d7-g.ttf",
    "Manrope-Regular": "https://fonts.gstatic.com/s/manrope/v15/xn7_YHE3xXG0OP5G2KDj2F3o.ttf",
    "Manrope-SemiBold": "https://fonts.gstatic.com/s/manrope/v15/xn7_YHE3xXG0OP5G2KDj2F3o.ttf",
    "JetBrainsMono-SemiBold": "https://fonts.gstatic.com/s/jetbrainsmono/v18/t5nvo070ms3EXVH37t0C95c370L7vw.ttf",
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#09090B", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
