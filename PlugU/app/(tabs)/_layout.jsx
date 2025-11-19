// app/(tabs)/_layout.js
import { Tabs } from "expo-router";
import CustomNavBar from "../../components/CustomNavBar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomNavBar {...props} />}
    >
      <Tabs.Screen name="HomeScreen" options={{ title: "Market" }} />
      <Tabs.Screen name="MessagesScreen" options={{ title: "Messages" }} />
      <Tabs.Screen name="CommunityScreen" options={{ title: "Community" }} />
    
      <Tabs.Screen name="ProfileScreen" options={{ title: "Profile" }} />
    </Tabs>
  );
}
