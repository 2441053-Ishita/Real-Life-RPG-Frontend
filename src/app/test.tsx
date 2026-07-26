import { View, Text } from "react-native";

export default function TestScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 30 }}>TEST SCREEN</Text>
    </View>
  );
}