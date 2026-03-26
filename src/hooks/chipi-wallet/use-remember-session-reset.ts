"use client";

import { useEffect, useRef } from "react";

type Params = {
  rememberSessionUiOn: boolean;
  sessionPreferencesKnown: boolean;
  clearSession: () => Promise<void>;
  onTurnedOn: () => void;
  onTurnedOff: () => void;
};

export function useRememberSessionReset({
  rememberSessionUiOn,
  sessionPreferencesKnown,
  clearSession,
  onTurnedOn,
  onTurnedOff,
}: Params) {
  const prevRememberSessionUiOnRef = useRef<boolean>(rememberSessionUiOn);

  useEffect(() => {
    const prev = prevRememberSessionUiOnRef.current;
    prevRememberSessionUiOnRef.current = rememberSessionUiOn;

    if (!sessionPreferencesKnown) return;

    if (!prev && rememberSessionUiOn) {
      onTurnedOn();
    }

    if (rememberSessionUiOn) return;

    void clearSession();
    onTurnedOff();
  }, [
    rememberSessionUiOn,
    sessionPreferencesKnown,
    clearSession,
    onTurnedOn,
    onTurnedOff,
  ]);
}

