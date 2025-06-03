import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32).optional(),
  
  // AWS Cognito
  VITE_AWS_COGNITO_CLIENT_ID: z.string().min(1),
  VITE_AWS_COGNITO_REGION: z.string().min(1),
  VITE_AWS_COGNITO_USER_POOL_ID: z.string().min(1),
  AWS_COGNITO_CLIENT_SECRET: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  
  // SendGrid
  SENDGRID_API_KEY: z.string().startsWith('SG.').optional(),
  
  // Replit specific
  REPLIT_DEV_DOMAIN: z.string().optional(),
  REPLIT_DEPLOYMENT_URL: z.string().optional(),
  REPLIT_DOMAINS: z.string().optional(),
});

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

export const env = validateEnv();
export type Environment = z.infer<typeof envSchema>;