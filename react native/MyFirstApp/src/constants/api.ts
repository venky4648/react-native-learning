import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Backend API Base URL configuration.
 * Automatically detects whether you are running on an emulator,
 * web, or physical phone via Expo.
 */
// Change this to true if using USB with adb reverse, or false for Wi-Fi/Simulator
const USE_USB_TUNNEL = true;

const getBaseUrl = () => {
  // In production (Release Build / APK), always use the live cloud backend
  if (!__DEV__) {
    return 'https://myfirstapp-backend-kfl7.onrender.com/api';
  }

  // If running on the web, connect to localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  if (USE_USB_TUNNEL) {
    return 'http://127.0.0.1:5000/api';
  }

  // Get the host IP address from Expo bundler (e.g., 10.201.209.164 or 192.168.x.x)
  const hostUri = Constants.expoConfig?.hostUri;
  const devMachineIp = hostUri ? hostUri.split(':')[0] : null;

  if (Platform.OS === 'android') {
    // If no Dev Machine IP is found, fallback to standard emulator loopback (10.0.2.2)
    // or USB connection loopback (127.0.0.1)
    if (!devMachineIp) {
      return 'http://10.0.2.2:5000/api';
    }
    // If a physical device is connected via USB and using adb reverse,
    // we can also fall back to 127.0.0.1 if needed, but the devMachineIp works over network.
    return `http://${devMachineIp}:5000/api`;
  }

  // iOS Simulator or Physical iOS device
  return devMachineIp ? `http://${devMachineIp}:5000/api` : 'http://localhost:5000/api';
};

export const API_URL = getBaseUrl();
