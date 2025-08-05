import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Manual parsing to debug
const envContent = readFileSync('.env', 'utf-8');
console.log('First 10 lines of .env:');
envContent.split('\n').slice(0, 10).forEach((line, i) => {
  console.log(`${i + 1}: ${line}`);
});

console.log('\nSearching for specific variables:');
const lines = envContent.split('\n');
const nodeEnvLine = lines.find(line => line.startsWith('NODE_ENV='));
const sessionSecretLine = lines.find(line => line.startsWith('SESSION_SECRET='));
const databaseUrlLine = lines.find(line => line.startsWith('DATABASE_URL='));

console.log('NODE_ENV line:', nodeEnvLine);
console.log('SESSION_SECRET line found:', !!sessionSecretLine);
console.log('DATABASE_URL line found:', !!databaseUrlLine);

config();

console.log('\nAfter dotenv.config():');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('SESSION_SECRET exists:', !!process.env.SESSION_SECRET);
