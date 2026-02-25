import React from "react";
import { View, Text, Button, TouchableOpacity, Image, StyleSheet, Dimensions } from "react-native";
import { useAuth } from "../context/authContext";

const { width } = Dimensions.get("window");

export default function LocationPermissionScreen() {
  const { requestLocationPermission } = useAuth();

  return (
    <View style={styles.container}>
      {/* Big Icon/Image */}
      <Image
        source={require("../assets/images/location-icon.png")} 
        style={styles.icon}
        resizeMode="contain"
      />

      {/* Message */}
      <Text style={styles.message}>
        PlugU requires location access to show listings near you.
      </Text>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Rounded Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={requestLocationPermission}
      >
        <Text style={styles.buttonText}>Enable Location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#f4fafdff",
  },
  icon: {
    width: width * 0.6, // 60% of screen width
    height: width * 0.6, // Keep it square
    marginTop: 80,
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 40,
    color: "#333",
  },
  button: {
    width: "100%",
    backgroundColor: "#3F51B5", 
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
