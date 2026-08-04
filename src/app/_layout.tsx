import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { requestNotificationPermission } from "@/utils/notifications";

export default function RootLayout() {
  useEffect(() => {
    // Requirement 1: Ask notification permission on launch
    requestNotificationPermission();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}