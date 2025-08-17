import { sql } from 'drizzle-orm';
import { db } from '../../../interfaces/api-gateway/src/db';

/**
 * Migration script to update database schema for Cognito integration
 */
export async function migrateToCognito() {
  console.log('Starting migration to add Cognito support...');
  
  try {
    // Add cognitoId column to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS cognito_id TEXT
    `);
    
    // Add unique constraint only if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'cognito_id_unique'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT cognito_id_unique UNIQUE (cognito_id);
        END IF;
      END $$
    `);
    
    console.log('Added cognito_id column to users table');
    
    // For existing users, we'll keep the password column temporarily
    // But make it nullable so new users won't need it
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'password' AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        END IF;
      END $$
    `);
    
    console.log('Modified password column to be nullable');
    
    // Update default provider to cognito
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'provider' 
          AND column_default IS DISTINCT FROM '''cognito'''
        ) THEN
          ALTER TABLE users ALTER COLUMN provider SET DEFAULT 'cognito';
        END IF;
      END $$
    `);
    
    console.log('Set default provider to cognito');
    
    console.log('Migration completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// The migration will be called from the routes file, no need for direct execution code