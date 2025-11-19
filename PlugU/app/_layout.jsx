import { useEffect } from "react";
import { Slot, useRouter } from "expo-router";

export default function RootLayout() {
  const router = useRouter();

  // Must render Slot immediately (required by Expo Router)
  return <Slot />;
}
