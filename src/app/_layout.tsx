import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { requestNotificationPermission } from "@/utils/notifications";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import DailyResetService from "@/services/dailyResetService";

export default function RootLayout() {
  useEffect(() => {
    // Requirement 1: Ask notification permission on launch
    requestNotificationPermission();

    // Requirement 3: Invoke DailyResetService after Firebase Auth is ready
    if (auth.currentUser) {
      DailyResetService.checkAndPerformDailyReset(auth.currentUser.uid);
    }

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        DailyResetService.checkAndPerformDailyReset(user.uid);
      }
    });

    return () => unsubAuth();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}