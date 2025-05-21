import { sql } from 'drizzle-orm';
import { db } from '../db';

/**
 * Migration script to update database schema for Cognito integration
 */
export async function migrateToCognito() {
  console.log('Starting migration to add Cognito support...');
  
  try {
    // Add cognitoId column to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS cognito_id TEXT,
      ADD CONSTRAINT cognito_id_unique UNIQUE (cognito_id)
    `);
    
    console.log('Added cognito_id column to users table');
    
    // For existing users, we'll keep the password column temporarily
    // But make it nullable so new users won't need it
    await db.execute(sql`
      ALTER TABLE users 
      ALTER COLUMN password DROP NOT NULL
    `);
    
    console.log('Modified password column to be nullable');
    
    // Update default provider to cognito
    await db.execute(sql`
      ALTER TABLE users 
      ALTER COLUMN provider SET DEFAULT 'cognito'
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