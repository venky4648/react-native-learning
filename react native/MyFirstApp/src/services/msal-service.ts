import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import { API_URL } from '@/constants/api';
import * as Linking from 'expo-linking';

// Complete the auth session in the web browser (necessary for mobile redirection)
WebBrowser.maybeCompleteAuthSession();

export type BackendUserProfile = {
  token: string;
  _id: string;
  name: string;
  email: string;
};

/**
 * Executes Microsoft Sign-In OAuth flow and returns the Microsoft User Profile.
 */
export async function signInWithMicrosoft(): Promise<BackendUserProfile> {
  const authUrl = `${API_URL}/auth/microsoft/login`;
  
  const redirectUri = makeRedirectUri({
    scheme: 'myfirstapp',
    path: 'redirect',
  });

  let redirectedUrl: string | null = null;

  // Add listener for incoming deep links
  const subscription = Linking.addEventListener('url', (event) => {
    console.log('[Microsoft Auth] Deep link listener received URL:', event.url);
    if (event.url.includes('token=')) {
      redirectedUrl = event.url;
    }
  });

  try {
    console.log('[Microsoft Auth] Opening backend oauth page:', authUrl);
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    console.log('[Microsoft Auth] WebBrowser result:', JSON.stringify(result, null, 2));

    // Remove listener
    subscription.remove();

    // Determine the URL to use (either from result or deep link listener)
    const finalUrl = (result.type === 'success' ? result.url : null) || redirectedUrl;

    if (!finalUrl || !finalUrl.includes('token=')) {
      throw new Error(`Sign-In failed: session was ${result.type}`);
    }

    // Parse the redirect URL containing the query parameter with the token
    const hash = finalUrl.split('?')[1] || finalUrl.split('#')[1];
    if (!hash) {
      throw new Error('No authentication details returned from Microsoft.');
    }

    // Safely parse key-value pairs from the query fragment
    const params: { [key: string]: string } = {};
    hash.split('&').forEach((part) => {
      const [key, value] = part.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });

    const token = params['token'];
    const _id = params['_id'];
    const name = params['name'];
    const email = params['email'];

    if (!token || !_id || !email) {
      throw new Error('Authentication parameters are missing in response.');
    }

    return {
      token,
      _id,
      name: name || 'Microsoft User',
      email,
    };
  } catch (error: any) {
    subscription.remove();
    throw new Error(error.message || 'Failed to authenticate with Microsoft.');
  }
}
