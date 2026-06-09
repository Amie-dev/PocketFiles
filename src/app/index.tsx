import { useLock } from "@/context/LockProvider";
import { Redirect } from "expo-router";

export default function Index() {
  const { isLocked } = useLock();

  if (isLocked) {
    return <Redirect href="/(locktabs)" />;
  }

  return <Redirect href="/(publictabs)" />;
}
