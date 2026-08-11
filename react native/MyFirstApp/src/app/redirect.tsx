import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Handle incoming Microsoft OAuth redirect path.
 * This screen intercepts the 'myfirstapp://redirect' URL and routes the user back to the home page.
 */
export default function RedirectScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
