import { Text, TextProps, StyleSheet } from "react-native";
import { Colors, FontSize } from "@/theme";

interface AppTextProps extends TextProps {
  variant?: "title" | "subtitle" | "body";
}

export default function AppText({
  variant = "body",
  style,
  children,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        styles.base,
        variant === "title" && styles.title,
        variant === "subtitle" && styles.subtitle,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.white,
    fontSize: FontSize.md,
  },

  title: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
});