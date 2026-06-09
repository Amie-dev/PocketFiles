import * as SecureStore from "expo-secure-store";

const PIN_KEY = "private_mode_pin";

export async function savePin(pin: string) {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function getPin() {
  return await SecureStore.getItemAsync(PIN_KEY);
}

export async function hasPin() {
  const pin = await getPin();
  return !!pin;
}

export async function checkPin(inputPin: string) {
  const savedPin = await getPin();
  return savedPin === inputPin;
}

export async function deletePin() {
  await SecureStore.deleteItemAsync(PIN_KEY);
}