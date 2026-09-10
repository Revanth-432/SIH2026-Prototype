import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';

export default function Index() {
  const { session, role } = useAuthStore();

  if (session) {
    if (role === 'BUYER' || role === 'B2B_BUYER') {
      return <Redirect href="/(app)/buyer/feed" />;
    }
    return <Redirect href="/(app)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}
