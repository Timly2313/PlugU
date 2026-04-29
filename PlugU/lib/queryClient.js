import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─────────────────────────────────────────────────────────────────────────────
// WHY we don't call persistQueryClient() here anymore:
//
// persistQueryClient() is async — it starts restoring the cache AFTER the
// first render, so components mount, see an empty cache, and fire DB calls.
//
// The fix is PersistQueryClientProvider in _layout.jsx. It waits for the
// cache to be fully restored from AsyncStorage BEFORE rendering children,
// so queries see warm cache on the very first mount and never hit the DB
// if data is still fresh (staleTime: 5 min).
// ─────────────────────────────────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // treat cached data as fresh for 5 min
      gcTime: 24 * 60 * 60 * 1000,  // keep in storage for 24 hr
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,         // never refetch just because screen mounted
      refetchOnReconnect: false,     // don't auto-refetch on network reconnect
    },
  },
});

export const asyncPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "TANSTACK_QUERY_CACHE",
  throttleTime: 1000,
});

// ─────────────────────────────────────────────────────────────────────────────
// MMKV swap (after `npx expo prebuild --clean && npx expo run:android`):
//
// import { MMKV } from "react-native-mmkv";
// import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
//
// export const mmkv = new MMKV({ id: "query-cache" });
// export const asyncPersister = createSyncStoragePersister({
//   storage: {
//     getItem:    (key) => mmkv.getString(key) ?? null,
//     setItem:    (key, value) => mmkv.set(key, value),
//     removeItem: (key) => mmkv.delete(key),
//   },
//   key: "TANSTACK_QUERY_CACHE",
// });
// ─────────────────────────────────────────────────────────────────────────────