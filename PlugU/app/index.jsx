import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from "react-native";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.replace("/LoginScreen");
  };

  return (
    <ImageBackground
      source={require("..//assets/images/bg.jpg")} 
      style={styles.background}
      resizeMode="cover"
    >
      {/* Indigo overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to PlugU</Text>
        <Text style={styles.subtitle}>
          The student marketplace where you connect, buy, and sell on campus.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "flex-end", 
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22, 26, 51, 0.8)", 
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#eee",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
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
