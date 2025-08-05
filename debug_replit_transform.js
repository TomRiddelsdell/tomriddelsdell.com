// Debug script to test REPLIT_DOMAINS transformation logic
process.env.NODE_ENV = 'production';
process.env.REPLIT_DOMAINS = 'my-app.replit.app';

console.log('=== Test Case 1: BASE_URL deleted ===');
delete process.env.BASE_URL;
console.log('process.env.BASE_URL:', process.env.BASE_URL);
console.log('!process.env.BASE_URL:', !process.env.BASE_URL);
console.log('!process.env.BASE_URL || process.env.BASE_URL.trim() === "":', !process.env.BASE_URL || (process.env.BASE_URL && process.env.BASE_URL.trim() === ''));

console.log('\n=== Test Case 2: BASE_URL set to empty string ===');
process.env.BASE_URL = '';
console.log('process.env.BASE_URL:', JSON.stringify(process.env.BASE_URL));
console.log('!process.env.BASE_URL:', !process.env.BASE_URL);
console.log('process.env.BASE_URL.trim() === "":', process.env.BASE_URL.trim() === '');
console.log('!process.env.BASE_URL || process.env.BASE_URL.trim() === "":', !process.env.BASE_URL || process.env.BASE_URL.trim() === '');
