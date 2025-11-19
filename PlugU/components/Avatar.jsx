import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";

export default function Avatar({ 
  uri, 
  size = 50, 
  borderColor = "#fff", 
  borderWidth = 2, 
  initials 
}) {
  return (
    <View
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: borderColor,
          borderWidth: borderWidth,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.initialsContainer, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initialsText, { fontSize: size / 2 }]}>{initials || "U"}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    overflow: "hidden",
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsContainer: {
    backgroundColor: "#888",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    color: "#fff",
    fontWeight: "600",
  },
});
