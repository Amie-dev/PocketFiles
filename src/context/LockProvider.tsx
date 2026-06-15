import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const MODE_KEY = "pocketfiles_mode";

type LockContextType = {
  isPrivate: boolean;
  isLocked: boolean;
  isReady: boolean;
  goPrivate: () => Promise<void>;
  goPublic: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
};

const LockContext = createContext<LockContextType | null>(null);

export function LockProvider({ children }: { children: ReactNode }) {
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadMode() {
      const savedMode = await AsyncStorage.getItem(MODE_KEY);

      if (savedMode === "private") {
        setIsPrivate(true);
        setIsLocked(false);
      }

      setIsReady(true);
    }

    loadMode();
  }, [isLocked,isPrivate]);

  async function goPrivate() {
    setIsPrivate(true);
    setIsLocked(false);
    await AsyncStorage.setItem(MODE_KEY, "private");
  }

  async function goPublic() {
    setIsPrivate(false);
    setIsLocked(false);
    await AsyncStorage.setItem(MODE_KEY, "public");
  }

  function lock() {
    setIsLocked(true);
  }

  function unlock() {
    setIsLocked(false);
  }

  return (
    <LockContext.Provider
      value={{
        isPrivate,
        isLocked,
        isReady,
        goPrivate,
        goPublic,
        lock,
        unlock,
      }}
    >
      {children}
    </LockContext.Provider>
  );
}

export function useLock() {
  const context = useContext(LockContext);

  if (!context) {
    throw new Error("useLock must be used inside LockProvider");
  }

  return context;
}