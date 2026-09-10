import Constants from 'expo-constants';

/**
 * Dynamically resolves the backend API base URL:
 * 1. Checks if connected to Metro dev server via Expo Go, extracting the host machine's IP (e.g., 192.168.137.1 or 10.60.10.194).
 * 2. Falls back to EXPO_PUBLIC_API_URL if defined and non-localhost.
 * 3. Falls back to default Hotspot / LAN IP.
 */
export function getApiBaseUrl(): string {
  // 1. If Expo provides the hostUri the phone used to download the bundle, use that exact IP
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000/api/v1`;
    }
  }

  // 2. Fall back to EXPO_PUBLIC_API_URL in .env
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    const trimmed = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    if (!trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) {
      return trimmed.endsWith('/v1')
        ? trimmed
        : `${trimmed.replace(/\/api$/, '')}/api/v1`;
    }
  }

  // 3. Fallback to Hotspot gateway IP
  return 'http://10.28.70.162:3000/api/v1';
}
