import AsyncStorage from "@react-native-async-storage/async-storage";

export async function setValue<T>(
  key: string,
  value: T
) {
  await AsyncStorage.setItem(
    key,
    JSON.stringify(value)
  );
}

export async function getValue<T>(
  key: string
): Promise<T | null> {
  const value = await AsyncStorage.getItem(key);

  if (!value) return null;

  return JSON.parse(value);
}

export async function removeValue(key: string) {
  await AsyncStorage.removeItem(key);
}