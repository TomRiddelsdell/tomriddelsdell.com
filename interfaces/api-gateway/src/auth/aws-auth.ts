import { Strategy as OAuthStrategy } from 'passport-oauth2';
import { Request } from 'express';
import passport from 'passport';
import { storage } from './storage';

// AWS Cognito OAuth2 strategy
export function setupAwsAuth() {
  if (!process.env.VITE_AWS_COGNITO_CLIENT_ID || !process.env.AWS_COGNITO_CLIENT_SECRET) {
    console.warn('AWS credentials not found. AWS authentication will not be available.');
    return;
  }

  // Use centralized configuration for domains
  const { getConfig } = require('../../../../infrastructure/configuration/config-loader');
  const config = getConfig();
  const appDomain = config.services.external.baseUrl;

  // Use environment variables if available, otherwise use defaults
  const region = process.env.VITE_AWS_COGNITO_REGION || 'us-east-1';
  const userPoolDomain = process.env.AWS_USER_POOL_DOMAIN || 
                        `https://tom-riddelsdell-portfolio.auth.${region}.amazoncognito.com`;

  passport.use('aws', new OAuthStrategy({
    authorizationURL: `${userPoolDomain}/oauth2/authorize`,
    tokenURL: `${userPoolDomain}/oauth2/token`,
    clientID: process.env.VITE_AWS_COGNITO_CLIENT_ID!,
    clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET!,
    callbackURL: `${appDomain}/auth/aws/callback`,
    passReqToCallback: true
  }, async (req: Request, accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Extract user info from the JWT token or fetch from the userInfo endpoint
      const userInfo = profile;
      
      // Look for existing user
      let user = await storage.getUserByEmail(userInfo.email);
      
      if (!user) {
        // Create new user if not exists
        const username = userInfo.email.split('@')[0];
        const displayName = userInfo.name || username;
        
        user = await storage.createUser({
          username,
          email: userInfo.email,
          provider: 'aws',
          displayName,
          photoURL: userInfo.picture || null
        });
      }
      
      // Track login
      try {
        const clientIP = req.headers['x-forwarded-for'] || 
                       req.socket.remoteAddress || 
                       'unknown';
        await storage.trackUserLogin(user.id);
        
        console.log(`AWS user ${user.username} (ID: ${user.id}) logged in from ${clientIP}`);
      } catch (error) {
        console.error('Error tracking login:', error);
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Error during AWS authentication:', error);
      return done(error);
    }
  }));
}