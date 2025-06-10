import * as crypto from 'crypto';

/**
 * Calculate the secret hash required by AWS Cognito when a client secret is present
 * 
 * @param username - The username of the user
 * @param clientId - The client ID of the app client in Cognito
 * @param clientSecret - The client secret of the app client in Cognito
 * @returns The calculated secret hash
 */
export function calculateSecretHash(
  username: string,
  clientId: string,
  clientSecret: string
): string {
  const message = username + clientId;
  const hmac = crypto.createHmac('sha256', clientSecret);
  hmac.update(message);
  return hmac.digest('base64');
}