import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import { MSAL_CONFIG } from '@/constants/msal-config';

// Complete the auth session in the web browser (necessary for mobile redirection)
WebBrowser.maybeCompleteAuthSession();

export type MicrosoftUserProfile = {
  email: string;
  name: string;
  microsoftId: string;
};

/**
 * Executes Microsoft Sign-In OAuth flow and returns the Microsoft User Profile.
 */
export async function signInWithMicrosoft(): Promise<MicrosoftUserProfile> {
  if (!MSAL_CONFIG.clientId) {
    throw new Error(
      'Microsoft Client ID is missing. Please set EXPO_PUBLIC_MICROSOFT_CLIENT_ID in your .env file.'
    );
  }

  const redirectUri = makeRedirectUri({
    scheme: MSAL_CONFIG.scheme,
    path: 'redirect',
  });

  const authUrl = `${MSAL_CONFIG.discovery.authorizationEndpoint}?client_id=${
    MSAL_CONFIG.clientId
  }&response_type=token&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(MSAL_CONFIG.scopes.join(' '))}`;

  try {
    console.log('[Microsoft Auth] Generated Redirect URI:', redirectUri);
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    console.log('[Microsoft Auth] WebBrowser result:', JSON.stringify(result, null, 2));

    if (result.type !== 'success') {
      throw new Error(`Sign-In failed: session was ${result.type}`);
    }

    // Parse the redirect URL containing the hash fragment with the token
    const url = result.url;
    const hash = url.split('#')[1];
    if (!hash) {
      throw new Error('No authentication details returned from Microsoft.');
    }

    // Safely parse key-value pairs from the hash fragment
    const params: { [key: string]: string } = {};
    hash.split('&').forEach((part) => {
      const [key, value] = part.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });

    const accessToken = params['access_token'];
    if (!accessToken) {
      throw new Error('Access token not found in Microsoft response.');
    }

    // Fetch user details from Microsoft Graph API
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to retrieve user profile from Microsoft Graph');
    }

    const data = await response.json();
    
    if (!data.mail && !data.userPrincipalName) {
      throw new Error('No email address associated with this Microsoft account.');
    }

    const profile = {
      email: data.mail || data.userPrincipalName,
      name: data.displayName || 'Microsoft User',
      microsoftId: data.id,
    };

    console.log('[Microsoft Auth] Fetched Profile from Graph API:', JSON.stringify(profile, null, 2));

    return profile;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to authenticate with Microsoft.');
  }
}
