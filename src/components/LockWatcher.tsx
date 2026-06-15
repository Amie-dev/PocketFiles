import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useLock } from "@/context/LockProvider";

export function LockWatcher() {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const { lock } = useLock();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasActive = appState.current === "active";
      const goingBackground =
        nextState === "inactive" || nextState === "background";

      if (wasActive && goingBackground) {
        lock();
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [lock]);

  return null;
}