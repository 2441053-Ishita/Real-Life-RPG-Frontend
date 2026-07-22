import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function OnboardingScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "black",
      }}
    >
      <TouchableOpacity
        style={{
          backgroundColor: "red",
          padding: 20,
        }}
        onPress={() => {
          alert("Working");
          router.push("/login");
        }}
      >
        <Text style={{ color: "white" }}>CLICK ME</Text>
      </TouchableOpacity>
    </View>
  );
}