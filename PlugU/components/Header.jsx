import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import {hp, wp } from "../helpers/dimensions"

const Header = ({ title = "Header", showBack = true, onBackPress }) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back(); 
    }
  };

  return (
    <View style={styles.container}>
      {showBack && (
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 24 }} /> 
      {/* spacer for symmetry */}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flexWrap:"wrap",
    borderTopLeftRadius: hp(3),
    borderTopRightRadius: hp(3),

  },
  backButton: {
    padding: 4,
    backgroundColor:"#ccc", 
    borderRadius: wp(2)
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
});
