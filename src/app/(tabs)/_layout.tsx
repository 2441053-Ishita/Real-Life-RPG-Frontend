import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="quests" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="character" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}