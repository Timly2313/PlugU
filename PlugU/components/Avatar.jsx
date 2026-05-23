import React, { useState } from "react";
import { View, Image, Text, StyleSheet } from "react-native";

export default function Avatar({
  uri,
  size = 50,
  borderColor = "#fff",
  borderWidth = 2,
  initials,   // explicit initials take priority
  name,       // fallback: derive initial from name
  style,      // extra style for positioning (used by community components)
}) {
  const [failed, setFailed] = useState(false);

  // Resolve what letter to show: explicit initials → first letter of name → "U"
  const fallbackText = initials
    || (name ? name[0].toUpperCase() : null)
    || "U";

  const showFallback = !uri || failed;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
          borderWidth,
        },
        style,
      ]}
    >
      {showFallback ? (
        <View
          style={[
            styles.initialsContainer,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initialsText, { fontSize: size * 0.38 }]}>
            {fallbackText}
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsContainer: {
    backgroundColor: "#3F51B5",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    color: "#fff",
    fontWeight: "600",
  },
});