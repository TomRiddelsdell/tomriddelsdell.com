import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: number;
    user?: {
      id: number;
      email: string;
      displayName: string;
      cognitoId: string;
      role: string;
    };
  }
}