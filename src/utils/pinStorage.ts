import * as SecureStore from "expo-secure-store";

const PIN_KEY = "private_mode_pin";

export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function getPin(): Promise<string | null> {
  return await SecureStore.getItemAsync(PIN_KEY);
}

export async function hasPin(): Promise<boolean> {
  const pin = await getPin();
  return pin !== null;
}

export async function checkPin(inputPin: string): Promise<boolean> {
  const savedPin = await getPin();

  if (!savedPin) {
    return false;
  }

  return savedPin === inputPin;
}

export async function changePin(
  oldPin: string,
  newPin: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const savedPin = await getPin();

  if (!savedPin) {
    return {
      success: false,
      message: "No PIN found",
    };
  }

  if (savedPin !== oldPin) {
    return {
      success: false,
      message: "Current PIN is incorrect",
    };
  }

  if (newPin.length < 4) {
    return {
      success: false,
      message: "PIN must be at least 4 digits",
    };
  }

  await SecureStore.setItemAsync(PIN_KEY, newPin);

  return {
    success: true,
    message: "PIN changed successfully",
  };
}

export async function deletePin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}