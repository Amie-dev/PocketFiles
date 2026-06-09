import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

type LockContextType = {
  isLocked: boolean;
  goPrivate: () => void;
  goPublic: () => void;
};

const LockContext = createContext<LockContextType | null>(null);

export function LockProvider({ children }: { children: ReactNode }) {
  // false = public mode by default
  // true = private/locked mode
  const [isLocked, setIsLocked] = useState(false);

  const goPrivate = () => {
    setIsLocked(true);
  };

  const goPublic = () => {
    setIsLocked(false);
  };

  return (
    <LockContext.Provider
      value={{
        isLocked,
        goPrivate,
        goPublic,
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