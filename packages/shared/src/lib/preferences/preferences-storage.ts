"use client";

import { setClientCookie } from "@shared/lib/cookie.client";
import { setLocalStorageValue } from "@shared/lib/local-storage.client";
import {
  getPreferencePersistence,
  type PreferenceKey,
  type PreferencePersistence,
  type PreferenceValueMap,
} from "@shared/lib/preferences/preferences-config";
import { setValueToCookie } from "@shared/server/server-actions";

async function persistByMode(mode: PreferencePersistence, key: string, value: string): Promise<void> {
  switch (mode) {
    case "none":
      return;

    case "client-cookie":
      setClientCookie(key, value);
      return;

    case "server-cookie":
      await setValueToCookie(key, value);
      return;

    case "localStorage":
      setLocalStorageValue(key, value);
      return;
  }
}

export function persistPreference<K extends PreferenceKey>(key: K, value: PreferenceValueMap[K]): Promise<void> {
  return persistByMode(getPreferencePersistence(key), key, value);
}
