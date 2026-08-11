export const MSAL_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID || '',
  tenantId: process.env.EXPO_PUBLIC_MICROSOFT_TENANT_ID || 'common',
  scheme: 'myfirstapp',
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  discovery: {
    authorizationEndpoint: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`,
    tokenEndpoint: `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
  },
};
