import React from "react";
import { View, TouchableOpacity, StyleSheet, Text, Dimensions } from "react-native";
import { Home, User, MessageCircle, Users, Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

const PRIMARY_COLOR = "#3F51B5";
const SECONDARY_COLOR = "#fff";

// Breakpoint — anything below 360px is "small"
const SMALL_SCREEN = Dimensions.get("window").width < 360;

const CustomNavBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter(
    (r) => !["_layout", "_sitemap", "()", "Create"].includes(r.name)
  );

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => router.push("/CreateListingScreen")}
      >
        <Plus size={SMALL_SCREEN ? 18 : 22} color={SECONDARY_COLOR} />
      </TouchableOpacity>

      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.sideGroup}>
          {renderTab(visibleRoutes[0], state, descriptors, navigation)}
          {renderTab(visibleRoutes[1], state, descriptors, navigation)}
        </View>
        <View style={styles.middleSpacer} />
        <View style={styles.sideGroup}>
          {renderTab(visibleRoutes[2], state, descriptors, navigation)}
          {renderTab(visibleRoutes[3], state, descriptors, navigation)}
        </View>
      </View>
    </View>
  );
};

const renderTab = (route, state, descriptors, navigation) => {
  if (!route) return null;

  const { options } = descriptors[route.key];
  const isFocused = state.index === state.routes.indexOf(route);

  const label =
    options?.tabBarLabel ??
    options?.title ??
    route.name.replace("/index", "").replace(/[()]/g, "");

  const onPress = () => {
    if (!isFocused) navigation.navigate(route.name);
  };

  return (
    <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem}>
      {getIcon(label, isFocused ? PRIMARY_COLOR : "#777")}
      {/* Hide labels on small screens */}
      {!SMALL_SCREEN && (
        <Text style={[styles.tabText, { color: isFocused ? PRIMARY_COLOR : "#777" }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const getIcon = (name, color) => {
  const size = SMALL_SCREEN ? 22 : 24;
  switch (name) {
    case "Home":      return <Home size={size} color={color} />;
    case "Community": return <Users size={size} color={color} />;
    case "Messages":  return <MessageCircle size={size} color={color} />;
    case "Profile":   return <User size={size} color={color} />;
    default:          return <Home size={size} color={color} />;
  }
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
  },

  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: SECONDARY_COLOR,
    paddingHorizontal: SMALL_SCREEN ? 16 : 25,
    paddingTop: SMALL_SCREEN ? 8 : 10,
    paddingBottom: 15,
    width: "100%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  sideGroup: {
    flexDirection: "row",
    gap: 0,
  },

  middleSpacer: {
    width: 0,
  },

  fabButton: {
    position: "absolute",
    bottom: 25,
    width: SMALL_SCREEN ? 46 : 55,
    height: SMALL_SCREEN ? 46 : 55,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },

  tabItem: {
    justifyContent: "center",
    alignItems: "center",
    width: SMALL_SCREEN ? 52 : 65,
  },

  tabText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
  },
});

export default CustomNavBar;